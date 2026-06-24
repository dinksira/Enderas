import { useTranslation } from 'react-i18next';
import { Button } from '../../../components/Button.jsx';

/**
 * @param {{
 *   open: boolean,
 *   loading?: boolean,
 *   applicantName?: string,
 *   onConfirm: () => void,
 *   onCancel: () => void,
 * }} props
 */
export function KYCApproveConfirmModal({
  open,
  loading = false,
  applicantName = '',
  onConfirm,
  onCancel,
}) {
  const { t } = useTranslation();

  if (!open) return null;

  return (
    <div className="kyc-modal-overlay" role="presentation" onClick={onCancel}>
      <div
        className="kyc-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="kyc-approve-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="kyc-approve-modal-title" className="kyc-modal__title">
          {t('kyc.management.approveModalTitle')}
        </h2>
        <p className="kyc-modal__body">
          {t('kyc.management.approveModalBody', { name: applicantName })}
        </p>
        <div className="kyc-modal__actions">
          <Button variant="secondary" onClick={onCancel} disabled={loading}>
            {t('kyc.management.cancel')}
          </Button>
          <Button variant="primary" onClick={onConfirm} disabled={loading}>
            {loading ? t('kyc.approving') : t('kyc.management.confirmApprove')}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default KYCApproveConfirmModal;
