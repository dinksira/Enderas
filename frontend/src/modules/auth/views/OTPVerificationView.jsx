import { useMemo, useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AuthBrandPanel } from '../../users/components/auth-brand-panel.jsx';
import { OtpVerificationStep } from '../../users/components/otp-verification-step.jsx';
import { useOtpTimer } from '../../users/hooks/use-otp-timer.js';
import { authApi } from '../../users/services/authApi.js';
import { resolveAuthError } from '../../users/utils/resolve-auth-error.js';
import { useAuthStore } from '@enderass/shared/auth';
import { ROUTES } from '../../../config/routes.js';

const OTP_LENGTH = 6;
const DEFAULT_OTP_TTL_SECONDS = 300;
const EMPTY_OTP = Array.from({ length: OTP_LENGTH }, () => '');

export function OTPVerificationView() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const setSession = useAuthStore((state) => state.setSession);
  const pendingOtpMobile = useAuthStore((state) => state.pendingOtpMobile);
  const pendingRegistration = useAuthStore((state) => state.pendingRegistration);
  const setPendingOtpVerification = useAuthStore((state) => state.setPendingOtpVerification);
  const clearPendingOtpVerification = useAuthStore((state) => state.clearPendingOtpVerification);

  const [locale, setLocale] = useState(i18n.language === 'am' ? 'am' : 'en');
  const [otpDigits, setOtpDigits] = useState(EMPTY_OTP);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [errors, setErrors] = useState({});
  const [otpExpiresAt, setOtpExpiresAt] = useState(
    () => location.state?.otpExpiresAt || pendingRegistration?.otpExpiresAt || null,
  );

  const mobileNumber = location.state?.mobileNumber || pendingOtpMobile;

  const timerOptions = useMemo(() => ({
    duration: location.state?.otpExpiresIn
      || pendingRegistration?.otpExpiresIn
      || DEFAULT_OTP_TTL_SECONDS,
    expiresAt: otpExpiresAt,
  }), [location.state?.otpExpiresIn, otpExpiresAt, pendingRegistration?.otpExpiresIn]);

  const { formatted, isExpired, reset } = useOtpTimer(timerOptions);

  useEffect(() => {
    if (!mobileNumber) {
      navigate(ROUTES.REGISTER, { replace: true });
    }
  }, [mobileNumber, navigate]);

  const handleVerify = async (event) => {
    event.preventDefault();

    if (isExpired) {
      setErrors({ form: t('auth.otpExpiredShort') });
      return;
    }

    const otp = otpDigits.join('');

    if (otp.length !== OTP_LENGTH) {
      setErrors({ form: t('auth.enterValidOtp') });
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      const response = await authApi.verifyOtp({
        phoneNumber: mobileNumber,
        mobileNumber,
        otp,
      });

      setSession({
        accessToken: response.accessToken,
        refreshToken: response.refreshToken,
        refreshTokenExpiresAt: response.refreshTokenExpiresAt,
        identity: response.identity,
        authz: response.authz,
        user: response.user,
      });

      clearPendingOtpVerification();
      navigate(ROUTES.KYC_VERIFICATION, { replace: true });
    } catch (err) {
      setErrors({ form: resolveAuthError(err, t) });
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!isExpired || resending) {
      return;
    }

    setResending(true);
    setErrors({});

    try {
      const response = await authApi.resendOtp({
        phoneNumber: mobileNumber,
        mobileNumber,
      });

      const nextExpiresAt = response.otpExpiresAt || null;
      setOtpExpiresAt(nextExpiresAt);
      setPendingOtpVerification(mobileNumber, {
        ...pendingRegistration,
        otpExpiresIn: response.otpExpiresIn,
        otpExpiresAt: nextExpiresAt,
      });
      reset({
        duration: response.otpExpiresIn || DEFAULT_OTP_TTL_SECONDS,
        expiresAt: nextExpiresAt,
      });
      setOtpDigits(EMPTY_OTP);
    } catch (err) {
      setErrors({ form: resolveAuthError(err, t) });
    } finally {
      setResending(false);
    }
  };

  if (!mobileNumber) {
    return null;
  }

  return (
    <section className="premium-login-view" aria-live="polite">
      <div className="premium-login-view__container">
        <AuthBrandPanel />

        <div className="premium-login-view__right">
          <div className="premium-login-view__step premium-login-view__step--otp">
            <OtpVerificationStep
              locale={locale}
              otpDigits={otpDigits}
              loading={loading}
              resending={resending}
              canResend={isExpired}
              submitDisabled={isExpired}
              expiredMessage={t('auth.otpExpiredShort')}
              timerLabel={formatted}
              error={errors.form}
              onOtpChange={setOtpDigits}
              onSubmit={handleVerify}
              onResend={handleResend}
              onLocaleChange={setLocale}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

export default OTPVerificationView;
