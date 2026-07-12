import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@enderass/shared/ui';
import { formatMobileNumber, isValidEthiopianMobile } from '@enderass/shared/utils';

const EMPTY_FORM = {
  organizationName: '',
  tinNumber: '',
  mobileNumber: '',
  email: '',
  firstName: '',
  lastName: '',
  password: '',
  confirmPassword: '',
};

const FORM_STYLES = `
.org-create-modal {
  width: min(600px, 100%);
  max-height: min(92vh, 900px);
  display: flex;
  flex-direction: column;
  padding: 0;
  overflow: hidden;
  border-radius: var(--semantic-radius-default);
  box-shadow: var(--core-shadow-overlay);
}
.org-create-modal__scroll {
  flex: 1;
  overflow-y: auto;
  padding: var(--core-space-5);
}
.org-create-modal__divider {
  border: none;
  border-top: 1px solid var(--dashboard-border);
  margin: var(--core-space-5) 0;
}
.org-create-modal__section-title {
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
.org-create-modal__grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--core-space-4);
}
.org-create-modal__full {
  grid-column: 1 / -1;
}
.org-create-modal__field {
  display: flex;
  flex-direction: column;
  gap: var(--component-input-label-gap);
}
.org-create-modal__label {
  font-family: var(--component-input-label-font-family);
  font-size: var(--component-input-label-font-size);
  font-weight: var(--component-input-label-font-weight);
  letter-spacing: var(--component-input-label-letter-spacing);
  color: var(--component-input-label-color);
}
.org-create-modal__required {
  color: var(--semantic-color-error);
}
.org-create-modal__control {
  width: 100%;
  min-height: var(--component-input-height);
  padding: 0 var(--component-input-padding-x);
  border: 1px solid var(--component-input-border);
  background: var(--component-input-bg);
  color: var(--component-input-text);
  font-family: var(--component-input-font-family);
  font-size: var(--component-input-font-size);
  border-radius: var(--component-input-radius);
  transition: var(--core-transition-border), var(--core-transition-shadow);
}
.org-create-modal__control:focus {
  outline: none;
  border-color: var(--component-input-border-focus);
  box-shadow: var(--component-input-focus-ring);
}
.org-create-modal__control--error {
  border-color: var(--component-input-border-error);
}
.org-create-modal__control--error:focus {
  box-shadow: var(--component-input-error-focus-ring);
}
.org-create-modal__control:disabled {
  opacity: var(--core-opacity-disabled);
  cursor: not-allowed;
}
.org-create-modal__mobile-input {
  display: flex;
  align-items: stretch;
  border: 1px solid var(--component-input-border);
  background: var(--component-input-bg);
  border-radius: var(--component-input-radius);
  transition: var(--core-transition-border);
}
.org-create-modal__mobile-input:focus-within {
  border-color: var(--component-input-border-focus);
  box-shadow: var(--component-input-focus-ring);
}
.org-create-modal__mobile-input--error {
  border-color: var(--component-input-border-error);
}
.org-create-modal__mobile-input--error:focus-within {
  box-shadow: var(--component-input-error-focus-ring);
}
.org-create-modal__mobile-prefix {
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
.org-create-modal__mobile-input .org-create-modal__control {
  border: none;
  min-height: calc(var(--component-input-height) - 2px);
}
.org-create-modal__mobile-input .org-create-modal__control:focus {
  box-shadow: none;
}
.org-create-modal__password-wrap {
  position: relative;
}
.org-create-modal__password-wrap .org-create-modal__control {
  padding-right: var(--core-space-7);
}
.org-create-modal__password-toggle {
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
  transition: var(--core-transition-default);
}
.org-create-modal__password-toggle:hover {
  color: var(--dashboard-text-primary);
}
.org-create-modal__password-toggle:disabled {
  opacity: var(--core-opacity-disabled);
  cursor: not-allowed;
}
.org-create-modal__strength {
  display: flex;
  flex-direction: column;
  gap: var(--core-space-1);
  margin-top: var(--core-space-2);
}
.org-create-modal__strength-track {
  height: 4px;
  background: var(--dashboard-border);
  border-radius: var(--semantic-radius-default);
  overflow: hidden;
}
.org-create-modal__strength-bar {
  height: 100%;
  border-radius: var(--semantic-radius-default);
  transition: width var(--core-transition-default), background var(--core-transition-default);
}
.org-create-modal__strength-bar--weak { width: 25%; background: var(--semantic-color-error); }
.org-create-modal__strength-bar--fair { width: 50%; background: var(--semantic-color-warning); }
.org-create-modal__strength-bar--good { width: 75%; background: var(--semantic-color-brand-primary); }
.org-create-modal__strength-bar--strong { width: 100%; background: var(--semantic-color-status-success); }
.org-create-modal__strength-label {
  margin: 0;
  font-family: var(--semantic-font-body);
  font-size: 12px;
  color: var(--dashboard-text-subtle);
}
.org-create-modal__hint {
  margin: var(--core-space-2) 0 0;
  font-family: var(--semantic-font-body);
  font-size: 12px;
  color: var(--dashboard-text-subtle);
  line-height: var(--core-line-height-normal);
}
.org-create-modal__error {
  margin: 0;
  font-family: var(--component-input-error-font-family);
  font-size: var(--component-input-error-font-size);
  color: var(--component-input-error-color);
}
.org-create-modal__submit-error {
  margin: 0 var(--core-space-5) var(--core-space-3);
}
.org-create-modal__footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: var(--core-space-3);
  padding: var(--core-space-4) var(--core-space-5);
  border-top: 1px solid var(--dashboard-border);
  background: var(--dashboard-surface-bg);
}
.org-create-modal__org-badge {
  display: inline-flex;
  align-items: center;
  gap: var(--core-space-2);
  padding: var(--core-space-1) var(--core-space-3);
  background: rgba(6, 67, 106, 0.08);
  color: var(--semantic-color-brand-primary);
  border-radius: var(--semantic-radius-default);
  font-size: 12px;
  font-weight: var(--core-font-weight-semibold);
  font-family: var(--semantic-font-ui);
  letter-spacing: var(--core-letter-spacing-caption);
}
@media (max-width: 560px) {
  .org-create-modal__grid { grid-template-columns: 1fr; }
}
`;

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function getPasswordStrength(password) {
  if (!password) return { level: 0, key: 'none' };
  let score = 0;
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^a-zA-Z0-9]/.test(password)) score += 1;
  if (score <= 1) return { level: 1, key: 'weak' };
  if (score <= 2) return { level: 2, key: 'fair' };
  if (score <= 3) return { level: 3, key: 'good' };
  return { level: 4, key: 'strong' };
}

function EyeIcon({ open }) {
  if (open) {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M3 12s3.5-6 9-6 9 6 9 6-3.5 6-9 6-9-6-9-6z" stroke="currentColor" strokeWidth="1.8" />
        <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
      </svg>
    );
  }
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M3 3l18 18M10.6 10.6A3 3 0 0012 15a3 3 0 002.4-4.4M6.2 6.2C4.2 7.6 2.7 9.5 2 12c0 0 3.5 6 10 6 1.8 0 3.4-.5 4.8-1.2M9.9 5.1A10.7 10.7 0 0112 5c6.5 0 10 6 10 6a17.8 17.8 0 01-4.1 4.8" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

function BuildingIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="4" y="3" width="16" height="18" stroke="currentColor" strokeWidth="1.8" />
      <path d="M8 7h8M8 11h6M8 15h4M8 19h2" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

export function OrganizationCreateModal({ open, loading, onClose, onSubmit }) {
  const { t } = useTranslation();
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    if (!open) {
      setForm(EMPTY_FORM);
      setErrors({});
      setTouched({});
      setSubmitError('');
      setShowPassword(false);
      setShowConfirmPassword(false);
    }
  }, [open]);

  const passwordStrength = getPasswordStrength(form.password);

  function setField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (touched[field]) {
      const err = validateField(field, { ...form, [field]: value });
      setErrors((prev) => {
        const next = { ...prev };
        if (err) next[field] = err;
        else delete next[field];
        return next;
      });
    }
    setSubmitError('');
  }

  function validateField(field, values = form) {
    switch (field) {
      case 'organizationName':
        return !values.organizationName.trim()
          ? t('organizations.management.createModal.validation.orgNameRequired') : '';
      case 'mobileNumber':
        if (!values.mobileNumber.trim()) return t('organizations.management.createModal.validation.mobileRequired');
        if (!isValidEthiopianMobile(values.mobileNumber)) return t('organizations.management.createModal.validation.mobileInvalid');
        return '';
      case 'email':
        if (values.email.trim() && !isValidEmail(values.email.trim())) return t('organizations.management.createModal.validation.invalidEmail');
        return '';
      case 'password':
        if (!values.password) return t('organizations.management.createModal.validation.passwordRequired');
        if (values.password.length < 6) return t('organizations.management.createModal.validation.passwordMinLength');
        return '';
      case 'confirmPassword':
        if (!values.confirmPassword) return t('organizations.management.createModal.validation.confirmPasswordRequired');
        if (values.confirmPassword !== values.password) return t('organizations.management.createModal.validation.passwordMismatch');
        return '';
      default:
        return '';
    }
  }

  function handleBlur(field) {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const err = validateField(field);
    setErrors((prev) => {
      const next = { ...prev };
      if (err) next[field] = err;
      else delete next[field];
      return next;
    });
  }

  function validateAll() {
    const fields = ['organizationName', 'mobileNumber', 'email', 'password', 'confirmPassword'];
    const nextErrors = {};
    fields.forEach((f) => {
      const msg = validateField(f);
      if (msg) nextErrors[f] = msg;
    });
    setErrors(nextErrors);
    setTouched(Object.fromEntries(fields.map((f) => [f, true])));
    return Object.keys(nextErrors).length === 0;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!validateAll()) return;
    setSubmitError('');

    try {
      await onSubmit({
        organizationName: form.organizationName.trim(),
        tinNumber: form.tinNumber.trim() || undefined,
        mobileNumber: formatMobileNumber(form.mobileNumber.trim()),
        email: form.email.trim() || undefined,
        firstName: form.firstName.trim() || undefined,
        lastName: form.lastName.trim() || undefined,
        password: form.password,
      });
      onClose();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : t('organizations.management.createModal.failed'));
    }
  }

  function renderError(field) {
    return touched[field] && errors[field] ? (
      <p className="org-create-modal__error" role="alert">{errors[field]}</p>
    ) : null;
  }

  function renderLabel(text, required = false) {
    return (
      <span className="org-create-modal__label">
        {text}
        {required && <span className="org-create-modal__required" aria-hidden="true"> *</span>}
      </span>
    );
  }

  if (!open) return null;

  return (
    <>
      <style>{FORM_STYLES}</style>
      <div className="kyc-modal-overlay" role="presentation" onClick={loading ? undefined : onClose}>
        <form
          className="kyc-modal org-create-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="org-create-modal-title"
          onClick={(event) => event.stopPropagation()}
          onSubmit={handleSubmit}
        >
          <div className="auction-create-modal__header">
            <div>
              <div className="org-create-modal__org-badge">
                <BuildingIcon />
                <span>{t('organizations.management.createModal.badge')}</span>
              </div>
              <h2 id="org-create-modal-title" className="kyc-modal__title">
                {t('organizations.management.createModal.title')}
              </h2>
              <p className="kyc-modal__body">
                {t('organizations.management.createModal.subtitle')}
              </p>
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

          <div className="org-create-modal__scroll">
            <h3 className="org-create-modal__section-title">
              {t('organizations.management.createModal.sectionOrgInfo')}
            </h3>

            <div className="org-create-modal__grid">
              <div className="org-create-modal__full org-create-modal__field">
                {renderLabel(t('organizations.management.createModal.orgName'), true)}
                <input
                  className={[
                    'org-create-modal__control',
                    touched.organizationName && errors.organizationName ? 'org-create-modal__control--error' : '',
                  ].filter(Boolean).join(' ')}
                  type="text"
                  value={form.organizationName}
                  onChange={(event) => setField('organizationName', event.target.value)}
                  onBlur={() => handleBlur('organizationName')}
                  disabled={loading}
                  autoComplete="off"
                />
                {renderError('organizationName')}
              </div>

              <div className="org-create-modal__field">
                {renderLabel(t('organizations.management.createModal.tinNumber'))}
                <input
                  className="org-create-modal__control"
                  type="text"
                  value={form.tinNumber}
                  onChange={(event) => setField('tinNumber', event.target.value)}
                  disabled={loading}
                  autoComplete="off"
                />
              </div>

              <div className="org-create-modal__field">
                {renderLabel(t('organizations.management.createModal.email'))}
                <input
                  className={[
                    'org-create-modal__control',
                    touched.email && errors.email ? 'org-create-modal__control--error' : '',
                  ].filter(Boolean).join(' ')}
                  type="email"
                  value={form.email}
                  onChange={(event) => setField('email', event.target.value)}
                  onBlur={() => handleBlur('email')}
                  disabled={loading}
                  autoComplete="off"
                />
                {renderError('email')}
              </div>
            </div>

            <hr className="org-create-modal__divider" />

            <h3 className="org-create-modal__section-title">
              {t('organizations.management.createModal.sectionContactInfo')}
            </h3>

            <div className="org-create-modal__grid">
              <div className="org-create-modal__full org-create-modal__field">
                {renderLabel(t('organizations.management.createModal.mobileNumber'), true)}
                <div
                  className={[
                    'org-create-modal__mobile-input',
                    touched.mobileNumber && errors.mobileNumber ? 'org-create-modal__mobile-input--error' : '',
                  ].filter(Boolean).join(' ')}
                >
                  <span className="org-create-modal__mobile-prefix">
                    {t('organizations.management.createModal.mobilePrefix')}
                  </span>
                  <input
                    className="org-create-modal__control"
                    type="text"
                    value={form.mobileNumber}
                    onChange={(event) => setField('mobileNumber', event.target.value)}
                    onBlur={() => handleBlur('mobileNumber')}
                    disabled={loading}
                    inputMode="tel"
                    autoComplete="off"
                  />
                </div>
                {renderError('mobileNumber')}
              </div>

              <div className="org-create-modal__field">
                {renderLabel(t('organizations.management.createModal.firstName'))}
                <input
                  className="org-create-modal__control"
                  type="text"
                  value={form.firstName}
                  onChange={(event) => setField('firstName', event.target.value)}
                  disabled={loading}
                  autoComplete="off"
                />
              </div>

              <div className="org-create-modal__field">
                {renderLabel(t('organizations.management.createModal.lastName'))}
                <input
                  className="org-create-modal__control"
                  type="text"
                  value={form.lastName}
                  onChange={(event) => setField('lastName', event.target.value)}
                  disabled={loading}
                  autoComplete="off"
                />
              </div>
            </div>

            <hr className="org-create-modal__divider" />

            <h3 className="org-create-modal__section-title">
              {t('organizations.management.createModal.sectionSecurity')}
            </h3>

            <div className="org-create-modal__grid">
              <div className="org-create-modal__field">
                {renderLabel(t('organizations.management.createModal.password'), true)}
                <div className="org-create-modal__password-wrap">
                  <input
                    className={[
                      'org-create-modal__control',
                      touched.password && errors.password ? 'org-create-modal__control--error' : '',
                    ].filter(Boolean).join(' ')}
                    type={showPassword ? 'text' : 'password'}
                    value={form.password}
                    onChange={(event) => setField('password', event.target.value)}
                    onBlur={() => handleBlur('password')}
                    disabled={loading}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className="org-create-modal__password-toggle"
                    onClick={() => setShowPassword((prev) => !prev)}
                    disabled={loading}
                    aria-label={showPassword ? t('common.hidePassword') : t('common.showPassword')}
                  >
                    <EyeIcon open={showPassword} />
                  </button>
                </div>
                {renderError('password')}
                {form.password && (
                  <div className="org-create-modal__strength" aria-live="polite">
                    <div className="org-create-modal__strength-track">
                      <div
                        className={[
                          'org-create-modal__strength-bar',
                          passwordStrength.key !== 'none' ? `org-create-modal__strength-bar--${passwordStrength.key}` : '',
                        ].filter(Boolean).join(' ')}
                      />
                    </div>
                    <p className="org-create-modal__strength-label">
                      {t(`organizations.management.createModal.passwordStrength.${passwordStrength.key}`)}
                    </p>
                  </div>
                )}
              </div>

              <div className="org-create-modal__field">
                {renderLabel(t('organizations.management.createModal.confirmPassword'), true)}
                <div className="org-create-modal__password-wrap">
                  <input
                    className={[
                      'org-create-modal__control',
                      touched.confirmPassword && errors.confirmPassword ? 'org-create-modal__control--error' : '',
                    ].filter(Boolean).join(' ')}
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={form.confirmPassword}
                    onChange={(event) => setField('confirmPassword', event.target.value)}
                    onBlur={() => handleBlur('confirmPassword')}
                    disabled={loading}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className="org-create-modal__password-toggle"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                    disabled={loading}
                    aria-label={showConfirmPassword ? t('common.hidePassword') : t('common.showPassword')}
                  >
                    <EyeIcon open={showConfirmPassword} />
                  </button>
                </div>
                {renderError('confirmPassword')}
              </div>
            </div>

            <p className="org-create-modal__hint">
              {t('organizations.management.createModal.passwordHint')}
            </p>
          </div>

          {submitError && (
            <p className="kyc-modal__error org-create-modal__submit-error" role="alert">
              {submitError}
            </p>
          )}

          <div className="org-create-modal__footer">
            <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>
              {t('organizations.management.createModal.cancel')}
            </Button>
            <Button type="submit" variant="primary" loading={loading}>
              {t('organizations.management.createModal.submit')}
            </Button>
          </div>
        </form>
      </div>
    </>
  );
}

export default OrganizationCreateModal;
