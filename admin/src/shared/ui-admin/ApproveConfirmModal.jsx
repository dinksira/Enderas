import { useTranslation } from 'react-i18next';
import { Button, LogoSpinner } from '../ui/index.js';
import { ModalCloseButton } from '../ui/ModalCloseButton.jsx';

/**
 * @param {{
 *   open: boolean,
 *   title: string,
 *   body: import('react').ReactNode,
 *   confirmLabel?: string,
 *   cancelLabel?: string,
 *   loading?: boolean,
 *   onConfirm: () => void,
 *   onCancel: () => void,
 *   titleId?: string,
 * }} props
 */
export function ApproveConfirmModal({
  open,
  title,
  body,
  confirmLabel,
  cancelLabel,
  loading = false,
  onConfirm,
  onCancel,
  titleId = 'admin-approve-modal-title',
}) {
  const { t } = useTranslation();

  if (!open) return null;

  return (
    <div className="kyc-modal-overlay kyc-modal-overlay--auction-confirm" role="presentation" onClick={onCancel}>
      <div
        className="kyc-modal auction-confirm-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(event) => event.stopPropagation()}
      >
        <ModalCloseButton onClick={onCancel} disabled={loading} />
        <h2 id={titleId} className="kyc-modal__title">
          {title}
        </h2>
        <div className="kyc-modal__body">{body}</div>
        <div className="kyc-modal__actions">
          <Button variant="secondary" onClick={onCancel} disabled={loading}>
            {cancelLabel || t('admin.cancel')}
          </Button>
          <Button variant="primary" onClick={onConfirm} disabled={loading}>
            <span className="auction-confirm-modal__btn-content">
              {loading && <LogoSpinner size={14} />}
              {loading ? t('admin.confirming') : confirmLabel || t('admin.confirm')}
            </span>
          </Button>
        </div>
      </div>
    </div>
  );
}

export default ApproveConfirmModal;
