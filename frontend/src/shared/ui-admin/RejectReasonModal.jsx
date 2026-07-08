import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../ui/Button.jsx';
import { ModalCloseButton } from '../ui/ModalCloseButton.jsx';

const DEFAULT_MAX_LENGTH = 500;

/**
 * @param {{
 *   open: boolean,
 *   title: string,
 *   body?: string,
 *   reasonLabel?: string,
 *   confirmLabel?: string,
 *   cancelLabel?: string,
 *   quickReasons?: string[],
 *   maxLength?: number,
 *   loading?: boolean,
 *   error?: string,
 *   onConfirm: (reason: string) => void,
 *   onCancel: () => void,
 *   titleId?: string,
 * }} props
 */
export function RejectReasonModal({
  open,
  title,
  body,
  reasonLabel,
  confirmLabel,
  cancelLabel,
  quickReasons = [],
  maxLength = DEFAULT_MAX_LENGTH,
  loading = false,
  error = '',
  onConfirm,
  onCancel,
  titleId = 'admin-reject-modal-title',
}) {
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
      setValidationError(t('admin.rejectionReasonRequired'));
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

  const handleChipClick = (chipText) => {
    setReason((current) => {
      if (!current.trim()) return chipText;
      if (current.includes(chipText)) return current;
      return `${current.trim()}\n${chipText}`;
    });
    setValidationError('');
  };

  const displayError = validationError || error;

  return (
    <div className="kyc-modal-overlay" role="presentation" onClick={handleClose}>
      <div
        className="kyc-modal kyc-modal--wide"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(event) => event.stopPropagation()}
      >
        <ModalCloseButton onClick={handleClose} disabled={loading} />
        <h2 id={titleId} className="kyc-modal__title">
          {title}
        </h2>
        {body && <p className="kyc-modal__body">{body}</p>}

        {quickReasons.length > 0 && (
          <div className="kyc-reject-modal__chips" role="group" aria-label={t('admin.quickReasons')}>
            {quickReasons.map((chipText) => (
              <button
                key={chipText}
                type="button"
                className="kyc-reject-modal__chip"
                onClick={() => handleChipClick(chipText)}
                disabled={loading}
              >
                {chipText}
              </button>
            ))}
          </div>
        )}

        <label className="kyc-modal__label" htmlFor="admin-rejection-reason">
          {reasonLabel || t('admin.rejectionReason')}
        </label>
        <textarea
          id="admin-rejection-reason"
          className="kyc-modal__textarea"
          rows={5}
          maxLength={maxLength}
          value={reason}
          onChange={(event) => {
            setReason(event.target.value);
            setValidationError('');
          }}
          disabled={loading}
        />
        <p className="kyc-modal__char-count">
          {t('admin.charCount', { count: reason.length, max: maxLength })}
        </p>

        {displayError && (
          <p className="kyc-modal__error" role="alert">
            {displayError}
          </p>
        )}

        <div className="kyc-modal__actions">
          <Button variant="secondary" onClick={handleClose} disabled={loading}>
            {cancelLabel || t('admin.cancel')}
          </Button>
          <Button variant="primary" onClick={handleConfirm} disabled={loading}>
            {loading ? t('admin.rejecting') : confirmLabel || t('admin.confirmReject')}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default RejectReasonModal;
