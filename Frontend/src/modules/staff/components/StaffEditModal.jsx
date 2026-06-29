import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../../../components/Button.jsx';
import { staffService } from '../services/staff-service.js';
import { getStaffRoleDescription, getStaffRoleLabel } from '../utils/staff-management-utils.js';

const STAFF_EDIT_MODAL_STYLES = `
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
  .user-create-modal__grid {
    grid-template-columns: 1fr;
  }
}
`;

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

/**
 * @param {{
 *   open: boolean,
 *   staff: object|null,
 *   loading?: boolean,
 *   onClose: () => void,
 *   onSubmit: (staffId: string, payload: object) => Promise<void>,
 * }} props
 */
export function StaffEditModal({ open, staff, loading = false, onClose, onSubmit }) {
  const { t } = useTranslation();
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    roleId: '',
  });
  const [roles, setRoles] = useState([]);
  const [rolesLoading, setRolesLoading] = useState(false);
  const [rolesLoadError, setRolesLoadError] = useState('');
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    if (!open || !staff) {
      setSubmitError('');
      setErrors({});
      setTouched({});
      return;
    }

    if (!staff.id) {
      console.error('StaffEditModal: staff.id is undefined', staff);
      return;
    }

    setForm({
      firstName: staff.user?.firstName || '',
      lastName: staff.user?.lastName || '',
      email: staff.user?.email || '',
      roleId: staff.roleId || '',
    });

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
            setRolesLoadError(t('staff.management.editModal.rolesUnavailable'));
          }
        }
      } catch {
        if (!cancelled) {
          setRoles([]);
          setRolesLoadError(t('staff.management.editModal.rolesUnavailable'));
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
  }, [open, staff, t]);

  if (!open || !staff?.id) return null;

  const selectedRole = roles.find((role) => role.id === form.roleId);

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
          return t('staff.management.editModal.firstNameRequired');
        }
        return '';
      case 'lastName':
        if (!values.lastName.trim()) {
          return t('staff.management.editModal.lastNameRequired');
        }
        return '';
      case 'email':
        if (!values.email.trim()) {
          return t('staff.management.editModal.emailRequired');
        }
        if (!isValidEmail(values.email.trim())) {
          return t('staff.management.editModal.emailInvalid');
        }
        return '';
      case 'roleId':
        if (!values.roleId) {
          return t('staff.management.editModal.roleRequired');
        }
        return '';
      default:
        return '';
    }
  };

  const validateAll = () => {
    const fields = ['firstName', 'lastName', 'email', 'roleId'];
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
      setSubmitError(rolesLoadError || t('staff.management.editModal.rolesUnavailable'));
      return;
    }

    if (!validateAll()) return;

    setSubmitError('');

    try {
      await onSubmit(staff.id, {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
        roleId: form.roleId,
      });
      onClose();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : t('staff.management.editModal.failed'));
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
      <style>{STAFF_EDIT_MODAL_STYLES}</style>
      <div className="kyc-modal-overlay" role="presentation" onClick={loading ? undefined : onClose}>
        <form
          className="kyc-modal user-create-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="staff-edit-modal-title"
          onClick={(event) => event.stopPropagation()}
          onSubmit={handleSubmit}
        >
          <div className="auction-create-modal__header">
            <div>
              <h2 id="staff-edit-modal-title" className="kyc-modal__title">
                {t('staff.management.editModal.title')}
              </h2>
              <p className="kyc-modal__body">{t('staff.management.editModal.subtitle')}</p>
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
              {t('staff.management.editModal.staffInformation')}
            </h3>

            <div className="user-create-modal__grid">
              <div className="user-create-modal__field">
                {renderLabel(t('staff.management.editModal.firstName'), true)}
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
                {renderLabel(t('staff.management.editModal.lastName'), true)}
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
                {renderLabel(t('staff.management.editModal.email'), true)}
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
              {t('staff.management.editModal.roleAssignment')}
            </h3>

            <div className="user-create-modal__field user-create-modal__full">
              {renderLabel(t('staff.management.editModal.role'), true)}
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
                <option value="">{t('staff.management.editModal.selectRole')}</option>
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
                <p className="user-create-modal__hint">
                  {getStaffRoleDescription(t, selectedRole.code)}
                </p>
              )}
            </div>

            <p className="user-create-modal__hint">{t('staff.management.editModal.roleChangeNotice')}</p>
          </div>

          {submitError && (
            <p className="kyc-modal__error user-create-modal__submit-error" role="alert">
              {submitError}
            </p>
          )}

          <div className="user-create-modal__footer">
            <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>
              {t('staff.management.editModal.cancel')}
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
                    ? t('staff.management.editModal.saving')
                    : t('staff.management.editModal.submit')}
                </span>
              </Button>
            </div>
          </div>
        </form>
      </div>
    </>
  );
}

export default StaffEditModal;
