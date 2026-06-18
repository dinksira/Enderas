import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../../config/routes.js';
import { CredentialsStep } from '../components/credentials-step.jsx';
import { OtpVerificationStep } from '../components/otp-verification-step.jsx';
import { useOtpTimer } from '../hooks/use-otp-timer.js';

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
  } else if (password.length < 8) {
    errors.password = 'Password must be at least 8 characters.';
  }

  return errors;
}

const MOCK_SESSION_DELAY_MS = 600;

export function LoginView() {
  const navigate = useNavigate();
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
      await new Promise((resolve) => setTimeout(resolve, MOCK_SESSION_DELAY_MS));

      setSessionId('mock-session-id-12345');
      setOtpDigits(EMPTY_OTP);
      resetOtpTimer();
      setStep(AUTH_STEPS.OTP);
    } catch (err) {
      setErrors({
        form: err instanceof Error ? err.message : 'Unable to sign in. Please try again.',
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

      navigate(ROUTES.AUCTIONS, { replace: true });
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
    <section className="login-view" aria-live="polite">
      <div className="login-view__container">
        <div className={`login-view__step login-view__step--${step.toLowerCase()}`}>
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
    </section>
  );
}

export default LoginView;