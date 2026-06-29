import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../../../components/Button.jsx';
import { staffService } from '../services/staff-service.js';
import {
  buildRoleAccessPreview,
  getStaffRoleDescription,
  getStaffRoleLabel,
} from '../utils/staff-management-utils.js';
import { formatMobileNumber, isValidEthiopianMobile } from '../../../utils/mobile-utils.js';

const EMPTY_FORM = {
  firstName: '',
  lastName: '',
  mobileNumber: '',
  email: '',
  roleId: '',
  password: '',
  confirmPassword: '',
};

const STAFF_FORM_STYLES = `
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

.user-create-modal__strength {
  display: flex;
  flex-direction: column;
  gap: var(--core-space-1);
  margin-top: var(--core-space-2);
}

.user-create-modal__strength-track {
  height: 4px;
  background: var(--dashboard-border);
  border-radius: var(--semantic-radius-default);
  overflow: hidden;
}

.user-create-modal__strength-bar {
  height: 100%;
  border-radius: var(--semantic-radius-default);
  transition: width var(--core-transition-default), background var(--core-transition-default);
}

.user-create-modal__strength-bar--weak {
  width: 25%;
  background: var(--semantic-color-error);
}

.user-create-modal__strength-bar--fair {
  width: 50%;
  background: var(--semantic-color-warning);
}

.user-create-modal__strength-bar--good {
  width: 75%;
  background: var(--semantic-color-brand-primary);
}

.user-create-modal__strength-bar--strong {
  width: 100%;
  background: var(--semantic-color-status-success);
}

.user-create-modal__strength-label {
  margin: 0;
  font-family: var(--semantic-font-body);
  font-size: 12px;
  color: var(--dashboard-text-subtle);
}

.user-create-modal__hint {
  margin: var(--core-space-2) 0 0;
  font-family: var(--semantic-font-body);
  font-size: 12px;
  color: var(--dashboard-text-subtle);
  line-height: var(--core-line-height-normal);
}

.user-create-modal__access-preview {
  display: flex;
  flex-wrap: wrap;
  gap: var(--core-space-2);
  margin-top: var(--core-space-3);
}

.user-create-modal__access-pill {
  display: inline-flex;
  align-items: center;
  gap: var(--core-space-2);
  padding: var(--core-space-2) var(--core-space-3);
  border: 1px solid var(--dashboard-border);
  color: var(--dashboard-text-primary);
  background: var(--dashboard-surface-bg);
  font-size: 12px;
}

.user-create-modal__access-pill--granted {
  border-color: var(--semantic-color-status-success);
  color: var(--semantic-color-status-success);
}

.user-create-modal__access-pill--denied {
  color: var(--dashboard-text-subtle);
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
  .user-create-modal__grid {
    grid-template-columns: 1fr;
  }
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
export function StaffCreateModal({ open, loading = false, onClose, onSubmit }) {
  const { t } = useTranslation();
  const [form, setForm] = useState(EMPTY_FORM);
  const [roles, setRoles] = useState([]);
  const [rolesLoading, setRolesLoading] = useState(false);
  const [rolesLoadError, setRolesLoadError] = useState('');
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    if (!open) {
      setForm(EMPTY_FORM);
      setRoles([]);
      setRolesLoadError('');
      setErrors({});
      setTouched({});
      setSubmitError('');
      setShowPassword(false);
      setShowConfirmPassword(false);
      return;
    }

    let cancelled = false;

    const loadRoles = async () => {
      setRolesLoading(true);
      setRolesLoadError('');

      try {
        const response = await staffService.getAssignableRoles();
        const nextRoles = response?.roles ?? [];
        if (!cancelled) {
          setRoles(nextRoles);
          if (nextRoles.length === 0) {
            setRolesLoadError(t('staff.management.createModal.rolesUnavailable'));
          }
        }
      } catch {
        if (!cancelled) {
          setRoles([]);
          setRolesLoadError(t('staff.management.createModal.rolesLoadFailed'));
        }
      } finally {
        if (!cancelled) {
          setRolesLoading(false);
        }
      }
    };

    loadRoles();

    return () => {
      cancelled = true;
    };
  }, [open, t]);

  if (!open) return null;

  const passwordStrength = getPasswordStrength(form.password);
  const selectedRole = roles.find((role) => role.id === form.roleId);
  const rolePreview = buildRoleAccessPreview(t, selectedRole);

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
        if (!values.firstName.trim()) {
          return t('staff.management.createModal.firstNameRequired');
        }
        return '';
      case 'lastName':
        if (!values.lastName.trim()) {
          return t('staff.management.createModal.lastNameRequired');
        }
        return '';
      case 'mobileNumber':
        if (!values.mobileNumber.trim()) {
          return t('staff.management.createModal.mobileRequired');
        }
        if (!isValidEthiopianMobile(values.mobileNumber)) {
          return t('staff.management.createModal.mobileInvalid');
        }
        return '';
      case 'email':
        if (!values.email.trim()) {
          return t('staff.management.createModal.emailRequired');
        }
        if (!isValidEmail(values.email.trim())) {
          return t('staff.management.createModal.emailInvalid');
        }
        return '';
      case 'password':
        if (!values.password.trim()) {
          return t('staff.management.createModal.passwordRequired');
        }
        if (values.password.length < 8) {
          return t('staff.management.createModal.passwordMinLength');
        }
        return '';
      case 'confirmPassword':
        if (!values.confirmPassword.trim()) {
          return t('staff.management.createModal.confirmPasswordRequired');
        }
        if (values.confirmPassword !== values.password) {
          return t('staff.management.createModal.passwordMismatch');
        }
        return '';
      case 'roleId':
        if (!values.roleId) {
          return t('staff.management.createModal.roleRequired');
        }
        return '';
      default:
        return '';
    }
  };

  const validateAll = () => {
    const fields = [
      'firstName',
      'lastName',
      'mobileNumber',
      'email',
      'password',
      'confirmPassword',
      'roleId',
    ];

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

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (roles.length === 0) {
      setSubmitError(rolesLoadError || t('staff.management.createModal.rolesUnavailable'));
      return;
    }

    if (!validateAll()) return;

    setSubmitError('');

    try {
      await onSubmit({
        mobileNumber: formatMobileNumber(form.mobileNumber.trim()),
        password: form.password,
        roleId: form.roleId,
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
      });
      onClose();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : t('staff.management.createModal.failed'));
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
      <style>{STAFF_FORM_STYLES}</style>
      <div className="kyc-modal-overlay" role="presentation" onClick={loading ? undefined : onClose}>
        <form
          className="kyc-modal user-create-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="staff-create-modal-title"
          onClick={(event) => event.stopPropagation()}
          onSubmit={handleSubmit}
        >
          <div className="auction-create-modal__header">
            <div>
              <h2 id="staff-create-modal-title" className="kyc-modal__title">
                {t('staff.management.createModal.title')}
              </h2>
              <p className="kyc-modal__body">{t('staff.management.createModal.subtitle')}</p>
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
            <h3 className="user-create-modal__section-title">
              {t('staff.management.createModal.staffInformation')}
            </h3>

            <div className="user-create-modal__grid">
              <div className="user-create-modal__field">
                {renderLabel(t('staff.management.createModal.firstName'), true)}
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
                {renderLabel(t('staff.management.createModal.lastName'), true)}
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

              <div className="user-create-modal__field user-create-modal__full">
                {renderLabel(t('staff.management.createModal.mobile'), true)}
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
                    {t('staff.management.createModal.mobilePrefix')}
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

              <div className="user-create-modal__field user-create-modal__full">
                {renderLabel(t('staff.management.createModal.email'), true)}
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
            </div>

            <hr className="user-create-modal__divider" />

            <h3 className="user-create-modal__section-title">
              {t('staff.management.createModal.roleAssignment')}
            </h3>

            <div className="user-create-modal__field user-create-modal__full">
              {renderLabel(t('staff.management.createModal.role'), true)}
              <select
                className={[
                  'user-create-modal__control',
                  touched.roleId && errors.roleId ? 'user-create-modal__control--error' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                value={form.roleId}
                onChange={(event) => setField('roleId', event.target.value)}
                onBlur={() => handleBlur('roleId')}
                disabled={loading || rolesLoading}
              >
                <option value="">{t('staff.management.createModal.selectRole')}</option>
                {roles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {getStaffRoleLabel(t, role.code)} — {getStaffRoleDescription(t, role.code)}
                  </option>
                ))}
              </select>
              {renderFieldError('roleId')}
              {rolesLoadError && (
                <p className="user-create-modal__error" role="alert">
                  {rolesLoadError}
                </p>
              )}
              {selectedRole && (
                <>
                  <p className="user-create-modal__hint">
                    {t('staff.management.createModal.rolePreviewIntro', {
                      role: getStaffRoleLabel(t, selectedRole.code),
                    })}
                  </p>
                  <div className="user-create-modal__access-preview">
                    {rolePreview.map((item) => (
                      <span
                        key={item.module}
                        className={[
                          'user-create-modal__access-pill',
                          item.granted
                            ? 'user-create-modal__access-pill--granted'
                            : 'user-create-modal__access-pill--denied',
                        ]
                          .filter(Boolean)
                          .join(' ')}
                      >
                        <span aria-hidden="true">{item.granted ? '✓' : '✕'}</span>
                        <span>
                          {item.label} ({item.summary})
                        </span>
                      </span>
                    ))}
                  </div>
                </>
              )}
            </div>

            <hr className="user-create-modal__divider" />

            <h3 className="user-create-modal__section-title">
              {t('staff.management.createModal.security')}
            </h3>

            <div className="user-create-modal__grid">
              <div className="user-create-modal__field">
                {renderLabel(t('staff.management.createModal.password'), true)}
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
                        ? t('staff.management.createModal.hidePassword')
                        : t('staff.management.createModal.showPassword')
                    }
                  >
                    <EyeIcon open={showPassword} />
                  </button>
                </div>
                {renderFieldError('password')}
                {form.password && (
                  <div className="user-create-modal__strength" aria-live="polite">
                    <div className="user-create-modal__strength-track">
                      <div
                        className={[
                          'user-create-modal__strength-bar',
                          passwordStrength.key !== 'none'
                            ? `user-create-modal__strength-bar--${passwordStrength.key}`
                            : '',
                        ]
                          .filter(Boolean)
                          .join(' ')}
                      />
                    </div>
                    <p className="user-create-modal__strength-label">
                      {t(`staff.management.createModal.passwordStrength.${passwordStrength.key}`)}
                    </p>
                  </div>
                )}
              </div>

              <div className="user-create-modal__field">
                {renderLabel(t('staff.management.createModal.confirmPassword'), true)}
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
                        ? t('staff.management.createModal.hidePassword')
                        : t('staff.management.createModal.showPassword')
                    }
                  >
                    <EyeIcon open={showConfirmPassword} />
                  </button>
                </div>
                {renderFieldError('confirmPassword')}
              </div>
            </div>

            <p className="user-create-modal__hint">{t('staff.management.createModal.passwordHint')}</p>
          </div>

          {submitError && (
            <p className="kyc-modal__error user-create-modal__submit-error" role="alert">
              {submitError}
            </p>
          )}

          <div className="user-create-modal__footer">
            <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>
              {t('staff.management.createModal.cancel')}
            </Button>
            <div className="user-create-modal__footer-actions">
              <Button
                type="submit"
                variant="primary"
                disabled={loading || rolesLoading || roles.length === 0}
              >
                <span className="auction-confirm-modal__btn-content">
                  {loading && <span className="auction-confirm-modal__spinner" aria-hidden="true" />}
                  {loading
                    ? t('staff.management.createModal.creating')
                    : t('staff.management.createModal.submit')}
                </span>
              </Button>
            </div>
          </div>
        </form>
      </div>
    </>
  );
}

export default StaffCreateModal;
