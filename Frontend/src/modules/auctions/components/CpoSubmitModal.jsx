import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, ModalCloseButton } from '@enderass/shared/ui';
import { FileUpload } from '../../../components/FileUpload.jsx';
import { cpoService } from '../../cpo-management/services/cpo-service.js';
import { formatEtbAmount } from '@enderass/shared/utils';
import { computeRequiredCpoFromBidAmounts } from '../utils/auction-lot-utils.js';

/**
 * @param {{
 *   open: boolean,
 *   loading?: boolean,
 *   auction?: object|null,
 *   participation?: object|null,
 *   onClose: () => void,
 *   onSubmit: () => Promise<void>,
 * }} props
 */
export function CpoSubmitModal({ open, loading = false, auction, participation, onClose, onSubmit }) {
  const { t } = useTranslation();
  const [documentUrl, setDocumentUrl] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const lots = useMemo(() => auction?.lots || [], [auction?.lots]);
  const cpoPercentage = Number(auction?.cpoPercentage ?? auction?.cpo_percentage ?? 0);
  const draftBids = useMemo(() => participation?.bidDrafts || [], [participation?.bidDrafts]);
  const selectedLotIds = useMemo(
    () => draftBids.map((draft) => draft.auctionAssetId).filter(Boolean),
    [draftBids],
  );

  const requiredCpoAmount = useMemo(() => {
    if (participation?.requiredCpoAmountPreview) {
      return Number(participation.requiredCpoAmountPreview) || 0;
    }
    return computeRequiredCpoFromBidAmounts(draftBids, cpoPercentage);
  }, [cpoPercentage, draftBids, participation?.requiredCpoAmountPreview]);

  if (!open) return null;

  const busy = loading || submitting;

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!auction?.id) return;
    if (!documentUrl) {
      setError(t('bidder.participation.cpoModal.documentRequired'));
      return;
    }

    if (!draftBids.length) {
      setError(t('bidder.participation.cpoModal.bidRequired'));
      return;
    }

    setError('');
    setSubmitting(true);
    try {
      await cpoService.createCpo({
        auctionId: auction.id,
        documentUrl,
        selectedAuctionAssetIds: selectedLotIds.length ? selectedLotIds : undefined,
        proposedBids: draftBids.map((draft) => ({
          auctionAssetId: draft.auctionAssetId || undefined,
          amount: draft.amount,
        })),
      });
      await onSubmit();
      setDocumentUrl('');
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
        <ModalCloseButton onClick={onClose} disabled={busy} />
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

        {draftBids.length > 0 && (
          <fieldset className="auction-lot-picker">
            <legend className="auction-lot-picker__legend">
              {t('bidder.participation.cpoModal.selectedBids')}
            </legend>
            <p className="auction-lot-picker__hint">
              {t('bidder.participation.cpoModal.selectedBidsHint', { percentage: cpoPercentage })}
            </p>
            <ul className="auction-lot-picker__list">
              {draftBids.map((draft, index) => {
                const lot = lots.find((entry) => entry.id === draft.auctionAssetId);
                const label = lot?.lotLabel || lot?.assetTitle || t('bidder.participation.cpoModal.lotFallback', { index: index + 1 });
                return (
                  <li key={draft.id || draft.auctionAssetId || index} className="auction-lot-picker__item">
                    <div className="auction-lot-picker__label">
                      <span className="auction-lot-picker__copy">
                        <strong>{label}</strong>
                        <span>{formatEtbAmount(draft.amount)}</span>
                      </span>
                    </div>
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
