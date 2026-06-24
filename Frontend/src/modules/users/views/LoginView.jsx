import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../../config/routes.js';
import { resolveDefaultRoute } from '../../../config/navigation.config.js';
import { AuthBrandPanel } from '../components/auth-brand-panel.jsx';
import { CredentialsStep } from '../components/credentials-step.jsx';
import { OtpVerificationStep } from '../components/otp-verification-step.jsx';
import { useOtpTimer } from '../hooks/use-otp-timer.js';
import { authApi } from '../services/authApi.js';
import { useAuthStore } from '../../../stores/auth-store.js';

const AUTH_STEPS = Object.freeze({
  CREDENTIALS: 'CREDENTIALS',
  OTP: 'OTP',
});

const OTP_LENGTH = 6;
const PHONE_PATTERN = /^09\d{8}$/;

const EMPTY_OTP = Array.from({ length: OTP_LENGTH }, () => '');

function validateCredentials(phoneNumber, password) {
  const errors = {};
  const normalizedPhone = phoneNumber.trim();

  if (!normalizedPhone) {
    errors.phoneNumber = 'Phone number is required.';
  } else if (!PHONE_PATTERN.test(normalizedPhone)) {
    errors.phoneNumber = 'Enter a valid phone number (e.g. 09123456789).';
  }

  if (!password) {
    errors.password = 'Password is required.';
  }

  return errors;
}

const MOCK_SESSION_DELAY_MS = 600;

function resolveLoginError(err) {
  if (err?.code === 'INVALID_CREDENTIALS') {
    return 'Invalid credentials. Please check your phone number and password.';
  }

  if (err?.code === 'NETWORK_ERROR') {
    return err.message;
  }

  return err instanceof Error ? err.message : 'Unable to sign in. Please try again.';
}

export function LoginView() {
  const navigate = useNavigate();
  const setSession = useAuthStore((state) => state.setSession);
  const { formatted, isExpired, reset: resetOtpTimer } = useOtpTimer(60);

  const [step, setStep] = useState(AUTH_STEPS.CREDENTIALS);
  const [locale, setLocale] = useState('en');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [otpDigits, setOtpDigits] = useState(EMPTY_OTP);
  const [sessionId, setSessionId] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [errors, setErrors] = useState({});

  const clearFieldError = (field) => {
    setErrors((current) => ({ ...current, [field]: undefined, form: undefined }));
  };

  const handlePhoneChange = (event) => {
    setPhoneNumber(event.target.value);
    clearFieldError('phoneNumber');
  };

  const handlePasswordChange = (event) => {
    setPassword(event.target.value);
    clearFieldError('password');
  };

  const handleCredentialsSubmit = async (event) => {
    event.preventDefault();

    const validationErrors = validateCredentials(phoneNumber, password);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      const session = await authApi.login({ phoneNumber, password });

      setSession({
        accessToken: session.accessToken,
        identity: session.identity,
        authz: session.authz,
        user: session.user,
      });

      if (session.identity?.isMobileVerified === false) {
        setSessionId(session.session?.sessionId || '');
        setOtpDigits(EMPTY_OTP);
        resetOtpTimer();
        setStep(AUTH_STEPS.OTP);
        return;
      }

      const roleCode = useAuthStore.getState().permissions?.roleCode;
      const userStatus = session.identity?.status || session.user?.status;

      if (['kyc_pending', 'kyc_rejected', 'pending'].includes(userStatus)) {
        navigate(ROUTES.KYC_VERIFICATION, { replace: true });
        return;
      }

      navigate(resolveDefaultRoute(roleCode), { replace: true });
    } catch (err) {
      setErrors({
        form: resolveLoginError(err),
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async (event) => {
    event.preventDefault();

    const otp = otpDigits.join('');
    if (otp.length !== OTP_LENGTH) {
      setErrors({ form: 'Enter the complete 6-digit verification code.' });
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      await new Promise((resolve) => setTimeout(resolve, MOCK_SESSION_DELAY_MS));

      const roleCode = useAuthStore.getState().permissions?.roleCode;
      navigate(resolveDefaultRoute(roleCode), { replace: true });
    } catch (err) {
      setErrors({
        form: err instanceof Error ? err.message : 'Invalid verification code. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (!isExpired || resending) {
      return;
    }

    setResending(true);
    setErrors({});

    try {
      await new Promise((resolve) => setTimeout(resolve, MOCK_SESSION_DELAY_MS));

      setOtpDigits(EMPTY_OTP);
      resetOtpTimer();
    } catch (err) {
      setErrors({
        form: err instanceof Error ? err.message : 'Unable to resend verification code.',
      });
    } finally {
      setResending(false);
    }
  };

  return (
    <section className="premium-login-view" aria-live="polite">
      <div className="premium-login-view__container">
        <AuthBrandPanel />

        <div className="premium-login-view__right">
          <div className={`premium-login-view__step premium-login-view__step--${step.toLowerCase()}`}>
            {step === AUTH_STEPS.CREDENTIALS ? (
              <CredentialsStep
                locale={locale}
                phoneNumber={phoneNumber}
                password={password}
                loading={loading}
                errors={errors}
                onPhoneChange={handlePhoneChange}
                onPasswordChange={handlePasswordChange}
                onSubmit={handleCredentialsSubmit}
                onLocaleChange={setLocale}
              />
            ) : (
              <OtpVerificationStep
                locale={locale}
                otpDigits={otpDigits}
                loading={loading}
                resending={resending}
                canResend={isExpired}
                timerLabel={formatted}
                error={errors.form}
                onOtpChange={setOtpDigits}
                onSubmit={handleOtpSubmit}
                onResend={handleResendOtp}
                onLocaleChange={setLocale}
              />
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

export default LoginView;
