import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@enderass/shared/auth';
import { ROUTES } from '../../../config/routes.js';
import { Button } from '../../../components/Button.jsx';
import { kycService } from '../services/kyc.service.js';

export function KYCRejectedView() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const kycData = useAuthStore((state) => state.kycData);
  const setKYCStatus = useAuthStore((state) => state.setKYCStatus);

  useEffect(() => {
    // Fetch latest KYC data on mount
    const fetchKYC = async () => {
      try {
        const response = await kycService.getMyKYC();
        const kyc = response?.kyc || response;
        if (kyc) {
          setKYCStatus(kyc.status, kyc);
        }
      } catch (err) {
        // Ignore errors
      }
    };
    fetchKYC();
  }, [setKYCStatus]);

  return (
    <div className="kyc-page">
      <div className="kyc-page__shell">
        <div className="kyc-page__status-card kyc-page__status-card--error">
          <h1 className="kyc-page__title">{t('kyc.rejectedTitle')}</h1>
          <p className="kyc-page__subtitle">{t('kyc.rejectedBanner')}</p>
          {kycData?.rejectionReason && (
            <div className="kyc-page__rejection-reason">
              <p className="kyc-page__rejection-label">{t('kyc.rejectionReasonLabel')}</p>
              <p className="kyc-page__rejection-text">{kycData.rejectionReason}</p>
            </div>
          )}
          <Button 
            variant="primary"
            onClick={() => navigate(ROUTES.KYC_VERIFICATION)}
          >
            {t('kyc.resubmit')}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default KYCRejectedView;
