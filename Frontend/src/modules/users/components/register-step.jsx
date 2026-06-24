import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ROUTES } from '../../../config/routes.js';
import {
  AuthFormAlert,
  AuthInput,
  AuthLoginCard,
  AuthStepTitle,
  AuthSubmitButton,
} from './auth-login-card.jsx';
import { LoginLocaleSwitcher } from './login-locale-switcher.jsx';

/**
 * @param {Object} props
 * @param {'en' | 'am'} props.locale
 * @param {'individual' | 'organization'} props.userType
 * @param {string} props.fullName
 * @param {string} props.companyName
 * @param {string} props.tinNumber
 * @param {string} props.phoneNumber
 * @param {string} props.password
 * @param {boolean} props.loading
 * @param {Record<string, string>} props.errors
 * @param {function} props.onUserTypeChange
 * @param {function} props.onFullNameChange
 * @param {function} props.onCompanyNameChange
 * @param {function} props.onTinNumberChange
 * @param {function} props.onPhoneChange
 * @param {function} props.onPasswordChange
 * @param {function} props.onSubmit
 * @param {function} props.onLocaleChange
 */
export function RegisterStep({
  locale,
  userType,
  fullName,
  companyName,
  tinNumber,
  phoneNumber,
  password,
  loading,
  errors = {},
  onUserTypeChange,
  onFullNameChange,
  onCompanyNameChange,
  onTinNumberChange,
  onPhoneChange,
  onPasswordChange,
  onSubmit,
  onLocaleChange,
}) {
  const { t } = useTranslation();

  return (
    <AuthLoginCard footer={<LoginLocaleSwitcher locale={locale} onLocaleChange={onLocaleChange} />}>
      <AuthStepTitle title={t('auth.registerTitle')} />

      <form className="auth-login-card__fields" onSubmit={onSubmit} noValidate>
        <AuthFormAlert message={errors.form} />

        <div
          className="auth-login-card__toggle"
          role="group"
          aria-label={t('auth.userType')}
        >
          <button
            type="button"
            className={`auth-login-card__toggle-btn ${userType === 'individual' ? 'auth-login-card__toggle-btn--active' : ''}`}
            onClick={() => onUserTypeChange('individual')}
            disabled={loading}
          >
            {t('auth.individual')}
          </button>
          <button
            type="button"
            className={`auth-login-card__toggle-btn ${userType === 'organization' ? 'auth-login-card__toggle-btn--active' : ''}`}
            onClick={() => onUserTypeChange('organization')}
            disabled={loading}
          >
            {t('auth.organization')}
          </button>
        </div>

        {userType === 'individual' ? (
          <AuthInput
            label={t('auth.fullName')}
            name="fullName"
            type="text"
            autoComplete="name"
            value={fullName}
            onChange={onFullNameChange}
            error={errors.fullName}
            disabled={loading}
            required
          />
        ) : (
          <>
            <AuthInput
              label={t('auth.companyName')}
              name="companyName"
              type="text"
              autoComplete="organization"
              value={companyName}
              onChange={onCompanyNameChange}
              error={errors.companyName}
              disabled={loading}
              required
            />
            <AuthInput
              label={t('auth.tinNumber')}
              name="tinNumber"
              type="text"
              inputMode="numeric"
              value={tinNumber}
              onChange={onTinNumberChange}
              error={errors.tinNumber}
              disabled={loading}
              required
            />
          </>
        )}

        <AuthInput
          label={t('auth.phoneNumber')}
          name="phoneNumber"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="09123456789"
          value={phoneNumber}
          onChange={onPhoneChange}
          error={errors.phoneNumber}
          disabled={loading}
          required
        />

        <AuthInput
          label={t('auth.password')}
          name="password"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={onPasswordChange}
          error={errors.password}
          disabled={loading}
          required
        />

        <AuthSubmitButton
          loading={loading}
          label={t('auth.register')}
          loadingLabel={t('auth.registering')}
        />

        <p className="auth-login-card__footer-link">
          {t('auth.haveAccount')}{' '}
          <Link to={ROUTES.LOGIN}>{t('auth.signIn')}</Link>
        </p>
      </form>
    </AuthLoginCard>
  );
}

export default RegisterStep;
