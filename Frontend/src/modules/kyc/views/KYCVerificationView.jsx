import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '../../../components/Button.jsx';
import { Input } from '../../../components/Input.jsx';
import { FileUpload } from '../../../components/FileUpload.jsx';
import { kycService } from '../services/kyc.service.js';
import { useAuthStore } from '../../../stores/auth-store.js';
import { ROUTES } from '../../../config/routes.js';

export function KYCVerificationView() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const setKYCStatus = useAuthStore((state) => state.setKYCStatus);
  const setSession = useAuthStore((state) => state.setSession);

  const [loading, setLoading] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [kycData, setKycData] = useState(null);
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState({
    userType: user?.userType || 'individual',
    documentNumber: '',
    tinNumber: '',
    documentFrontUrl: '',
    documentBackUrl: '',
    tradeLicenseUrl: '',
    tinCertificateUrl: '',
    businessRegistrationUrl: '',
  });

  const isAmharic = i18n.language === 'am';

  useEffect(() => {
    checkKYCStatus();
  }, []);

  const checkKYCStatus = async () => {
    try {
      const response = await kycService.getMyKYC();
      if (response?.kyc) {
        setKycData(response.kyc);
        setKYCStatus(response.kyc.status, response.kyc);
        if (response.kyc.status === 'approved') {
          navigate(ROUTES.APP_DASHBOARD, { replace: true });
        }
      }
    } catch {
      // No KYC record yet — show submission form
    } finally {
      setCheckingStatus(false);
    }
  };

  const updateField = (field) => (event) => {
    setFormData((current) => ({ ...current, [field]: event.target.value }));
    setErrors((current) => ({ ...current, [field]: undefined, form: undefined }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setErrors({});
    try {
      const submitFn = kycData?.status === 'rejected' ? kycService.resubmitKYC : kycService.submitKYC;
      const result = await submitFn(formData);
      const kyc = result?.kyc || result;
      setKYCStatus(kyc?.status || 'pending', kyc);
      if (user) {
        setSession({
          accessToken: useAuthStore.getState().accessToken,
          identity: { ...user, status: 'kyc_under_review' },
          authz: useAuthStore.getState().permissions,
          user: { ...user, status: 'kyc_under_review' },
        });
      }
      navigate(ROUTES.KYC_UNDER_REVIEW, { replace: true });
    } catch (err) {
      setErrors({ form: err.message || t('kyc.submissionFailed') });
    } finally {
      setLoading(false);
    }
  };

  if (checkingStatus) {
    return (
      <div className={`kyc-page ${isAmharic ? 'kyc-page--am' : ''}`}>
        <div className="kyc-page__shell">
          <p className="kyc-page__loading">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  if (kycData?.status === 'pending' && user?.status === 'kyc_under_review') {
    return (
      <div className={`kyc-page ${isAmharic ? 'kyc-page--am' : ''}`}>
        <div className="kyc-page__shell">
          <div className="kyc-page__status-card kyc-page__status-card--info">
            <h1 className="kyc-page__title">{t('kyc.underReviewTitle')}</h1>
            <p>{t('kyc.underReviewBanner')}</p>
            <Button variant="secondary" onClick={() => navigate(ROUTES.APP_DASHBOARD)}>
              {t('kyc.goToDashboard')}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const isRejected = kycData?.status === 'rejected';

  return (
    <div className={`kyc-page ${isAmharic ? 'kyc-page--am' : ''}`}>
      <div className="kyc-page__shell">
        <header className="kyc-page__header">
          <h1 className="kyc-page__title">
            {isRejected ? t('kyc.resubmitTitle') : t('kyc.verificationTitle')}
          </h1>
          <p className="kyc-page__subtitle">{t('kyc.verificationSubtitle')}</p>
        </header>

        {isRejected && (
          <div className="kyc-page__status-card kyc-page__status-card--error" role="alert">
            <p>{t('kyc.rejectedBanner')}</p>
            {kycData.rejectionReason && (
              <p className="kyc-page__rejection-reason">{kycData.rejectionReason}</p>
            )}
          </div>
        )}

        <form className="kyc-page__form" onSubmit={handleSubmit} noValidate>
          {errors.form && <p className="kyc-page__alert" role="alert">{errors.form}</p>}

          {formData.userType === 'individual' ? (
            <>
              <Input
                label={t('kyc.nationalIdNumber')}
                name="documentNumber"
                value={formData.documentNumber}
                onChange={updateField('documentNumber')}
                error={errors.documentNumber}
              />
              <FileUpload
                label={t('kyc.nationalIdFront')}
                folder="kyc"
                accept="image/*"
                onUpload={(result) => setFormData((c) => ({ ...c, documentFrontUrl: result.fileUrl }))}
                disabled={loading}
              />
              <FileUpload
                label={t('kyc.nationalIdBack')}
                folder="kyc"
                accept="image/*"
                onUpload={(result) => setFormData((c) => ({ ...c, documentBackUrl: result.fileUrl }))}
                disabled={loading}
              />
            </>
          ) : (
            <>
              <Input
                label={t('kyc.tinNumber')}
                name="tinNumber"
                value={formData.tinNumber}
                onChange={updateField('tinNumber')}
                error={errors.tinNumber}
              />
              <FileUpload
                label={t('kyc.tradeLicense')}
                folder="kyc"
                accept="image/*,.pdf"
                onUpload={(result) => setFormData((c) => ({ ...c, tradeLicenseUrl: result.fileUrl }))}
                disabled={loading}
              />
              <FileUpload
                label={t('kyc.tinCertificate')}
                folder="kyc"
                accept="image/*,.pdf"
                onUpload={(result) => setFormData((c) => ({ ...c, tinCertificateUrl: result.fileUrl }))}
                disabled={loading}
              />
              <FileUpload
                label={t('kyc.businessRegistration')}
                folder="kyc"
                accept="image/*,.pdf"
                onUpload={(result) => setFormData((c) => ({ ...c, businessRegistrationUrl: result.fileUrl }))}
                disabled={loading}
              />
            </>
          )}

          <Button type="submit" variant="primary" disabled={loading} className="kyc-page__submit">
            {loading ? t('kyc.submitting') : t('kyc.submit')}
          </Button>
        </form>
      </div>
    </div>
  );
}

export default KYCVerificationView;
