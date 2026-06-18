import {
  AuthFormAlert,
  AuthInput,
  AuthLoginCard,
  AuthStepTitle,
  AuthSubmitButton,
} from './auth-login-card.jsx';
import { LoginBrandHeader } from './login-brand-header.jsx';
import { LoginLocaleSwitcher } from './login-locale-switcher.jsx';

const COPY = {
  en: {
    title: 'Confirm Identity',
    phoneLabel: 'Phone Number',
    passwordLabel: 'Password',
    submit: 'Login',
    loading: 'Logging In...',
    phonePlaceholder: '09123456789',
  },
  am: {
    title: 'ማንነት ያረጋግጡ',
    phoneLabel: 'ስልክ ቁጥር',
    passwordLabel: 'የይለፍ ቃል',
    submit: 'ግባ',
    loading: 'በመግባት ላይ...',
    phonePlaceholder: '09123456789',
  },
};

/**
 * @param {Object} props
 * @param {'en' | 'am'} props.locale
 * @param {string} props.phoneNumber
 * @param {string} props.password
 * @param {boolean} props.loading
 * @param {{ phoneNumber?: string, password?: string, form?: string }} props.errors
 * @param {function} props.onPhoneChange
 * @param {function} props.onPasswordChange
 * @param {function} props.onSubmit
 * @param {function} props.onLocaleChange
 */
export function CredentialsStep({
  locale,
  phoneNumber,
  password,
  loading,
  errors = {},
  onPhoneChange,
  onPasswordChange,
  onSubmit,
  onLocaleChange,
}) {
  const copy = COPY[locale];

  return (
    <AuthLoginCard footer={<LoginLocaleSwitcher locale={locale} onLocaleChange={onLocaleChange} />}>
      <LoginBrandHeader />
      <AuthStepTitle title={copy.title} />

      <form className="auth-login-card__fields" onSubmit={onSubmit} noValidate>
        <AuthFormAlert message={errors.form} />

        <AuthInput
          label={copy.phoneLabel}
          name="phoneNumber"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder={copy.phonePlaceholder}
          value={phoneNumber}
          onChange={onPhoneChange}
          error={errors.phoneNumber}
          disabled={loading}
          required
        />

        <AuthInput
          label={copy.passwordLabel}
          name="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={onPasswordChange}
          error={errors.password}
          disabled={loading}
          required
        />

        <AuthSubmitButton loading={loading} label={copy.submit} loadingLabel={copy.loading} />
      </form>
    </AuthLoginCard>
  );
}

export default CredentialsStep;
