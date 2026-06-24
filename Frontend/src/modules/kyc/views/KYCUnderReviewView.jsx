import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../../stores/auth-store.js';
import { ROUTES } from '../../../config/routes.js';
import { kycService } from '../services/kyc.service.js';

export function KYCUnderReviewView() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const setSession = useAuthStore((state) => state.setSession);
  const [polling, setPolling] = useState(true);

  useEffect(() => {
    const checkKYCStatus = async () => {
      try {
        const response = await kycService.getMyKYC();
        const kyc = response?.kyc || response;
        
        if (kyc?.status === 'approved') {
          setPolling(false);
          // If approved, refresh user session (should get updated user.status)
          // For now, redirect to app dashboard
          navigate(ROUTES.APP_DASHBOARD, { replace: true });
        } else if (kyc?.status === 'rejected') {
          setPolling(false);
          navigate(ROUTES.KYC_REJECTED, { replace: true });
        }
      } catch (err) {
        // Ignore polling errors for now
      }
    };

    if (polling) {
      // Poll every 30 seconds
      const interval = setInterval(checkKYCStatus, 30000);
      // Check immediately on mount
      checkKYCStatus();
      return () => clearInterval(interval);
    }
  }, [navigate, polling, setSession]);

  return (
    <div className="kyc-page">
      <div className="kyc-page__shell">
        <div className="kyc-page__status-card kyc-page__status-card--info">
          <h1 className="kyc-page__title">{t('kyc.underReviewTitle')}</h1>
          <p className="kyc-page__subtitle">{t('kyc.underReviewBanner')}</p>
          <p className="kyc-page__text">{t('kyc.underReviewNotificationInfo')}</p>
        </div>
      </div>
    </div>
  );
}

export default KYCUnderReviewView;
