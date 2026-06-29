import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../../../components/Button.jsx';
import { FileUpload } from '../../../components/FileUpload.jsx';
import { cpoService } from '../../cpo-management/services/cpo-service.js';
import { formatEtbAmount } from '../utils/auction-drawer-utils.js';
import { computeRequiredCpoAmount, isMultiLotAuction } from '../utils/auction-lot-utils.js';

/**
 * @param {{
 *   open: boolean,
 *   loading?: boolean,
 *   auction?: object|null,
 *   onClose: () => void,
 *   onSubmit: () => Promise<void>,
 * }} props
 */
export function CpoSubmitModal({ open, loading = false, auction, onClose, onSubmit }) {
  const { t } = useTranslation();
  const [documentUrl, setDocumentUrl] = useState('');
  const [selectedLotIds, setSelectedLotIds] = useState([]);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const lots = useMemo(() => auction?.lots || [], [auction?.lots]);
  const isMultiLot = isMultiLotAuction(auction);
  const cpoPercentage = Number(auction?.cpoPercentage ?? auction?.cpo_percentage ?? 0);

  const requiredCpoAmount = useMemo(() => {
    if (!lots.length) {
      const reserve = Number(auction?.reservePrice ?? auction?.reserve_price ?? 0);
      if (!Number.isFinite(reserve) || reserve <= 0 || !cpoPercentage) {
        return 0;
      }
      return computeRequiredCpoAmount(
        [{ id: 'legacy', reservePrice: reserve }],
        ['legacy'],
        cpoPercentage,
      );
    }

    const effectiveSelection = isMultiLot
      ? selectedLotIds
      : (selectedLotIds.length ? selectedLotIds : lots.length === 1 ? [lots[0].id] : []);

    return computeRequiredCpoAmount(lots, effectiveSelection, cpoPercentage);
  }, [auction, cpoPercentage, isMultiLot, lots, selectedLotIds]);

  if (!open) return null;

  const busy = loading || submitting;

  const toggleLot = (lotId) => {
    setSelectedLotIds((current) => (
      current.includes(lotId)
        ? current.filter((id) => id !== lotId)
        : [...current, lotId]
    ));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!auction?.id) return;
    if (!documentUrl) {
      setError(t('bidder.participation.cpoModal.documentRequired'));
      return;
    }

    if (isMultiLot && !selectedLotIds.length) {
      setError(t('bidder.participation.cpoModal.lotsRequired'));
      return;
    }

    setError('');
    setSubmitting(true);
    try {
      await cpoService.createCpo({
        auctionId: auction.id,
        documentUrl,
        selectedAuctionAssetIds: isMultiLot ? selectedLotIds : undefined,
      });
      await onSubmit();
      setDocumentUrl('');
      setSelectedLotIds([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('bidder.participation.cpoModal.failed'));
      throw err;
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="kyc-modal-overlay" role="presentation" onClick={busy ? undefined : onClose}>
      <form
        className="kyc-modal kyc-modal--wide"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cpo-submit-title"
        onClick={(event) => event.stopPropagation()}
        onSubmit={handleSubmit}
      >
        <h2 id="cpo-submit-title" className="kyc-modal__title">
          {t('bidder.participation.cpoModal.title')}
        </h2>
        <p className="kyc-modal__body">{t('bidder.participation.cpoModal.subtitle')}</p>

        <dl className="auction-participation-modal__meta">
          <dt>{t('bidder.participation.cpoModal.auction')}</dt>
          <dd>{auction?.title || '—'}</dd>
          {cpoPercentage > 0 && (
            <>
              <dt>{t('bidder.participation.cpoModal.cpoPercentage')}</dt>
              <dd>{cpoPercentage}%</dd>
            </>
          )}
          {requiredCpoAmount > 0 && (
            <>
              <dt>{t('bidder.participation.cpoModal.requiredAmount')}</dt>
              <dd>{formatEtbAmount(requiredCpoAmount)}</dd>
            </>
          )}
        </dl>

        {isMultiLot && (
          <fieldset className="auction-lot-picker">
            <legend className="auction-lot-picker__legend">
              {t('bidder.participation.cpoModal.selectLots')}
            </legend>
            <p className="auction-lot-picker__hint">
              {t('bidder.participation.cpoModal.selectLotsHint', { percentage: cpoPercentage })}
            </p>
            <ul className="auction-lot-picker__list">
              {lots.map((lot) => {
                const checked = selectedLotIds.includes(lot.id);
                const label = lot.lotLabel || lot.assetTitle || t('bidder.participation.cpoModal.lotFallback');
                return (
                  <li key={lot.id} className="auction-lot-picker__item">
                    <label className="auction-lot-picker__label">
                      <input
                        type="checkbox"
                        checked={checked}
                        disabled={busy}
                        onChange={() => toggleLot(lot.id)}
                      />
                      <span className="auction-lot-picker__copy">
                        <strong>{label}</strong>
                        <span>{formatEtbAmount(lot.reservePrice)}</span>
                      </span>
                    </label>
                  </li>
                );
              })}
            </ul>
          </fieldset>
        )}

        <FileUpload
          label={t('bidder.participation.cpoModal.document')}
          folder="cpo/documents"
          accept="application/pdf,image/jpeg,image/png,image/webp"
          disabled={busy}
          onUpload={(result) => setDocumentUrl(result?.fileUrl || result?.url || '')}
        />
        {documentUrl && (
          <p className="kyc-modal__hint">{t('bidder.participation.cpoModal.documentUploaded')}</p>
        )}

        {error && (
          <p className="kyc-modal__error" role="alert">
            {error}
          </p>
        )}

        <div className="kyc-modal__actions">
          <Button type="button" variant="secondary" onClick={onClose} disabled={busy}>
            {t('admin.cancel')}
          </Button>
          <Button type="submit" variant="primary" disabled={busy}>
            <span className="auction-confirm-modal__btn-content">
              {busy && <span className="auction-confirm-modal__spinner" aria-hidden="true" />}
              {busy
                ? t('bidder.participation.cpoModal.submitting')
                : t('bidder.participation.cpoModal.submit')}
            </span>
          </Button>
        </div>
      </form>
    </div>
  );
}

export default CpoSubmitModal;
