import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../../../components/Button.jsx';
import { Input } from '../../../components/Input.jsx';

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
export function AuctionDeleteConfirmModal({
  open,
  loading = false,
  error = '',
  auctionTitle = '',
  onConfirm,
  onCancel,
}) {
  const { t } = useTranslation();
  const [confirmText, setConfirmText] = useState('');

  useEffect(() => {
    if (!open) {
      setConfirmText('');
    }
  }, [open]);

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

  const titleMatches = confirmText === auctionTitle;
  const canDelete = titleMatches && !loading;

  const handleConfirm = () => {
    if (!canDelete) return;
    onConfirm();
  };

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
        aria-labelledby="auction-delete-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="auction-delete-modal-title" className="kyc-modal__title">
          {t('auctions.confirmModals.delete.title')}
        </h2>
        <p className="kyc-modal__body">
          {t('auctions.confirmModals.delete.bodyIntro')}{' '}
          <strong className="auction-confirm-modal__emphasis">{auctionTitle}</strong>
          {t('auctions.confirmModals.delete.bodyRest')}
        </p>

        <Input
          label={t('auctions.confirmModals.delete.confirmLabel')}
          value={confirmText}
          onChange={(event) => setConfirmText(event.target.value)}
          disabled={loading}
          autoComplete="off"
          className="auction-confirm-modal__input"
        />

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
            className="btn--auction-danger-confirm"
            onClick={handleConfirm}
            disabled={!canDelete}
          >
            <span className="auction-confirm-modal__btn-content">
              {loading && <span className="auction-confirm-modal__spinner" aria-hidden="true" />}
              {loading
                ? t('auctions.confirmModals.delete.processing')
                : t('auctions.confirmModals.delete.confirm')}
            </span>
          </Button>
        </div>
      </div>
    </div>
  );
}

export default AuctionDeleteConfirmModal;
