import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../../../components/Button.jsx';
import { userService } from '../services/user-service.js';

const EMPTY_FORM = {
  mobileNumber: '',
  password: '',
  confirmPassword: '',
  userType: 'individual',
  firstName: '',
  lastName: '',
  email: '',
  organizationName: '',
  nationalIdNumber: '',
  tinNumber: '',
  preferredLanguage: 'en',
};

const USER_CREATE_MODAL_STYLES = `
.user-create-modal {
  width: min(560px, 100%);
  max-height: min(92vh, 900px);
  display: flex;
  flex-direction: column;
  padding: 0;
  overflow: hidden;
  border-radius: var(--semantic-radius-default);
}

.user-create-modal__scroll {
  flex: 1;
  overflow-y: auto;
  padding: var(--core-space-5);
}

.user-create-modal__divider {
  border: none;
  border-top: 1px solid var(--dashboard-border);
  margin: var(--core-space-5) 0;
}

.user-create-modal__section-title {
  margin: 0 0 var(--core-space-4);
  padding-left: var(--core-space-3);
  border-left: 3px solid var(--semantic-color-brand-primary);
  font-family: var(--semantic-font-ui);
  font-size: var(--core-font-size-body-sm);
  font-weight: var(--core-font-weight-bold);
  color: var(--dashboard-text-primary);
  text-transform: uppercase;
  letter-spacing: var(--core-letter-spacing-label);
}

.user-create-modal__type-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--core-space-3);
  margin-bottom: var(--core-space-5);
}

.user-create-modal__type-card {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--core-space-1);
  padding: var(--core-space-4);
  border: 1px solid var(--dashboard-border);
  border-left: 3px solid transparent;
  background: var(--dashboard-surface-bg);
  cursor: pointer;
  text-align: left;
  border-radius: var(--semantic-radius-default);
  transition: var(--core-transition-border), var(--core-transition-bg);
}

.user-create-modal__type-card:hover {
  border-color: var(--semantic-color-border-hover);
}

.user-create-modal__type-card--active {
  border-left-color: var(--semantic-color-brand-primary);
  background: var(--semantic-color-surface-hover);
  border-color: var(--semantic-color-brand-primary);
}

.user-create-modal__type-label {
  font-family: var(--semantic-font-ui);
  font-size: var(--core-font-size-body-sm);
  font-weight: var(--core-font-weight-bold);
  color: var(--dashboard-text-primary);
}

.user-create-modal__type-hint {
  font-family: var(--semantic-font-body);
  font-size: 12px;
  color: var(--dashboard-text-subtle);
  line-height: var(--core-line-height-normal);
}

.user-create-modal__grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--core-space-4);
}

.user-create-modal__grid--single {
  grid-template-columns: 1fr;
}

.user-create-modal__full {
  grid-column: 1 / -1;
}

.user-create-modal__field {
  display: flex;
  flex-direction: column;
  gap: var(--component-input-label-gap);
}

.user-create-modal__label {
  font-family: var(--component-input-label-font-family);
  font-size: var(--component-input-label-font-size);
  font-weight: var(--component-input-label-font-weight);
  letter-spacing: var(--component-input-label-letter-spacing);
  color: var(--component-input-label-color);
}

.user-create-modal__required {
  color: var(--semantic-color-error);
}

.user-create-modal__control {
  width: 100%;
  min-height: var(--component-input-height);
  padding: 0 var(--component-input-padding-x);
  border: 1px solid var(--component-input-border);
  background: var(--component-input-bg);
  color: var(--component-input-text);
  font-family: var(--component-input-font-family);
  font-size: var(--component-input-font-size);
  border-radius: var(--component-input-radius);
}

.user-create-modal__control:focus {
  outline: none;
  border-color: var(--component-input-border-focus);
  box-shadow: var(--component-input-focus-ring);
}

.user-create-modal__control--error {
  border-color: var(--component-input-border-error);
}

.user-create-modal__control--error:focus {
  box-shadow: var(--component-input-error-focus-ring);
}

.user-create-modal__control:disabled {
  opacity: var(--core-opacity-disabled);
  cursor: not-allowed;
}

.user-create-modal__mobile-input {
  display: flex;
  align-items: stretch;
  border: 1px solid var(--component-input-border);
  background: var(--component-input-bg);
  border-radius: var(--component-input-radius);
}

.user-create-modal__mobile-input--error {
  border-color: var(--component-input-border-error);
}

.user-create-modal__mobile-prefix {
  display: inline-flex;
  align-items: center;
  padding: 0 var(--core-space-3);
  border-right: 1px solid var(--dashboard-border);
  font-family: var(--semantic-font-ui);
  font-size: var(--core-font-size-body-sm);
  font-weight: var(--core-font-weight-semibold);
  color: var(--dashboard-text-subtle);
  white-space: nowrap;
}

.user-create-modal__mobile-input .user-create-modal__control {
  border: none;
  min-height: calc(var(--component-input-height) - 2px);
}

.user-create-modal__mobile-input .user-create-modal__control:focus {
  box-shadow: none;
}

.user-create-modal__password-wrap {
  position: relative;
}

.user-create-modal__password-wrap .user-create-modal__control {
  padding-right: var(--core-space-7);
}

.user-create-modal__password-toggle {
  position: absolute;
  top: 50%;
  right: var(--core-space-3);
  transform: translateY(-50%);
  border: none;
  background: transparent;
  color: var(--dashboard-text-subtle);
  cursor: pointer;
  padding: var(--core-space-1);
  border-radius: var(--semantic-radius-default);
  line-height: 0;
}

.user-create-modal__password-toggle:hover {
  color: var(--dashboard-text-primary);
}

.user-create-modal__password-toggle:disabled {
  opacity: var(--core-opacity-disabled);
  cursor: not-allowed;
}

.user-create-modal__hint {
  margin: var(--core-space-2) 0 0;
  font-family: var(--semantic-font-body);
  font-size: 12px;
  color: var(--dashboard-text-subtle);
  line-height: var(--core-line-height-normal);
}

.user-create-modal__error {
  margin: 0;
  font-family: var(--component-input-error-font-family);
  font-size: var(--component-input-error-font-size);
  color: var(--component-input-error-color);
}

.user-create-modal__submit-error {
  margin: 0 var(--core-space-5) var(--core-space-3);
}

.user-create-modal__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--core-space-3);
  padding: var(--core-space-4) var(--core-space-5);
  border-top: 1px solid var(--dashboard-border);
  background: var(--dashboard-surface-bg);
}

.user-create-modal__footer-actions {
  display: flex;
  align-items: center;
  gap: var(--core-space-3);
}

@media (max-width: 560px) {
  .user-create-modal__type-grid,
  .user-create-modal__grid {
    grid-template-columns: 1fr;
  }
}
`;

function formatMobileNumber(localNumber) {
  const digits = localNumber.replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('251')) return `+${digits}`;
  return `+251${digits}`;
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function EyeIcon({ open }) {
  if (open) {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M3 12s3.5-6 9-6 9 6 9 6-3.5 6-9 6-9-6-9-6z"
          stroke="currentColor"
          strokeWidth="1.8"
        />
        <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
      </svg>
    );
  }

  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M3 3l18 18M10.6 10.6A3 3 0 0012 15a3 3 0 002.4-4.4M6.2 6.2C4.2 7.6 2.7 9.5 2 12c0 0 3.5 6 10 6 1.8 0 3.4-.5 4.8-1.2M9.9 5.1A10.7 10.7 0 0112 5c6.5 0 10 6 10 6a17.8 17.8 0 01-4.1 4.8"
        stroke="currentColor"
        strokeWidth="1.8"
      />
    </svg>
  );
}

/**
 * @param {{
 *   open: boolean,
 *   loading?: boolean,
 *   onClose: () => void,
 *   onSubmit: (payload: object) => Promise<void>,
 * }} props
 */
export function UserCreateModal({ open, loading = false, onClose, onSubmit }) {
  const { t } = useTranslation();
  const [form, setForm] = useState(EMPTY_FORM);
  const [bidderRoleId, setBidderRoleId] = useState(null);
  const [roleLoading, setRoleLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    if (!open) {
      setForm(EMPTY_FORM);
      setBidderRoleId(null);
      setErrors({});
      setTouched({});
      setSubmitError('');
      setShowPassword(false);
      setShowConfirmPassword(false);
      return;
    }

    let cancelled = false;

    const loadBidderRole = async () => {
      setRoleLoading(true);
      try {
        const nextRoles = await userService.listCreateRoles();
        const bidderRole = nextRoles.find((role) => role.code === 'bidder');
        if (!cancelled) {
          setBidderRoleId(bidderRole?.id ?? null);
        }
      } catch {
        if (!cancelled) {
          setBidderRoleId(null);
        }
      } finally {
        if (!cancelled) {
          setRoleLoading(false);
        }
      }
    };

    loadBidderRole();

    return () => {
      cancelled = true;
    };
  }, [open]);

  if (!open) return null;

  const isIndividual = form.userType === 'individual';

  const setField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
    if (touched[field]) {
      const fieldError = validateField(field, { ...form, [field]: value });
      setErrors((current) => {
        const next = { ...current };
        if (fieldError) next[field] = fieldError;
        else delete next[field];
        return next;
      });
    }
    setSubmitError('');
  };

  const validateField = (field, values = form) => {
    switch (field) {
      case 'firstName':
        if (values.userType === 'individual' && !values.firstName.trim()) {
          return t('users.management.createModal.firstNameRequired');
        }
        return '';
      case 'lastName':
        if (values.userType === 'individual' && !values.lastName.trim()) {
          return t('users.management.createModal.lastNameRequired');
        }
        return '';
      case 'organizationName':
        if (values.userType === 'organization' && !values.organizationName.trim()) {
          return t('users.management.createModal.organizationRequired');
        }
        return '';
      case 'mobileNumber':
        if (!values.mobileNumber.trim()) {
          return t('users.management.createModal.mobileRequired');
        }
        return '';
      case 'nationalIdNumber':
        if (values.userType === 'individual' && !values.nationalIdNumber.trim()) {
          return t('users.management.createModal.nationalIdRequired');
        }
        return '';
      case 'tinNumber':
        if (values.userType === 'organization' && !values.tinNumber.trim()) {
          return t('users.management.createModal.tinRequired');
        }
        return '';
      case 'email':
        if (values.userType === 'organization' && !values.email.trim()) {
          return t('users.management.createModal.emailRequired');
        }
        if (values.email.trim() && !isValidEmail(values.email.trim())) {
          return t('users.management.createModal.emailInvalid');
        }
        return '';
      case 'password':
        if (!values.password.trim()) {
          return t('users.management.createModal.passwordRequired');
        }
        if (values.password.length < 6) {
          return t('users.management.createModal.passwordMinLength');
        }
        return '';
      case 'confirmPassword':
        if (!values.confirmPassword.trim()) {
          return t('users.management.createModal.confirmPasswordRequired');
        }
        if (values.confirmPassword !== values.password) {
          return t('users.management.createModal.passwordMismatch');
        }
        return '';
      default:
        return '';
    }
  };

  const validateAll = () => {
    const fields = [
      'mobileNumber',
      'password',
      'confirmPassword',
      'email',
      isIndividual ? 'firstName' : 'organizationName',
      isIndividual ? 'lastName' : 'tinNumber',
      isIndividual ? 'nationalIdNumber' : null,
    ].filter(Boolean);

    const nextErrors = {};
    fields.forEach((field) => {
      const message = validateField(field);
      if (message) nextErrors[field] = message;
    });

    setErrors(nextErrors);
    setTouched(
      fields.reduce((acc, field) => {
        acc[field] = true;
        return acc;
      }, {}),
    );

    return Object.keys(nextErrors).length === 0;
  };

  const handleBlur = (field) => {
    setTouched((current) => ({ ...current, [field]: true }));
    const message = validateField(field);
    setErrors((current) => {
      const next = { ...current };
      if (message) next[field] = message;
      else delete next[field];
      return next;
    });
  };

  const handleUserTypeChange = (userType) => {
    setForm((current) => ({ ...current, userType }));
    setErrors({});
    setTouched({});
    setSubmitError('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!bidderRoleId) {
      setSubmitError(t('users.management.createModal.rolesUnavailable'));
      return;
    }
    if (!validateAll()) return;

    setSubmitError('');

    try {
      await onSubmit({
        mobileNumber: formatMobileNumber(form.mobileNumber.trim()),
        password: form.password,
        roleId: bidderRoleId,
        userType: form.userType,
        firstName: isIndividual ? form.firstName.trim() : undefined,
        lastName: isIndividual ? form.lastName.trim() : undefined,
        email: form.email.trim() || undefined,
        organizationName: !isIndividual ? form.organizationName.trim() : undefined,
        preferredLanguage: form.preferredLanguage,
      });
      onClose();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : t('users.management.createModal.failed'));
    }
  };

  const renderFieldError = (field) =>
    touched[field] && errors[field] ? (
      <p className="user-create-modal__error" role="alert">
        {errors[field]}
      </p>
    ) : null;

  const renderLabel = (text, required = false) => (
    <span className="user-create-modal__label">
      {text}
      {required && (
        <span className="user-create-modal__required" aria-hidden="true">
          {' '}
          *
        </span>
      )}
    </span>
  );

  return (
    <>
      <style>{USER_CREATE_MODAL_STYLES}</style>
      <div className="kyc-modal-overlay" role="presentation" onClick={loading ? undefined : onClose}>
        <form
          className="kyc-modal user-create-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="user-create-modal-title"
          onClick={(event) => event.stopPropagation()}
          onSubmit={handleSubmit}
        >
          <div className="auction-create-modal__header">
            <div>
              <h2 id="user-create-modal-title" className="kyc-modal__title">
                {t('users.management.createModal.title')}
              </h2>
              <p className="kyc-modal__body">{t('users.management.createModal.subtitle')}</p>
            </div>
            <button
              type="button"
              className="auction-create-modal__close"
              onClick={onClose}
              disabled={loading}
              aria-label={t('common.close')}
            >
              ×
            </button>
          </div>

          <div className="user-create-modal__scroll">
            <p className="user-create-modal__label">{t('users.management.createModal.accountType')}</p>
            <div className="user-create-modal__type-grid" role="radiogroup" aria-label={t('users.management.createModal.accountType')}>
              {['individual', 'organization'].map((type) => {
                const isActive = form.userType === type;
                return (
                  <button
                    key={type}
                    type="button"
                    role="radio"
                    aria-checked={isActive}
                    className={[
                      'user-create-modal__type-card',
                      isActive ? 'user-create-modal__type-card--active' : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    onClick={() => handleUserTypeChange(type)}
                    disabled={loading}
                  >
                    <span className="user-create-modal__type-label">
                      {t(`users.management.userTypes.${type}`)}
                    </span>
                    <span className="user-create-modal__type-hint">
                      {t(`users.management.createModal.accountTypeHints.${type}`)}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className={`user-create-modal__grid${isIndividual ? '' : ' user-create-modal__grid--single'}`}>
              {isIndividual ? (
                <>
                  <div className="user-create-modal__field">
                    {renderLabel(t('users.management.createModal.firstName'), true)}
                    <input
                      className={[
                        'user-create-modal__control',
                        touched.firstName && errors.firstName ? 'user-create-modal__control--error' : '',
                      ]
                        .filter(Boolean)
                        .join(' ')}
                      value={form.firstName}
                      onChange={(event) => setField('firstName', event.target.value)}
                      onBlur={() => handleBlur('firstName')}
                      disabled={loading}
                      autoComplete="off"
                    />
                    {renderFieldError('firstName')}
                  </div>
                  <div className="user-create-modal__field">
                    {renderLabel(t('users.management.createModal.lastName'), true)}
                    <input
                      className={[
                        'user-create-modal__control',
                        touched.lastName && errors.lastName ? 'user-create-modal__control--error' : '',
                      ]
                        .filter(Boolean)
                        .join(' ')}
                      value={form.lastName}
                      onChange={(event) => setField('lastName', event.target.value)}
                      onBlur={() => handleBlur('lastName')}
                      disabled={loading}
                      autoComplete="off"
                    />
                    {renderFieldError('lastName')}
                  </div>
                </>
              ) : (
                <div className="user-create-modal__field user-create-modal__full">
                  {renderLabel(t('users.management.createModal.organizationName'), true)}
                  <input
                    className={[
                      'user-create-modal__control',
                      touched.organizationName && errors.organizationName
                        ? 'user-create-modal__control--error'
                        : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    value={form.organizationName}
                    onChange={(event) => setField('organizationName', event.target.value)}
                    onBlur={() => handleBlur('organizationName')}
                    disabled={loading}
                    autoComplete="off"
                  />
                  {renderFieldError('organizationName')}
                </div>
              )}

              <div className="user-create-modal__field user-create-modal__full">
                {renderLabel(t('users.management.createModal.mobile'), true)}
                <div
                  className={[
                    'user-create-modal__mobile-input',
                    touched.mobileNumber && errors.mobileNumber
                      ? 'user-create-modal__mobile-input--error'
                      : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                >
                  <span className="user-create-modal__mobile-prefix">
                    {t('users.management.createModal.mobilePrefix')}
                  </span>
                  <input
                    className="user-create-modal__control"
                    value={form.mobileNumber}
                    onChange={(event) => setField('mobileNumber', event.target.value)}
                    onBlur={() => handleBlur('mobileNumber')}
                    disabled={loading}
                    inputMode="tel"
                    autoComplete="off"
                  />
                </div>
                {renderFieldError('mobileNumber')}
              </div>

              <div className={`user-create-modal__field user-create-modal__full`}>
                {renderLabel(
                  isIndividual
                    ? t('users.management.createModal.emailOptional')
                    : t('users.management.createModal.email'),
                  !isIndividual,
                )}
                <input
                  className={[
                    'user-create-modal__control',
                    touched.email && errors.email ? 'user-create-modal__control--error' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  type="email"
                  value={form.email}
                  onChange={(event) => setField('email', event.target.value)}
                  onBlur={() => handleBlur('email')}
                  disabled={loading}
                  autoComplete="off"
                />
                {renderFieldError('email')}
              </div>

              {isIndividual ? (
                <div className="user-create-modal__field user-create-modal__full">
                  {renderLabel(t('users.management.createModal.nationalIdNumber'), true)}
                  <input
                    className={[
                      'user-create-modal__control',
                      touched.nationalIdNumber && errors.nationalIdNumber
                        ? 'user-create-modal__control--error'
                        : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    value={form.nationalIdNumber}
                    onChange={(event) => setField('nationalIdNumber', event.target.value)}
                    onBlur={() => handleBlur('nationalIdNumber')}
                    disabled={loading}
                    autoComplete="off"
                  />
                  {renderFieldError('nationalIdNumber')}
                </div>
              ) : (
                <div className="user-create-modal__field user-create-modal__full">
                  {renderLabel(t('users.management.createModal.tinNumber'), true)}
                  <input
                    className={[
                      'user-create-modal__control',
                      touched.tinNumber && errors.tinNumber ? 'user-create-modal__control--error' : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    value={form.tinNumber}
                    onChange={(event) => setField('tinNumber', event.target.value)}
                    onBlur={() => handleBlur('tinNumber')}
                    disabled={loading}
                    autoComplete="off"
                  />
                  {renderFieldError('tinNumber')}
                </div>
              )}
            </div>

            <hr className="user-create-modal__divider" />

            <h3 className="user-create-modal__section-title">
              {t('users.management.createModal.security')}
            </h3>

            <div className="user-create-modal__grid">
              <div className="user-create-modal__field">
                {renderLabel(t('users.management.createModal.temporaryPassword'), true)}
                <div className="user-create-modal__password-wrap">
                  <input
                    className={[
                      'user-create-modal__control',
                      touched.password && errors.password ? 'user-create-modal__control--error' : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    type={showPassword ? 'text' : 'password'}
                    value={form.password}
                    onChange={(event) => setField('password', event.target.value)}
                    onBlur={() => handleBlur('password')}
                    disabled={loading}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className="user-create-modal__password-toggle"
                    onClick={() => setShowPassword((current) => !current)}
                    disabled={loading}
                    aria-label={
                      showPassword
                        ? t('users.management.createModal.hidePassword')
                        : t('users.management.createModal.showPassword')
                    }
                  >
                    <EyeIcon open={showPassword} />
                  </button>
                </div>
                {renderFieldError('password')}
              </div>

              <div className="user-create-modal__field">
                {renderLabel(t('users.management.createModal.confirmPassword'), true)}
                <div className="user-create-modal__password-wrap">
                  <input
                    className={[
                      'user-create-modal__control',
                      touched.confirmPassword && errors.confirmPassword
                        ? 'user-create-modal__control--error'
                        : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={form.confirmPassword}
                    onChange={(event) => setField('confirmPassword', event.target.value)}
                    onBlur={() => handleBlur('confirmPassword')}
                    disabled={loading}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className="user-create-modal__password-toggle"
                    onClick={() => setShowConfirmPassword((current) => !current)}
                    disabled={loading}
                    aria-label={
                      showConfirmPassword
                        ? t('users.management.createModal.hidePassword')
                        : t('users.management.createModal.showPassword')
                    }
                  >
                    <EyeIcon open={showConfirmPassword} />
                  </button>
                </div>
                {renderFieldError('confirmPassword')}
              </div>
            </div>

            <p className="user-create-modal__hint">{t('users.management.createModal.passwordHint')}</p>
          </div>

          {submitError && (
            <p className="kyc-modal__error user-create-modal__submit-error" role="alert">
              {submitError}
            </p>
          )}

          <div className="user-create-modal__footer">
            <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>
              {t('users.management.createModal.cancel')}
            </Button>
            <div className="user-create-modal__footer-actions">
              <Button type="submit" variant="primary" disabled={loading || roleLoading || !bidderRoleId}>
                <span className="auction-confirm-modal__btn-content">
                  {loading && <span className="auction-confirm-modal__spinner" aria-hidden="true" />}
                  {loading
                    ? t('users.management.createModal.creating')
                    : t('users.management.createModal.submit')}
                </span>
              </Button>
            </div>
          </div>
        </form>
      </div>
    </>
  );
}

export default UserCreateModal;
