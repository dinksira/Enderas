import { Button, ModalCloseButton } from '@enderass/shared/ui';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
const REJECTION_REASON_KEYS = [
  'documentUnclear',
  'expiredDocument',
  'informationMismatch',
  'incompleteSubmission',
];

const MAX_REASON_LENGTH = 500;

/**
 * @param {{
 *   open: boolean,
 *   loading?: boolean,
 *   onConfirm: (reason: string) => void,
 *   onCancel: () => void,
 * }} props
 */
export function KYCRejectModal({ open, loading = false, onConfirm, onCancel }) {
  const { t } = useTranslation();
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) {
      setReason('');
      setError('');
    }
  }, [open]);

  if (!open) return null;

  const handleConfirm = () => {
    const trimmed = reason.trim();
    if (!trimmed) {
      setError(t('kyc.rejectionReasonRequired'));
      return;
    }
    setError('');
    onConfirm(trimmed);
  };

  const handleChipClick = (chipKey) => {
    const chipText = t(`kyc.management.rejectionReasons.${chipKey}`);
    setReason((current) => {
      if (!current.trim()) return chipText;
      if (current.includes(chipText)) return current;
      return `${current.trim()}\n${chipText}`;
    });
    setError('');
  };

  const handleClose = () => {
    setReason('');
    setError('');
    onCancel();
  };

  return (
    <div className="kyc-modal-overlay" role="presentation" onClick={handleClose}>
      <div
        className="kyc-modal kyc-modal--wide"
        role="dialog"
        aria-modal="true"
        aria-labelledby="kyc-reject-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <ModalCloseButton onClick={handleClose} disabled={loading} />
        <h2 id="kyc-reject-modal-title" className="kyc-modal__title">
          {t('kyc.management.rejectModalTitle')}
        </h2>
        <p className="kyc-modal__body">{t('kyc.management.rejectModalBody')}</p>

        <div className="kyc-reject-modal__chips" role="group" aria-label={t('kyc.management.quickReasons')}>
          {REJECTION_REASON_KEYS.map((chipKey) => (
            <button
              key={chipKey}
              type="button"
              className="kyc-reject-modal__chip"
              onClick={() => handleChipClick(chipKey)}
            >
              {t(`kyc.management.rejectionReasons.${chipKey}`)}
            </button>
          ))}
        </div>

        <label className="kyc-modal__label" htmlFor="kyc-rejection-reason">
          {t('kyc.rejectionReason')}
        </label>
        <textarea
          id="kyc-rejection-reason"
          className="kyc-modal__textarea"
          rows={5}
          maxLength={MAX_REASON_LENGTH}
          value={reason}
          onChange={(event) => {
            setReason(event.target.value);
            setError('');
          }}
        />
        <p className="kyc-modal__char-count">
          {t('kyc.management.charCount', { count: reason.length, max: MAX_REASON_LENGTH })}
        </p>

        {error && (
          <p className="kyc-modal__error" role="alert">
            {error}
          </p>
        )}

        <div className="kyc-modal__actions">
          <Button variant="secondary" onClick={handleClose} disabled={loading}>
            {t('kyc.management.cancel')}
          </Button>
          <Button variant="primary" onClick={handleConfirm} disabled={loading}>
            {loading ? t('kyc.rejecting') : t('kyc.management.confirmReject')}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default KYCRejectModal;
