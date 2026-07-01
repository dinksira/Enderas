import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ROUTES } from '../../../config/routes.js';
import {
  AuthFormAlert,
  AuthLoginCard,
  AuthPasswordInput,
  AuthPhoneInput,
  AuthStepTitle,
  AuthSubmitButton,
} from './auth-login-card.jsx';
import { LoginLocaleSwitcher } from './login-locale-switcher.jsx';
import { ENV } from '@enderass/shared/api';

const COPY = {
  en: {
    title: 'Confirm Identity',
    phoneLabel: 'Phone Number',
    passwordLabel: 'Password',
    submit: 'Login',
    loading: 'Logging In...',
    phonePlaceholder: '09123456789',
    phoneHint: 'Enter your mobile number starting with 09',
  },
  am: {
    title: 'ማንነት ያረጋግጡ',
    phoneLabel: 'ስልክ ቁጥር',
    passwordLabel: 'የይለፍ ቃል',
    submit: 'ግባ',
    loading: 'በመግባት ላይ...',
    phonePlaceholder: '09123456789',
    phoneHint: 'ከ 09 ጀምሮ የሞባይል ቁጥርዎን ያስገቡ',
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
  const { t } = useTranslation();

  return (
    <AuthLoginCard footer={<LoginLocaleSwitcher locale={locale} onLocaleChange={onLocaleChange} />}>
      <AuthStepTitle title={copy.title} />

      <form className="auth-login-card__fields" onSubmit={onSubmit} noValidate>
        <AuthFormAlert message={errors.form} />

        <AuthPhoneInput
          label={copy.phoneLabel}
          name="phoneNumber"
          placeholder={copy.phonePlaceholder}
          hint={copy.phoneHint}
          value={phoneNumber}
          onChange={onPhoneChange}
          error={errors.phoneNumber}
          disabled={loading}
          required
          clearLabel={t('auth.clearField')}
        />

        <AuthPasswordInput
          label={copy.passwordLabel}
          name="password"
          value={password}
          onChange={onPasswordChange}
          error={errors.password}
          disabled={loading}
          required
          showPasswordLabel={t('auth.showPassword')}
          hidePasswordLabel={t('auth.hidePassword')}
        />

        <AuthSubmitButton loading={loading} label={copy.submit} loadingLabel={copy.loading} />

        <p className="auth-login-card__footer-link">
          {t('auth.noAccount')}{' '}
          <Link to={ROUTES.REGISTER}>{t('auth.createAccount')}</Link>
        </p>

        <p className="bidder-redirect-hint">
          Looking to bid?{' '}
          <a href={ENV.publicAppUrl}>Go to Enderas →</a>
        </p>
      </form>
    </AuthLoginCard>
  );
}

export default CredentialsStep;
