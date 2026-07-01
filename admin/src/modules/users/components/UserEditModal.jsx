import { Button, Input } from '@enderass/shared/ui';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { userService } from '@enderass/shared/services';
/**
 * @param {{
 *   open: boolean,
 *   user: object|null,
 *   loading?: boolean,
 *   onClose: () => void,
 *   onSubmit: (userId: string, payload: object) => Promise<void>,
 * }} props
 */
export function UserEditModal({ open, user, loading = false, onClose, onSubmit }) {
  const { t } = useTranslation();
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    organizationName: '',
    email: '',
    preferredLanguage: 'en',
    roleId: '',
  });
  const [roles, setRoles] = useState([]);
  const [rolesLoading, setRolesLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const isOrganization = user?.userType === 'organization';

  useEffect(() => {
    if (!open || !user) {
      setSubmitError('');
      return;
    }

    if (!user.id) {
      console.error('UserEditModal: user.id is undefined', user);
      return;
    }

    setForm({
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      organizationName: user.organizationName || '',
      email: user.email || '',
      preferredLanguage: user.preferredLanguage || 'en',
      roleId: user.roleId || '',
    });

    let cancelled = false;

    const loadRoles = async () => {
      setRolesLoading(true);
      try {
        const nextRoles = await userService.listCreateRoles();
        if (!cancelled) {
          setRoles(nextRoles);
        }
      } catch {
        if (!cancelled) {
          setRoles([]);
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
  }, [open, user]);

  if (!open || !user) return null;

  if (!user.id) {
    console.error('UserEditModal: user.id is undefined', user);
    return null;
  }

  const setField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
    setSubmitError('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitError('');

    const payload = {
      email: form.email.trim() || null,
      preferredLanguage: form.preferredLanguage,
      roleId: form.roleId || undefined,
    };

    if (isOrganization) {
      payload.organizationName = form.organizationName.trim() || null;
    } else {
      payload.firstName = form.firstName.trim() || null;
      payload.lastName = form.lastName.trim() || null;
    }

    try {
      await onSubmit(user.id, payload);
      onClose();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : t('users.management.editModal.failed'));
    }
  };

  return (
    <div className="kyc-modal-overlay" role="presentation" onClick={onClose}>
      <form
        className="kyc-modal kyc-modal--wide"
        role="dialog"
        aria-modal="true"
        aria-labelledby="user-edit-modal-title"
        onClick={(event) => event.stopPropagation()}
        onSubmit={handleSubmit}
      >
        <h2 id="user-edit-modal-title" className="kyc-modal__title">
          {t('users.management.editModal.title')}
        </h2>
        <p className="kyc-modal__body">{t('users.management.editModal.subtitle')}</p>

        <div className="kyc-modal__form-grid">
          {isOrganization ? (
            <Input
              label={t('users.management.editModal.organizationName')}
              value={form.organizationName}
              onChange={(event) => setField('organizationName', event.target.value)}
              disabled={loading}
            />
          ) : (
            <>
              <Input
                label={t('users.management.editModal.firstName')}
                value={form.firstName}
                onChange={(event) => setField('firstName', event.target.value)}
                disabled={loading}
              />
              <Input
                label={t('users.management.editModal.lastName')}
                value={form.lastName}
                onChange={(event) => setField('lastName', event.target.value)}
                disabled={loading}
              />
            </>
          )}

          <Input
            label={t('users.management.editModal.email')}
            type="email"
            value={form.email}
            onChange={(event) => setField('email', event.target.value)}
            disabled={loading}
          />

          <label className="input-field">
            <span className="input-field__label">{t('users.management.editModal.language')}</span>
            <select
              className="input-field__control"
              value={form.preferredLanguage}
              onChange={(event) => setField('preferredLanguage', event.target.value)}
              disabled={loading}
            >
              <option value="en">{t('common.languages.english')}</option>
              <option value="am">{t('common.languages.amharic')}</option>
            </select>
          </label>

          <label className="input-field">
            <span className="input-field__label">{t('users.management.editModal.role')}</span>
            <select
              className="input-field__control"
              value={form.roleId}
              onChange={(event) => setField('roleId', event.target.value)}
              disabled={loading || rolesLoading}
            >
              <option value="">{t('users.management.editModal.selectRole')}</option>
              {roles.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.name || role.code}
                </option>
              ))}
            </select>
            {!rolesLoading && roles.length === 0 && (
              <span className="input-field__error" role="alert">
                {t('users.management.editModal.rolesUnavailable')}
              </span>
            )}
          </label>
        </div>

        <p className="kyc-modal__hint">{t('users.management.editModal.roleChangeNotice')}</p>

        {submitError && (
          <p className="kyc-modal__error" role="alert">
            {submitError}
          </p>
        )}

        <div className="kyc-modal__actions">
          <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>
            {t('users.management.editModal.cancel')}
          </Button>
          <Button type="submit" variant="primary" disabled={loading || roles.length === 0}>
            {loading ? t('users.management.editModal.saving') : t('users.management.editModal.submit')}
          </Button>
        </div>
      </form>
    </div>
  );
}

export default UserEditModal;
