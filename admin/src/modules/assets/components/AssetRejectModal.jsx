import { Button } from '@enderass/shared/ui';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
const MAX_REASON_LENGTH = 500;

/**
 * @param {{
 *   open: boolean,
 *   loading?: boolean,
 *   error?: string,
 *   onConfirm: (reason: string) => void,
 *   onCancel: () => void,
 * }} props
 */
export function AssetRejectModal({ open, loading = false, error = '', onConfirm, onCancel }) {
  const { t } = useTranslation();
  const [reason, setReason] = useState('');
  const [validationError, setValidationError] = useState('');

  useEffect(() => {
    if (!open) {
      setReason('');
      setValidationError('');
    }
  }, [open]);

  if (!open) return null;

  const handleConfirm = () => {
    const trimmed = reason.trim();
    if (!trimmed) {
      setValidationError(t('assets.review.rejectionReasonRequired'));
      return;
    }
    setValidationError('');
    onConfirm(trimmed);
  };

  const handleClose = () => {
    setReason('');
    setValidationError('');
    onCancel();
  };

  const displayError = validationError || error;

  return (
    <div className="kyc-modal-overlay kyc-modal-overlay--auction-confirm" role="presentation" onClick={handleClose}>
      <div
        className="kyc-modal auction-confirm-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="asset-reject-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="asset-reject-modal-title" className="kyc-modal__title">
          {t('assets.review.rejectModalTitle')}
        </h2>
        <p className="kyc-modal__body">{t('assets.review.rejectModalBody')}</p>

        <label className="kyc-modal__label" htmlFor="asset-rejection-reason">
          {t('assets.review.rejectionReason')}
        </label>
        <textarea
          id="asset-rejection-reason"
          className="kyc-modal__textarea"
          rows={4}
          maxLength={MAX_REASON_LENGTH}
          value={reason}
          onChange={(event) => {
            setReason(event.target.value);
            setValidationError('');
          }}
          disabled={loading}
        />

        {displayError && (
          <p className="kyc-modal__error" role="alert">
            {displayError}
          </p>
        )}

        <div className="kyc-modal__actions">
          <Button variant="secondary" onClick={handleClose} disabled={loading}>
            {t('assets.review.cancel')}
          </Button>
          <Button
            variant="secondary"
            className="btn--auction-danger-confirm"
            onClick={handleConfirm}
            disabled={loading}
          >
            <span className="auction-confirm-modal__btn-content">
              {loading && <span className="auction-confirm-modal__spinner" aria-hidden="true" />}
              {loading ? t('assets.review.rejecting') : t('assets.review.confirmReject')}
            </span>
          </Button>
        </div>
      </div>
    </div>
  );
}

export default AssetRejectModal;
