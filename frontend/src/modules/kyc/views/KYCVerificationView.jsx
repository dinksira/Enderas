import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button, Input } from '../../../components/index.js';
import { FileUpload } from '../../../components/FileUpload.jsx';
import { LogoSpinner } from '@enderass/shared/ui';
import { kycService } from '../services/kyc.service.js';
import { useAuthStore } from '@enderass/shared/auth';
import { ROUTES } from '../../../config/routes.js';

export function KYCVerificationView() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
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

  useEffect(() => {
    const prefill = location.state?.kycPrefill;
    if (!prefill) return;

    setFormData((current) => ({
      ...current,
      userType: prefill.userType || current.userType,
      documentNumber: prefill.documentNumber || current.documentNumber,
      tinNumber: prefill.tinNumber || current.tinNumber,
    }));
  }, [location.state]);

  useEffect(() => {
    if (user?.userType) {
      setFormData((current) => ({ ...current, userType: user.userType }));
    }
  }, [user?.userType]);

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

    const nextErrors = {};
    if (formData.userType === 'individual') {
      if (!formData.documentNumber.trim()) {
        nextErrors.documentNumber = t('kyc.documentNumberRequired');
      }
      if (!formData.documentFrontUrl) {
        nextErrors.documentFrontUrl = t('kyc.documentFrontRequired');
      }
    } else {
      if (!formData.tinNumber.trim()) {
        nextErrors.tinNumber = t('kyc.tinRequired');
      }
      if (!formData.tradeLicenseUrl) {
        nextErrors.tradeLicenseUrl = t('kyc.tradeLicenseRequired');
      }
      if (!formData.tinCertificateUrl) {
        nextErrors.tinCertificateUrl = t('kyc.tinCertificateRequired');
      }
      if (!formData.businessRegistrationUrl) {
        nextErrors.businessRegistrationUrl = t('kyc.businessRegistrationRequired');
      }
    }

    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      setLoading(false);
      return;
    }

    try {
      const submitFn = kycData?.status === 'rejected' ? kycService.resubmitKYC : kycService.submitKYC;
      const result = await submitFn({
        userType: formData.userType,
        documentNumber: formData.documentNumber,
        documentFrontUrl: formData.documentFrontUrl,
        documentBackUrl: formData.documentBackUrl,
        tinNumber: formData.tinNumber,
        tradeLicenseUrl: formData.tradeLicenseUrl,
        tinCertificateUrl: formData.tinCertificateUrl,
        businessRegistrationUrl: formData.businessRegistrationUrl,
      });
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
          <LogoSpinner size={32} />
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
            {loading ? <><LogoSpinner size={16} /> {t('kyc.submitting')}</> : t('kyc.submit')}
          </Button>
        </form>
      </div>
    </div>
  );
}

export default KYCVerificationView;
