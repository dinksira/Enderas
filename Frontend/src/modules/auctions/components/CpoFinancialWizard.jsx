import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, ModalCloseButton } from '@enderass/shared/ui';
import { FileUpload } from '../../../components/FileUpload.jsx';
import { useCpoWizardStore, CPO_WIZARD_STEPS } from '@enderass/shared/stores';
import { formatEtbAmount, computeCpoDepositAmount } from '@enderass/shared/utils';
import { LiveCountdown } from '@enderass/shared/ui';

function AssetBidInput({ asset, amount, error, onChange, disabled }) {
  const { t } = useTranslation();
  const reserve = Number(asset.reservePrice ?? asset.reserve_price ?? 0);
  const isValid = amount === '' || Number(amount) >= reserve;
  const borderColor = error || (amount !== '' && !isValid) ? '#d32f2f' : '#ccc';

  return (
    <div className="cpo-wizard__asset-row" style={{
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      padding: '12px 0',
      borderBottom: '1px solid #eee',
    }}>
      <div style={{ flex: 1 }}>
        <p style={{ margin: '0 0 2px', fontWeight: 600, fontSize: 14 }}>
          {asset.assetTitle || asset.title || asset.name || '—'}
        </p>
        {reserve > 0 && (
          <p style={{ margin: 0, fontSize: 12, color: '#666' }}>
            {t('bidder.browse.placeBid.reservePrice')}: {formatEtbAmount(reserve)}
          </p>
        )}
      </div>
      <div style={{ minWidth: 160 }}>
        <input
          type="number"
          className="input-field__control"
          style={{ borderColor, width: '100%' }}
          placeholder={t('bidder.browse.placeBid.amount')}
          value={amount}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          min={reserve || 0}
          step="0.01"
        />
        {amount !== '' && !isValid && (
          <p style={{ margin: '2px 0 0', fontSize: 11, color: '#d32f2f' }}>
            {t('bidder.browse.placeBid.minBidError', 'Minimum bid is {{amount}} ETB', {
              amount: formatEtbAmount(reserve),
            })}
          </p>
        )}
      </div>
    </div>
  );
}

export function CpoFinancialWizard({
  open,
  auction,
  bidDrafts = [],
  onClose,
  onSuccess,
}) {
  const { t } = useTranslation();
  const store = useCpoWizardStore();
  const [localAmounts, setLocalAmounts] = useState({});
  const [isAuctionClosed, setIsAuctionClosed] = useState(false);

  const assets = useMemo(() => {
    const lots = auction?.lots ?? [];
    if (!lots.some((lot) => Array.isArray(lot.assets) && lot.assets.length > 0)) {
      return lots.map((lot) => ({
        ...lot,
        id: lot.id ?? lot.auctionAssetId,
        lotTitle: lot.lotTitle ?? lot.lotLabel ?? lot.title,
      }));
    }
    return lots.flatMap((lot) => {
      const lotAssets = lot.assets ?? [];
      return lotAssets.map((a) => ({ ...a, lotTitle: lot.title || lot.lotTitle }));
    });
  }, [auction?.lots]);

  const cpoPercentage = Number(auction?.cpoPercentage ?? auction?.cpo_percentage ?? 0);

  const totalDeposit = useMemo(() => {
    const inlineData = typeof open === 'object' ? open : null;
    const bidsToCalculate = inlineData?.draftBidAmounts 
      ? Object.entries(inlineData.draftBidAmounts).map(([k, v]) => [k, v])
      : Object.entries(localAmounts).filter(([, v]) => v !== '' && Number(v) > 0);

    return bidsToCalculate.reduce((sum, [assetId, amount]) => {
      const asset = assets.find((a) => (a.id ?? a.auctionAssetId) === assetId);
      const reserve = Number(asset?.reservePrice ?? asset?.reserve_price ?? 0);
      return sum + computeCpoDepositAmount(reserve, cpoPercentage);
    }, 0);
  }, [localAmounts, assets, cpoPercentage, open]);

  const allValid = useMemo(() => {
    if (Object.keys(localAmounts).length === 0) return false;
    return Object.entries(localAmounts).every(([assetId, amount]) => {
      if (amount === '' || Number(amount) <= 0) return false;
      const asset = assets.find((a) => (a.id ?? a.auctionAssetId) === assetId);
      const reserve = Number(asset?.reservePrice ?? asset?.reserve_price ?? 0);
      return Number(amount) >= reserve;
    });
  }, [localAmounts, assets]);

  useEffect(() => {
    if (!auction?.end_date && !auction?.endDate) return;
    const end = new Date(auction.end_date ?? auction.endDate);
    const tick = () => setIsAuctionClosed(new Date() > end);
    tick();
    const interval = setInterval(tick, 10_000);
    return () => clearInterval(interval);
  }, [auction?.end_date, auction?.endDate]);

  useEffect(() => {
    if (!open) {
      store.reset();
      setLocalAmounts({});
      return;
    }
    
    const inlineData = typeof open === 'object' ? open : null;
    if (inlineData?.draftBidAmounts) {
      const bids = Object.entries(inlineData.draftBidAmounts)
        .filter(([, v]) => v !== '' && Number(v) > 0)
        .map(([assetId, amount]) => ({
          auctionAssetId: assetId,
          amount: Number(amount),
        }));
      store.setBids(bids);
      store.setStep(CPO_WIZARD_STEPS.CPO_UPLOAD);
      return;
    }

    if (assets.length > 0 && bidDrafts.length > 0) {
      const initial = {};
      bidDrafts.forEach((d) => {
        if (d.auctionAssetId) initial[d.auctionAssetId] = String(d.amount);
      });
      setLocalAmounts((prev) => ({ ...initial, ...prev }));
    }
  }, [open, assets.length]);

  const handleNext = () => {
    const bids = Object.entries(localAmounts)
      .filter(([, v]) => v !== '' && Number(v) > 0)
      .map(([assetId, amount]) => ({
        auctionAssetId: assetId,
        amount: Number(amount),
      }));

    store.setBids(bids);
    store.setStep(CPO_WIZARD_STEPS.CPO_UPLOAD);
  };

  const handleSubmit = async () => {
    await store.submit(auction?.id);
    onSuccess?.();
  };

  if (!open) return null;

  const busy = store.submitting || isAuctionClosed;

  return (
    <div className="kyc-modal-overlay" role="presentation" onClick={busy ? undefined : onClose}>
      <div
        className="kyc-modal kyc-modal--wide"
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <ModalCloseButton onClick={onClose} disabled={busy} />

        {isAuctionClosed && (
          <div className="cpo-wizard__closed-banner" style={{
            background: '#fff3e0',
            border: '1px solid #ffb74d',
            borderRadius: 8,
            padding: '12px 16px',
            marginBottom: 16,
            textAlign: 'center',
            fontWeight: 600,
            fontSize: 14,
            color: '#e65100',
          }}>
            ⏰ {t('bidder.participation.auctionClosed', 'This auction has closed. Bidding is no longer accepted.')}
          </div>
        )}

        {auction?.end_date && (
          <LiveCountdown targetDate={auction.end_date ?? auction.endDate} />
        )}

        <h2 className="kyc-modal__title">
          {t('bidder.participation.cpoWizard.title', 'CPO Financial Wizard')}
        </h2>

        {store.step === CPO_WIZARD_STEPS.BID_ENTRY && (
          <>
            <p className="kyc-modal__body">
              {t('bidder.participation.cpoWizard.bidEntrySubtitle', 'Enter your bid amounts for each asset.')}
            </p>

            <div className="cpo-wizard__asset-list">
              {assets.length === 0 && (
                <p className="kyc-modal__hint">{t('bidder.browse.lots.noAssets', 'No assets available')}</p>
              )}
              {assets.map((asset) => {
                const assetId = asset.id ?? asset.auctionAssetId;
                if (!assetId) return null;
                return (
                  <AssetBidInput
                    key={assetId}
                    asset={asset}
                    amount={localAmounts[assetId] ?? ''}
                    error={false}
                    onChange={(val) => setLocalAmounts((prev) => ({ ...prev, [assetId]: val }))}
                    disabled={busy}
                  />
                );
              })}
            </div>

            {cpoPercentage > 0 && totalDeposit > 0 && (
              <div className="cpo-wizard__deposit-summary" style={{
                marginTop: 16,
                padding: 12,
                background: '#f5f5f5',
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 600,
                textAlign: 'center',
              }}>
                {t('bidder.participation.cpoWizard.totalDeposit', 'Total CPO Deposit Required: {{amount}} ETB', {
                  amount: formatEtbAmount(totalDeposit),
                })}
              </div>
            )}

            <div className="kyc-modal__actions">
              <Button variant="secondary" onClick={onClose} disabled={busy}>
                {t('admin.cancel')}
              </Button>
              <Button variant="primary" onClick={handleNext} disabled={busy || !allValid}>
                {t('admin.next')}
              </Button>
            </div>
          </>
        )}

        {store.step === CPO_WIZARD_STEPS.CPO_UPLOAD && (
          <>
            <p className="kyc-modal__body">
              {t('bidder.participation.cpoWizard.uploadSubtitle', 'Upload your CPO payment receipt.')}
            </p>

            {totalDeposit > 0 && (
              <div className="auction-participation-modal__meta" style={{ marginBottom: 16 }}>
                <dt>{t('bidder.participation.cpoModal.requiredAmount')}</dt>
                <dd style={{ fontWeight: 700, fontSize: 16 }}>{formatEtbAmount(totalDeposit)}</dd>
              </div>
            )}

            <FileUpload
              label={t('bidder.participation.cpoModal.document')}
              folder="cpo/documents"
              accept="application/pdf,image/jpeg,image/png,image/webp"
              disabled={busy}
              onUpload={(result) => store.setReceiptUrl(result?.fileUrl || result?.url || '')}
            />

            <div className="kyc-modal__field">
              <label className="kyc-modal__label" htmlFor="cpo-wizard-txn-ref">
                {t('bidder.participation.cpoModal.transactionRef', { defaultValue: 'Transaction Reference (optional)' })}
              </label>
              <input
                id="cpo-wizard-txn-ref"
                type="text"
                className="input-field__control"
                value={store.transactionRef}
                onChange={(e) => store.setTransactionRef(e.target.value)}
                disabled={busy}
                placeholder="TXN-..."
              />
            </div>

            {store.error && (
              <p className="kyc-modal__error" role="alert">{store.error}</p>
            )}

            <div className="kyc-modal__actions">
              <Button variant="secondary" onClick={() => store.setStep(CPO_WIZARD_STEPS.BID_ENTRY)} disabled={busy}>
                {t('admin.back')}
              </Button>
              <Button variant="primary" onClick={handleSubmit} disabled={busy || !store.receiptUrl}>
                {busy
                  ? t('bidder.participation.cpoModal.submitting')
                  : t('bidder.participation.cpoWizard.submitForReview', 'Submit for Review')}
              </Button>
            </div>
          </>
        )}

        {store.step === CPO_WIZARD_STEPS.SUBMITTED && (
          <div style={{ textAlign: 'center', padding: '32px 16px' }}>
            <div style={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              background: '#4caf50',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
            }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h3 className="kyc-modal__title" style={{ color: '#2e7d32' }}>
              {t('bidder.participation.cpoWizard.successTitle', 'Submitted Successfully!')}
            </h3>
            <p className="kyc-modal__body">
              {t('bidder.participation.cpoWizard.successBody', 'Your bids and CPO receipt have been submitted for review. You will be notified once Finance approves your deposit.')}
            </p>
            <div className="kyc-modal__actions" style={{ justifyContent: 'center' }}>
              <Button variant="primary" onClick={onClose}>
                {t('common.close')}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default CpoFinancialWizard;
