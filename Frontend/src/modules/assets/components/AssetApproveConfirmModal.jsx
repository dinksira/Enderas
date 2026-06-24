import { useTranslation } from 'react-i18next';
import { Button } from '../../../components/Button.jsx';

/**
 * @param {{
 *   open: boolean,
 *   loading?: boolean,
 *   assetTitle?: string,
 *   onConfirm: () => void,
 *   onCancel: () => void,
 * }} props
 */
export function AssetApproveConfirmModal({
  open,
  loading = false,
  assetTitle = '',
  onConfirm,
  onCancel,
}) {
  const { t } = useTranslation();

  if (!open) return null;

  return (
    <div className="kyc-modal-overlay kyc-modal-overlay--auction-confirm" role="presentation" onClick={onCancel}>
      <div
        className="kyc-modal auction-confirm-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="asset-approve-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="asset-approve-modal-title" className="kyc-modal__title">
          {t('assets.review.approveModalTitle')}
        </h2>
        <p className="kyc-modal__body">
          {t('assets.review.approveModalBodyIntro')}{' '}
          <strong className="auction-confirm-modal__emphasis">{assetTitle}</strong>
          {t('assets.review.approveModalBodyRest')}
        </p>
        <div className="kyc-modal__actions">
          <Button variant="secondary" onClick={onCancel} disabled={loading}>
            {t('assets.review.cancel')}
          </Button>
          <Button variant="primary" onClick={onConfirm} disabled={loading}>
            <span className="auction-confirm-modal__btn-content">
              {loading && <span className="auction-confirm-modal__spinner" aria-hidden="true" />}
              {loading ? t('assets.review.approving') : t('assets.review.confirmApprove')}
            </span>
          </Button>
        </div>
      </div>
    </div>
  );
}

export default AssetApproveConfirmModal;
