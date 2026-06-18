import {
  AuthFormAlert,
  AuthLoginCard,
  AuthStepTitle,
  AuthSubmitButton,
} from './auth-login-card.jsx';
import { LoginBrandHeader } from './login-brand-header.jsx';
import { LoginLocaleSwitcher } from './login-locale-switcher.jsx';
import { OtpInputGrid } from './otp-input-grid.jsx';

const COPY = {
  en: {
    title: 'Enter OTP',
    instruction:
      'A 6-DIGIT VERIFICATION CODE HAS BEEN SENT TO YOUR REGISTERED MOBILE NUMBER.',
    submit: 'Verify',
    loading: 'Verifying...',
    resendPrefix: 'Resend code in',
    resendAction: 'Resend Code',
    resending: 'Sending...',
  },
  am: {
    title: 'OTP ያስገቡ',
    instruction: '6-አሃዝ የማረጋገጫ ኮድ ወደ የተመዘገበ የሞባይል ቁጥርዎ ተልኳል።',
    submit: 'አረጋግጥ',
    loading: 'በማረጋገጥ ላይ...',
    resendPrefix: 'ኮድ እንደገና ላክ በ',
    resendAction: 'ኮድ እንደገና ላክ',
    resending: 'በመላክ ላይ...',
  },
};

/**
 * @param {Object} props
 * @param {'en' | 'am'} props.locale
 * @param {string[]} props.otpDigits
 * @param {boolean} props.loading
 * @param {boolean} props.resending
 * @param {boolean} props.canResend
 * @param {string} props.timerLabel
 * @param {string} [props.error]
 * @param {function} props.onOtpChange
 * @param {function} props.onSubmit
 * @param {function} props.onResend
 * @param {function} props.onLocaleChange
 */
export function OtpVerificationStep({
  locale,
  otpDigits,
  loading,
  resending,
  canResend,
  timerLabel,
  error,
  onOtpChange,
  onSubmit,
  onResend,
  onLocaleChange,
}) {
  const copy = COPY[locale];

  return (
    <AuthLoginCard footer={<LoginLocaleSwitcher locale={locale} onLocaleChange={onLocaleChange} />}>
      <LoginBrandHeader />
      <AuthStepTitle title={copy.title} />

      <form className="auth-login-card__fields" onSubmit={onSubmit} noValidate>
        <p className="auth-login-card__instruction">{copy.instruction}</p>

        <AuthFormAlert message={error} />

        <OtpInputGrid value={otpDigits} onChange={onOtpChange} disabled={loading || resending} />

        <div className="auth-login-card__resend">
          {canResend ? (
            <button
              type="button"
              className="auth-login-card__resend-button"
              onClick={onResend}
              disabled={resending}
            >
              {resending ? copy.resending : copy.resendAction}
            </button>
          ) : (
            <p className="auth-login-card__timer">
              Resend code in {timerLabel}
            </p>
          )}
        </div>

        <AuthSubmitButton loading={loading} label={copy.submit} loadingLabel={copy.loading} />
      </form>
    </AuthLoginCard>
  );
}

export default OtpVerificationStep;
