import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Input } from '@enderass/shared/ui';

/**
 * @param {{
 *   open: boolean,
 *   loading?: boolean,
 *   error?: string,
 *   staffName?: string,
 *   onConfirm: () => void,
 *   onCancel: () => void,
 * }} props
 */
export function StaffDeleteConfirmModal({
  open,
  loading = false,
  error = '',
  staffName = '',
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

  const confirmMatches = confirmText === staffName;
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
        aria-labelledby="staff-delete-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="staff-delete-modal-title" className="kyc-modal__title">
          {t('staff.management.deleteModal.title')}
        </h2>
        <p className="kyc-modal__body">
          {t('staff.management.deleteModal.bodyIntro')}{' '}
          <strong className="auction-confirm-modal__emphasis">{staffName}</strong>
          {t('staff.management.deleteModal.bodyRest')}
        </p>

        <Input
          label={t('staff.management.deleteModal.confirmLabel')}
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
            {t('staff.management.deleteModal.cancel')}
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
                ? t('staff.management.deleteModal.processing')
                : t('staff.management.deleteModal.confirm')}
            </span>
          </Button>
        </div>
      </div>
    </div>
  );
}

export default StaffDeleteConfirmModal;
