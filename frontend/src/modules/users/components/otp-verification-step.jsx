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
    resendPrefix: 'Code expires in',
    resendAction: 'Resend Code',
    resending: 'Sending...',
    expired: 'Verification code expired. Resend a new code to continue.',
  },
  am: {
    title: 'OTP ያስገቡ',
    instruction: '6-አሃዝ የማረጋገጫ ኮድ ወደ የተመዘገበ የሞባይል ቁጥርዎ ተልኳል።',
    submit: 'አረጋግጥ',
    loading: 'በማረጋገጥ ላይ...',
    resendPrefix: 'ኮዱ ያበቃል በ',
    resendAction: 'ኮድ እንደገና ላክ',
    resending: 'በመላክ ላይ...',
    expired: 'የማረጋገጫ ኮዱ ጊዜው አልፏል። አዲስ ኮድ ይጠይቁ።',
  },
};

/**
 * @param {Object} props
 * @param {'en' | 'am'} props.locale
 * @param {string[]} props.otpDigits
 * @param {boolean} props.loading
 * @param {boolean} props.resending
 * @param {boolean} props.canResend
 * @param {boolean} [props.submitDisabled]
 * @param {string} [props.expiredMessage]
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
  submitDisabled = false,
  expiredMessage = '',
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

        <OtpInputGrid
          value={otpDigits}
          onChange={onOtpChange}
          disabled={loading || resending || submitDisabled}
        />

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
              {copy.resendPrefix} {timerLabel}
            </p>
          )}
        </div>

        {submitDisabled && (
          <p className="auth-login-card__hint auth-login-card__hint--warning" role="status">
            {expiredMessage || copy.expired}
          </p>
        )}

        <AuthSubmitButton
          loading={loading}
          label={copy.submit}
          loadingLabel={copy.loading}
          disabled={submitDisabled}
        />
      </form>
    </AuthLoginCard>
  );
}

export default OtpVerificationStep;
