import { Button, Input } from '@enderass/shared/ui';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
/**
 * @param {{
 *   open: boolean,
 *   loading?: boolean,
 *   error?: string,
 *   userName?: string,
 *   mobileNumber?: string,
 *   onConfirm: () => void,
 *   onCancel: () => void,
 * }} props
 */
export function UserDeleteConfirmModal({
  open,
  loading = false,
  error = '',
  userName = '',
  mobileNumber = '',
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

  const confirmMatches = confirmText === userName || confirmText === mobileNumber;
  const canDelete = confirmMatches && !loading;

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
        aria-labelledby="user-delete-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="user-delete-modal-title" className="kyc-modal__title">
          {t('users.management.deleteModal.title')}
        </h2>
        <p className="kyc-modal__body">
          {t('users.management.deleteModal.bodyIntro')}{' '}
          <strong className="auction-confirm-modal__emphasis">{userName || mobileNumber}</strong>
          {t('users.management.deleteModal.bodyRest')}
        </p>

        <Input
          label={t('users.management.deleteModal.confirmLabel')}
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
            {t('users.management.deleteModal.cancel')}
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
                ? t('users.management.deleteModal.processing')
                : t('users.management.deleteModal.confirm')}
            </span>
          </Button>
        </div>
      </div>
    </div>
  );
}

export default UserDeleteConfirmModal;
