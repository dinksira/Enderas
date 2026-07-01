import { Button } from '@enderass/shared/ui';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
/**
 * @param {{
 *   open: boolean,
 *   loading?: boolean,
 *   bidderName?: string,
 *   onClose: () => void,
 *   onConfirm: (expiryDate: string) => void,
 * }} props
 */
export function CpoApproveModal({ open, loading = false, bidderName, onClose, onConfirm }) {
  const { t } = useTranslation();
  const [expiryDate, setExpiryDate] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) {
      setExpiryDate('');
      setError('');
    }
  }, [open]);

  if (!open) return null;

  const handleConfirm = () => {
    if (!expiryDate) {
      setError(t('cpo.management.approveModal.dateRequired'));
      return;
    }
    setError('');
    onConfirm(expiryDate);
  };

  return (
    <div className="kyc-modal-overlay kyc-modal-overlay--auction-confirm" role="presentation" onClick={onClose}>
      <div
        className="kyc-modal auction-confirm-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cpo-approve-title"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="cpo-approve-title" className="kyc-modal__title">
          {t('cpo.management.approveModal.title')}
        </h2>
        <p className="kyc-modal__body">
          {t('cpo.management.approveModal.body', { name: bidderName || '—' })}
        </p>

        <label className="kyc-modal__label" htmlFor="cpo-expiry-date">
          {t('cpo.management.approveModal.expiryDate')}
        </label>
        <input
          id="cpo-expiry-date"
          type="date"
          className="input-field__control"
          value={expiryDate}
          onChange={(event) => setExpiryDate(event.target.value)}
          disabled={loading}
        />

        {error && (
          <p className="kyc-modal__error" role="alert">
            {error}
          </p>
        )}

        <div className="kyc-modal__actions">
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            {t('admin.cancel')}
          </Button>
          <Button variant="primary" onClick={handleConfirm} disabled={loading}>
            {loading ? t('admin.confirming') : t('cpo.management.approveModal.confirm')}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default CpoApproveModal;
