import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@enderass/shared/auth';
import { ROUTES } from '../config/routes.js';

export function KYCStatusBanner() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);

  if (!user || user.isStaff || user.status === 'active') {
    return null;
  }

  const getBannerContent = () => {
    switch (user.status) {
      case 'pending':
      case 'kyc_pending':
        return {
          message: t('kyc.pendingBanner'),
          action: t('kyc.completeProfile'),
          actionLink: ROUTES.KYC_VERIFICATION,
          variant: 'warning',
        };
      case 'kyc_under_review':
        return {
          message: t('kyc.underReviewBanner'),
          variant: 'info',
        };
      case 'kyc_rejected':
        return {
          message: t('kyc.rejectedBanner'),
          action: t('kyc.resubmit'),
          actionLink: ROUTES.KYC_VERIFICATION,
          variant: 'error',
        };
      default:
        return null;
    }
  };

  const content = getBannerContent();
  if (!content) return null;

  return (
    <div className={`kyc-banner kyc-banner--${content.variant}`} role="status">
      <span className="kyc-banner__message">{content.message}</span>
      {content.action && (
        <button
          type="button"
          className="kyc-banner__action"
          onClick={() => navigate(content.actionLink)}
        >
          {content.action}
        </button>
      )}
    </div>
  );
}

export default KYCStatusBanner;
