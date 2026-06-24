import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AuthBrandPanel } from '../../users/components/auth-brand-panel.jsx';
import { RegisterStep } from '../../users/components/register-step.jsx';
import { authApi } from '../../users/services/authApi.js';
import { resolveAuthError } from '../../users/utils/resolve-auth-error.js';
import { useAuthStore } from '../../../stores/auth-store.js';
import { ROUTES } from '../../../config/routes.js';

const PHONE_PATTERN = /^09\d{8}$/;

function splitFullName(fullName) {
  const trimmed = fullName.trim();
  const spaceIndex = trimmed.indexOf(' ');

  if (spaceIndex === -1) {
    return { firstName: trimmed, lastName: '' };
  }

  return {
    firstName: trimmed.slice(0, spaceIndex),
    lastName: trimmed.slice(spaceIndex + 1).trim(),
  };
}

export function RegisterView() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const setPendingOtpVerification = useAuthStore((state) => state.setPendingOtpVerification);

  const [locale, setLocale] = useState(i18n.language === 'am' ? 'am' : 'en');
  const [userType, setUserType] = useState('individual');
  const [fullName, setFullName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [tinNumber, setTinNumber] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const clearFieldError = (field) => {
    setErrors((current) => ({ ...current, [field]: undefined, form: undefined }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrors({});

    const nextErrors = {};
    const normalizedPhone = phoneNumber.trim();

    if (!PHONE_PATTERN.test(normalizedPhone)) {
      nextErrors.phoneNumber = t('auth.invalidPhone');
    }

    if (!password || password.length < 6) {
      nextErrors.password = t('auth.passwordMinLength');
    }

    if (userType === 'individual' && !fullName.trim()) {
      nextErrors.fullName = t('auth.fullNameRequired');
    }

    if (userType === 'organization') {
      if (!companyName.trim()) {
        nextErrors.companyName = t('auth.companyNameRequired');
      }
      if (!tinNumber.trim()) {
        nextErrors.tinNumber = t('auth.tinRequired');
      }
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setLoading(true);

    try {
      const nameParts = splitFullName(fullName);

      await authApi.register({
        userType,
        mobileNumber: normalizedPhone,
        phoneNumber: normalizedPhone,
        password,
        firstName: userType === 'individual' ? nameParts.firstName : undefined,
        lastName: userType === 'individual' ? nameParts.lastName : undefined,
        organizationName: userType === 'organization' ? companyName.trim() : undefined,
      });

      setPendingOtpVerification(normalizedPhone, {
        userType,
        tinNumber: userType === 'organization' ? tinNumber.trim() : null,
      });

      navigate(ROUTES.OTP_VERIFICATION, {
        state: { mobileNumber: normalizedPhone },
      });
    } catch (err) {
      setErrors({ form: resolveAuthError(err, t) });
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="premium-login-view" aria-live="polite">
      <div className="premium-login-view__container">
        <AuthBrandPanel />

        <div className="premium-login-view__right">
          <div className="premium-login-view__step premium-login-view__step--register">
            <RegisterStep
              locale={locale}
              userType={userType}
              fullName={fullName}
              companyName={companyName}
              tinNumber={tinNumber}
              phoneNumber={phoneNumber}
              password={password}
              loading={loading}
              errors={errors}
              onUserTypeChange={(type) => {
                setUserType(type);
                setErrors({});
              }}
              onFullNameChange={(event) => {
                setFullName(event.target.value);
                clearFieldError('fullName');
              }}
              onCompanyNameChange={(event) => {
                setCompanyName(event.target.value);
                clearFieldError('companyName');
              }}
              onTinNumberChange={(event) => {
                setTinNumber(event.target.value);
                clearFieldError('tinNumber');
              }}
              onPhoneChange={(event) => {
                setPhoneNumber(event.target.value);
                clearFieldError('phoneNumber');
              }}
              onPasswordChange={(event) => {
                setPassword(event.target.value);
                clearFieldError('password');
              }}
              onSubmit={handleSubmit}
              onLocaleChange={setLocale}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

export default RegisterView;
