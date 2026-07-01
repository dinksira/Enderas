import { Button } from '@enderass/shared/ui';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
/**
 * @param {{
 *   open: boolean,
 *   loading?: boolean,
 *   error?: string,
 *   auctionTitle?: string,
 *   onConfirm: () => void,
 *   onCancel: () => void,
 * }} props
 */
export function AuctionSuspendConfirmModal({
  open,
  loading = false,
  error = '',
  auctionTitle = '',
  onConfirm,
  onCancel,
}) {
  const { t } = useTranslation();

  useEffect(() => {
    if (!open) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && !loading) {
        onCancel();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, loading, onCancel]);

  if (!open) return null;

  return (
    <div
      className="kyc-modal-overlay kyc-modal-overlay--auction-confirm"
      role="presentation"
      onClick={loading ? undefined : onCancel}
    >
      <div
        className="kyc-modal auction-confirm-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="auction-suspend-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="auction-suspend-modal-title" className="kyc-modal__title">
          {t('auctions.confirmModals.suspend.title')}
        </h2>
        <p className="kyc-modal__body">
          {t('auctions.confirmModals.suspend.bodyIntro')}{' '}
          <strong className="auction-confirm-modal__emphasis">{auctionTitle}</strong>
          {t('auctions.confirmModals.suspend.bodyRest')}
        </p>

        {error && (
          <p className="kyc-modal__error" role="alert">
            {error}
          </p>
        )}

        <div className="kyc-modal__actions">
          <Button variant="secondary" onClick={onCancel} disabled={loading}>
            {t('auctions.confirmModals.cancel')}
          </Button>
          <Button
            variant="secondary"
            className="btn--auction-warning-confirm"
            onClick={onConfirm}
            disabled={loading}
          >
            <span className="auction-confirm-modal__btn-content">
              {loading && <span className="auction-confirm-modal__spinner" aria-hidden="true" />}
              {loading
                ? t('auctions.confirmModals.suspend.processing')
                : t('auctions.confirmModals.suspend.confirm')}
            </span>
          </Button>
        </div>
      </div>
    </div>
  );
}

export default AuctionSuspendConfirmModal;
