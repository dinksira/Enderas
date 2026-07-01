import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ROUTES } from '../../../config/routes.js';
import { resolveDefaultRoute } from '../../../config/navigation.config.js';
import { authApi } from '../../users/services/authApi.js';
import { resolveAuthError } from '../../users/utils/resolve-auth-error.js';
import { useAuthStore } from '@enderass/shared/auth';
import { ENV } from '@enderass/shared/api';
import { isValidEthiopianMobile } from '@enderass/shared/utils';
import { useOtpTimer } from '../../users/hooks/use-otp-timer.js';
import { PublicLanguageToggle } from '../components/PublicLanguageToggle.jsx';

const AUTH_TABS = Object.freeze({ LOGIN: 'login', REGISTER: 'register' });
const AUTH_STEPS = Object.freeze({ FORM: 'form', OTP: 'otp' });
const OTP_LENGTH = 6;
const DEFAULT_OTP_TTL = 300;

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

function OtpCells({ value, onChange, disabled }) {
  const inputsRef = useRef([]);

  const handleChange = (index, digit) => {
    const cleaned = digit.replace(/\D/g, '').slice(-1);
    const next = [...value];
    next[index] = cleaned;
    onChange(next);
    if (cleaned && index < OTP_LENGTH - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, event) => {
    if (event.key === 'Backspace' && !value[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  const handlePaste = (event) => {
    const pasted = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH);
    if (!pasted) return;
    event.preventDefault();
    const next = Array.from({ length: OTP_LENGTH }, (_, i) => pasted[i] || '');
    onChange(next);
    const focusIndex = Math.min(pasted.length, OTP_LENGTH - 1);
    inputsRef.current[focusIndex]?.focus();
  };

  return (
    <div className="public-auth__otp-grid" role="group" aria-label="OTP">
      {Array.from({ length: OTP_LENGTH }, (_, index) => (
        <input
          key={index}
          ref={(el) => { inputsRef.current[index] = el; }}
          className="public-auth__otp-cell"
          inputMode="numeric"
          maxLength={1}
          value={value[index] || ''}
          disabled={disabled}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePaste}
          aria-label={`Digit ${index + 1}`}
        />
      ))}
    </div>
  );
}

export function PublicAuthView() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const setSession = useAuthStore((state) => state.setSession);
  const setPendingOtpVerification = useAuthStore((state) => state.setPendingOtpVerification);
  const clearPendingOtpVerification = useAuthStore((state) => state.clearPendingOtpVerification);

  const initialTab = searchParams.get('tab') === 'register' ? AUTH_TABS.REGISTER : AUTH_TABS.LOGIN;
  const redirectParam = searchParams.get('redirect');

  const [tab, setTab] = useState(initialTab);
  const [step, setStep] = useState(AUTH_STEPS.FORM);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [errors, setErrors] = useState({});

  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [userType, setUserType] = useState('individual');
  const [fullName, setFullName] = useState('');
  const [nationalId, setNationalId] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [tinNumber, setTinNumber] = useState('');
  const [otpDigits, setOtpDigits] = useState(Array.from({ length: OTP_LENGTH }, () => ''));
  const [otpMobile, setOtpMobile] = useState('');
  const [otpExpiresAt, setOtpExpiresAt] = useState(null);

  const timerOptions = useMemo(() => ({
    duration: DEFAULT_OTP_TTL,
    expiresAt: otpExpiresAt,
  }), [otpExpiresAt]);

  const { formatted, isExpired, reset: resetOtpTimer } = useOtpTimer(timerOptions);

  useEffect(() => {
    setTab(searchParams.get('tab') === 'register' ? AUTH_TABS.REGISTER : AUTH_TABS.LOGIN);
  }, [searchParams]);

  const clearErrors = useCallback(() => setErrors({}), []);

  const beginOtpStep = useCallback((mobile, expiry) => {
    setOtpMobile(mobile);
    setOtpExpiresAt(expiry?.otpExpiresAt || null);
    setOtpDigits(Array.from({ length: OTP_LENGTH }, () => ''));
    setStep(AUTH_STEPS.OTP);
    resetOtpTimer({
      duration: expiry?.otpExpiresIn || DEFAULT_OTP_TTL,
      expiresAt: expiry?.otpExpiresAt || null,
    });
  }, [resetOtpTimer]);

  const handleLogin = async (event) => {
    event.preventDefault();
    clearErrors();

    const nextErrors = {};
    if (!phoneNumber.trim() || !isValidEthiopianMobile(phoneNumber.trim())) {
      nextErrors.phoneNumber = t('auth.invalidPhone');
    }
    if (!password) {
      nextErrors.password = t('auth.passwordMinLength');
    }
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }

    setLoading(true);
    try {
      const session = await authApi.login({ phoneNumber: phoneNumber.trim(), password });

      if (session.identity?.isMobileVerified === false) {
        setPendingOtpVerification(phoneNumber.trim(), {});
        beginOtpStep(phoneNumber.trim(), {});
        return;
      }

      setSession({
        accessToken: session.accessToken,
        identity: session.identity,
        authz: session.authz,
        user: session.user,
      });

      const roleCode = session.authz?.roleCode;
      const userStatus = session.identity?.status || session.user?.status;

      if (session.identity?.isStaff) {
        window.location.href = `${ENV.adminAppUrl}/login?redirect=staff`;
        return;
      }

      if (['kyc_pending', 'kyc_rejected', 'pending'].includes(userStatus)) {
        navigate(ROUTES.KYC_VERIFICATION, { replace: true });
        return;
      }
      navigate(resolveDefaultRoute(roleCode), { replace: true });
    } catch (err) {
      setErrors({ form: resolveAuthError(err, t) });
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (event) => {
    event.preventDefault();
    clearErrors();

    const normalizedPhone = phoneNumber.trim();
    const nextErrors = {};

    if (!normalizedPhone || !isValidEthiopianMobile(normalizedPhone)) {
      nextErrors.phoneNumber = t('auth.invalidPhone');
    }
    if (!password || password.length < 6) {
      nextErrors.password = t('auth.passwordMinLength');
    }
    if (userType === 'individual') {
      if (!fullName.trim()) nextErrors.fullName = t('auth.fullNameRequired');
      if (!nationalId.trim()) nextErrors.nationalId = t('public.auth.nationalIdRequired');
    }
    if (userType === 'organization') {
      if (!companyName.trim()) nextErrors.companyName = t('auth.companyNameRequired');
      if (!tinNumber.trim()) nextErrors.tinNumber = t('auth.tinRequired');
    }

    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }

    setLoading(true);
    try {
      const nameParts = splitFullName(fullName);
      const response = await authApi.register({
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
        otpExpiresIn: response.otpExpiresIn,
        otpExpiresAt: response.otpExpiresAt,
      });

      beginOtpStep(normalizedPhone, response);
    } catch (err) {
      setErrors({ form: resolveAuthError(err, t) });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (event) => {
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
    clearErrors();
    try {
      const response = await authApi.verifyOtp({
        mobileNumber: otpMobile,
        phoneNumber: otpMobile,
        otp,
      });

      setSession({
        accessToken: response.accessToken,
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

  const handleResendOtp = async () => {
    if (!isExpired || resending) return;

    setResending(true);
    clearErrors();
    try {
      const response = await authApi.resendOtp({
        mobileNumber: otpMobile,
        phoneNumber: otpMobile,
      });
      setOtpExpiresAt(response.otpExpiresAt || null);
      setPendingOtpVerification(otpMobile, {
        otpExpiresIn: response.otpExpiresIn,
        otpExpiresAt: response.otpExpiresAt,
      });
      resetOtpTimer({
        duration: response.otpExpiresIn || DEFAULT_OTP_TTL,
        expiresAt: response.otpExpiresAt || null,
      });
      setOtpDigits(Array.from({ length: OTP_LENGTH }, () => ''));
    } catch (err) {
      setErrors({ form: resolveAuthError(err, t) });
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="public-auth">
      <aside className="public-auth__brand">
        <div className="public-auth__brand-top">
          <Link to={ROUTES.LANDING} className="public-auth__brand-logo">
            <span className="public-auth__brand-mark">E</span>
            <span className="public-auth__brand-name">ENDERAS</span>
          </Link>
          <PublicLanguageToggle />
        </div>

        <div className="public-auth__brand-copy">
          <h1 className="public-auth__brand-headline">{t('public.auth.brandTitle')}</h1>
          <p className="public-auth__brand-sub">{t('public.auth.brandSub')}</p>
        </div>

        <p className="public-auth__brand-foot">{t('public.auth.brandFoot')}</p>
      </aside>

      <section className="public-auth__panel">
        <div className="public-auth__panel-inner">
          {redirectParam === 'bidder' && (
            <div className="redirect-notice" role="status">
              Bidder accounts use the main Enderas platform. Please log in there.
            </div>
          )}
          {step === AUTH_STEPS.OTP ? (
            <>
              <button
                type="button"
                className="public-auth__back"
                onClick={() => setStep(AUTH_STEPS.FORM)}
              >
                ← {t('public.auth.back')}
              </button>
              <h2 className="public-auth__title">{t('public.auth.otpTitle')}</h2>
              <p className="public-auth__lead">
                {t('public.auth.otpLead')}{' '}
                <span className="public-auth__mono">{otpMobile}</span>
              </p>

              <form className="public-auth__form" onSubmit={handleVerifyOtp} noValidate>
                {errors.form && <p className="public-auth__alert" role="alert">{errors.form}</p>}

                <OtpCells
                  value={otpDigits}
                  onChange={setOtpDigits}
                  disabled={loading || resending || isExpired}
                />

                <p className={`public-auth__timer ${isExpired ? 'public-auth__timer--expired' : ''}`}>
                  {isExpired
                    ? t('public.auth.otpExpired')
                    : t('public.auth.otpTimer', { time: formatted })}
                </p>

                <button
                  type="button"
                  className="public-auth__resend"
                  onClick={handleResendOtp}
                  disabled={!isExpired || resending}
                >
                  {resending ? t('public.auth.resending') : t('public.auth.resend')}
                </button>

                <button
                  type="submit"
                  className="pub-btn pub-btn--primary"
                  disabled={loading || isExpired}
                >
                  {loading ? t('public.auth.verifying') : t('public.auth.verify')}
                </button>
              </form>
            </>
          ) : (
            <>
              <div className="public-auth__tabs" role="tablist">
                <button
                  type="button"
                  role="tab"
                  aria-selected={tab === AUTH_TABS.LOGIN}
                  className={`public-auth__tab ${tab === AUTH_TABS.LOGIN ? 'public-auth__tab--active' : ''}`}
                  onClick={() => { setTab(AUTH_TABS.LOGIN); clearErrors(); }}
                >
                  {t('public.auth.loginTab')}
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={tab === AUTH_TABS.REGISTER}
                  className={`public-auth__tab ${tab === AUTH_TABS.REGISTER ? 'public-auth__tab--active' : ''}`}
                  onClick={() => { setTab(AUTH_TABS.REGISTER); clearErrors(); }}
                >
                  {t('public.auth.registerTab')}
                </button>
              </div>

              {tab === AUTH_TABS.LOGIN ? (
                <>
                  <h2 className="public-auth__title">{t('public.auth.loginTitle')}</h2>
                  <p className="public-auth__lead">{t('public.auth.loginLead')}</p>

                  <form className="public-auth__form" onSubmit={handleLogin} noValidate>
                    {errors.form && <p className="public-auth__alert" role="alert">{errors.form}</p>}

                    <div className={`public-auth__field ${errors.phoneNumber ? 'public-auth__field--error' : ''}`}>
                      <label htmlFor="auth-phone">{t('auth.phoneNumber')}</label>
                      <input
                        id="auth-phone"
                        type="tel"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        placeholder="0912345678"
                        disabled={loading}
                        autoComplete="tel"
                      />
                      {errors.phoneNumber && <p className="public-auth__error">{errors.phoneNumber}</p>}
                    </div>

                    <div className={`public-auth__field ${errors.password ? 'public-auth__field--error' : ''}`}>
                      <label htmlFor="auth-password">{t('auth.password')}</label>
                      <input
                        id="auth-password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={loading}
                        autoComplete="current-password"
                      />
                      {errors.password && <p className="public-auth__error">{errors.password}</p>}
                    </div>

                    <div className="public-auth__row">
                      <span />
                      <Link to={ROUTES.LOGIN} className="public-auth__link">
                        {t('public.auth.forgotPassword')}
                      </Link>
                    </div>

                    <button type="submit" className="pub-btn pub-btn--primary" disabled={loading}>
                      {loading ? t('public.auth.loggingIn') : t('public.auth.loginCta')}
                    </button>
                  </form>

                  <p className="staff-redirect-hint">
                    Are you Enderas staff?{' '}
                    <a href={`${ENV.adminAppUrl}/login`}>Go to Admin Portal →</a>
                  </p>
                </>
              ) : (
                <>
                  <h2 className="public-auth__title">{t('public.auth.registerTitle')}</h2>
                  <p className="public-auth__lead">{t('public.auth.registerLead')}</p>

                  <form className="public-auth__form" onSubmit={handleRegister} noValidate>
                    {errors.form && <p className="public-auth__alert" role="alert">{errors.form}</p>}

                    <div className="public-auth__toggle" role="group" aria-label={t('auth.userType')}>
                      <button
                        type="button"
                        className={`public-auth__toggle-btn ${userType === 'individual' ? 'public-auth__toggle-btn--active' : ''}`}
                        onClick={() => setUserType('individual')}
                        disabled={loading}
                      >
                        {t('auth.individual')}
                      </button>
                      <button
                        type="button"
                        className={`public-auth__toggle-btn ${userType === 'organization' ? 'public-auth__toggle-btn--active' : ''}`}
                        onClick={() => setUserType('organization')}
                        disabled={loading}
                      >
                        {t('auth.organization')}
                      </button>
                    </div>

                    {userType === 'individual' ? (
                      <>
                        <div className={`public-auth__field ${errors.fullName ? 'public-auth__field--error' : ''}`}>
                          <label htmlFor="auth-name">{t('auth.fullName')}</label>
                          <input
                            id="auth-name"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            disabled={loading}
                          />
                          {errors.fullName && <p className="public-auth__error">{errors.fullName}</p>}
                        </div>
                        <div className={`public-auth__field ${errors.nationalId ? 'public-auth__field--error' : ''}`}>
                          <label htmlFor="auth-nid">{t('public.auth.nationalId')}</label>
                          <input
                            id="auth-nid"
                            value={nationalId}
                            onChange={(e) => setNationalId(e.target.value)}
                            disabled={loading}
                          />
                          {errors.nationalId && <p className="public-auth__error">{errors.nationalId}</p>}
                        </div>
                      </>
                    ) : (
                      <>
                        <div className={`public-auth__field ${errors.companyName ? 'public-auth__field--error' : ''}`}>
                          <label htmlFor="auth-company">{t('auth.companyName')}</label>
                          <input
                            id="auth-company"
                            value={companyName}
                            onChange={(e) => setCompanyName(e.target.value)}
                            disabled={loading}
                          />
                          {errors.companyName && <p className="public-auth__error">{errors.companyName}</p>}
                        </div>
                        <div className={`public-auth__field ${errors.tinNumber ? 'public-auth__field--error' : ''}`}>
                          <label htmlFor="auth-tin">{t('auth.tinNumber')}</label>
                          <input
                            id="auth-tin"
                            value={tinNumber}
                            onChange={(e) => setTinNumber(e.target.value)}
                            disabled={loading}
                          />
                          {errors.tinNumber && <p className="public-auth__error">{errors.tinNumber}</p>}
                        </div>
                        <div className="public-auth__upload">
                          <label htmlFor="trade-license">{t('public.auth.tradeLicense')}</label>
                          <input id="trade-license" type="file" accept=".pdf,image/*" disabled={loading} />
                        </div>
                        <div className="public-auth__upload">
                          <label htmlFor="tin-cert">{t('public.auth.tinCertificate')}</label>
                          <input id="tin-cert" type="file" accept=".pdf,image/*" disabled={loading} />
                        </div>
                        <div className="public-auth__upload">
                          <label htmlFor="biz-reg">{t('public.auth.businessRegistration')}</label>
                          <input id="biz-reg" type="file" accept=".pdf,image/*" disabled={loading} />
                        </div>
                      </>
                    )}

                    <div className={`public-auth__field ${errors.phoneNumber ? 'public-auth__field--error' : ''}`}>
                      <label htmlFor="auth-reg-phone">{t('auth.phoneNumber')}</label>
                      <input
                        id="auth-reg-phone"
                        type="tel"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        placeholder="0912345678"
                        disabled={loading}
                        autoComplete="tel"
                      />
                      {errors.phoneNumber && <p className="public-auth__error">{errors.phoneNumber}</p>}
                    </div>

                    <div className={`public-auth__field ${errors.password ? 'public-auth__field--error' : ''}`}>
                      <label htmlFor="auth-reg-password">{t('auth.password')}</label>
                      <input
                        id="auth-reg-password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={loading}
                        autoComplete="new-password"
                      />
                      {errors.password && <p className="public-auth__error">{errors.password}</p>}
                    </div>

                    <p className="public-auth__hint public-auth__hint--kyc">
                      {t('public.auth.kycNotice')}
                    </p>

                    <button type="submit" className="pub-btn pub-btn--primary" disabled={loading}>
                      {loading ? t('auth.registering') : t('auth.register')}
                    </button>
                  </form>
                </>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  );
}

export default PublicAuthView;
