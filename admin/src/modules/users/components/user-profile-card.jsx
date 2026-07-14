import { StatusPill } from '@enderass/shared/ui-admin';
import { useTranslation } from 'react-i18next';
import { useUserProfile } from '../hooks/use-user-profile.js';
import { formatDate } from '@enderass/shared/utils';
import { getUserStatusVariant } from '../utils/user-management-utils.js';
import { useState, useCallback, useRef, useEffect } from 'react';
import { userService } from '@enderass/shared/services/user-service.js';

const TABS = [
  { id: 'info', labelKey: 'users.profile.tabs.info' },
  { id: 'password', labelKey: 'users.profile.tabs.password' },
  { id: 'kyc', labelKey: 'users.profile.tabs.kyc' },
];

export function UserProfileCard() {
  const { t } = useTranslation();
  const locale = t('i18n.locale', 'en') === 'am' ? 'am' : 'en';
  const { profile, kyc, loading, error, updateProfile, changePassword } = useUserProfile();
  const [activeTab, setActiveTab] = useState('info');
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [saveError, setSaveError] = useState('');
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef(null);

  const identity = profile?.identity ?? {};
  const status = profile?.status;
  const avatarUrl = profile?.avatarUrl || avatarPreview;

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    preferredLanguage: 'en',
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    if (profile) {
      const displayName = identity.displayName || '';
      const parts = displayName.split(' ');
      setForm({
        firstName: parts[0] || '',
        lastName: parts.slice(1).join(' ') || '',
        email: identity.email || '',
        preferredLanguage: profile.preferredLanguage || 'en',
      });
    }
  }, [profile]);

  const initials = (identity.displayName || 'U')
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const handleAvatarClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleAvatarChange = useCallback(async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const previewUrl = URL.createObjectURL(file);
    setAvatarPreview(previewUrl);

    setUploadingAvatar(true);
    setSaveError('');
    setSaveMessage('');
    try {
      const result = await userService.updateAvatar(file);
      if (result?.avatarUrl) {
        setAvatarPreview(result.avatarUrl);
        setSaveMessage(t('users.profile.avatarUpdateSuccess'));
      }
    } catch (err) {
      setSaveError(err?.message || t('users.profile.avatarUpdateFailed'));
      setAvatarPreview(null);
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }, [t]);

  const handleSave = useCallback(async (e) => {
    e.preventDefault();
    setSaving(true);
    setSaveError('');
    setSaveMessage('');

    try {
      await updateProfile({
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        preferredLanguage: form.preferredLanguage,
      });
      setSaveMessage(t('users.profile.saveSuccess'));
    } catch (err) {
      setSaveError(err?.message || t('users.profile.saveFailed'));
    } finally {
      setSaving(false);
    }
  }, [form, updateProfile, t]);

  const handlePasswordChange = useCallback(async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError(t('users.profile.passwordMismatch'));
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setPasswordError(t('users.profile.passwordTooShort'));
      return;
    }

    setChangingPassword(true);
    try {
      await changePassword(passwordForm.currentPassword, passwordForm.newPassword);
      setPasswordSuccess(t('users.profile.passwordChangeSuccess'));
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setPasswordError(err?.message || t('users.profile.passwordChangeFailed'));
    } finally {
      setChangingPassword(false);
    }
  }, [passwordForm, changePassword, t]);

  if (loading) {
    return <div className="profile-card profile-card--loading"><div className="profile-card__spinner" /></div>;
  }

  if (error) {
    return (
      <div className="profile-card profile-card--error" role="alert">
        <p className="profile-card__error-text">{error}</p>
      </div>
    );
  }

  return (
    <div className="profile-card profile-card--centered">
      <div className="profile-card__hero">
        <div
          className={`profile-card__avatar profile-card__avatar--clickable ${uploadingAvatar ? 'profile-card__avatar--uploading' : ''}`}
          onClick={handleAvatarClick}
          title={t('users.profile.changeAvatar')}
        >
          {avatarUrl ? (
            <img src={avatarUrl} alt={identity.displayName} className="profile-card__avatar-img" />
          ) : (
            <span className="profile-card__avatar-text">{initials}</span>
          )}
          <div className="profile-card__avatar-overlay">
            <svg className="profile-card__avatar-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
              <circle cx="12" cy="13" r="4" />
            </svg>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleAvatarChange}
            className="profile-card__avatar-input"
            disabled={uploadingAvatar}
          />
        </div>
        <div className="profile-card__hero-info">
          <h2 className="profile-card__name">{identity.displayName || t('users.profile.title')}</h2>
          <p className="profile-card__role">{profile?.roleCode || '—'}</p>
          {status && (
            <StatusPill
              label={t(`users.management.status.${status}`, { defaultValue: status })}
              variant={getUserStatusVariant(status)}
            />
          )}
        </div>
      </div>

      <nav className="profile-card__tabs" role="tablist">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            className={`profile-card__tab${activeTab === tab.id ? ' profile-card__tab--active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {t(tab.labelKey)}
          </button>
        ))}
      </nav>

      <div className="profile-card__body">
        {activeTab === 'info' && (
          <div className="profile-card__tab-panel">
            {saveMessage && <div className="profile-card__toast profile-card__toast--success">{saveMessage}</div>}
            {saveError && <div className="profile-card__toast profile-card__toast--error">{saveError}</div>}

            <div className="profile-card__info-grid">
              <dl className="profile-card__meta">
                <div className="profile-card__meta-item">
                  <dt>{t('users.profile.mobile')}</dt>
                  <dd>{identity.mobileNumber || '—'}</dd>
                </div>
                <div className="profile-card__meta-item">
                  <dt>{t('users.profile.role')}</dt>
                  <dd>{profile?.roleCode || '—'}</dd>
                </div>
                <div className="profile-card__meta-item">
                  <dt>{t('users.profile.userType')}</dt>
                  <dd>{t(`users.management.userTypes.${profile?.userType || 'individual'}`)}</dd>
                </div>
              </dl>
            </div>

            <form className="profile-card__form" onSubmit={handleSave}>
              <div className="profile-card__form-row">
                <label className="profile-card__field">
                  <span className="profile-card__label">{t('users.profile.firstName')}</span>
                  <input
                    type="text"
                    className="profile-card__input"
                    value={form.firstName}
                    onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
                    disabled={saving}
                  />
                </label>
                <label className="profile-card__field">
                  <span className="profile-card__label">{t('users.profile.lastName')}</span>
                  <input
                    type="text"
                    className="profile-card__input"
                    value={form.lastName}
                    onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
                    disabled={saving}
                  />
                </label>
              </div>
              <label className="profile-card__field">
                <span className="profile-card__label">{t('users.profile.email')}</span>
                <input
                  type="email"
                  className="profile-card__input"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  disabled={saving}
                />
              </label>
              <label className="profile-card__field">
                <span className="profile-card__label">{t('users.profile.preferredLanguage')}</span>
                <select
                  className="profile-card__input"
                  value={form.preferredLanguage}
                  onChange={(e) => setForm((f) => ({ ...f, preferredLanguage: e.target.value }))}
                  disabled={saving}
                >
                  <option value="en">English</option>
                  <option value="am">አማርኛ</option>
                </select>
              </label>
              <div className="profile-card__form-actions">
                <button type="submit" className="profile-card__btn profile-card__btn--primary" disabled={saving}>
                  {saving ? t('common.saving') : t('common.save')}
                </button>
              </div>
            </form>
          </div>
        )}

        {activeTab === 'password' && (
          <div className="profile-card__tab-panel">
            <p className="profile-card__section-desc">{t('users.profile.passwordDesc')}</p>
            <form className="profile-card__form profile-card__form--narrow" onSubmit={handlePasswordChange}>
              <label className="profile-card__field">
                <span className="profile-card__label">{t('users.profile.currentPassword')}</span>
                <input
                  type="password"
                  className="profile-card__input"
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm((f) => ({ ...f, currentPassword: e.target.value }))}
                  required
                  disabled={changingPassword}
                />
              </label>
              <label className="profile-card__field">
                <span className="profile-card__label">{t('users.profile.newPassword')}</span>
                <input
                  type="password"
                  className="profile-card__input"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm((f) => ({ ...f, newPassword: e.target.value }))}
                  required
                  minLength={6}
                  disabled={changingPassword}
                />
              </label>
              <label className="profile-card__field">
                <span className="profile-card__label">{t('users.profile.confirmPassword')}</span>
                <input
                  type="password"
                  className="profile-card__input"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm((f) => ({ ...f, confirmPassword: e.target.value }))}
                  required
                  minLength={6}
                  disabled={changingPassword}
                />
              </label>
              {passwordError && <p className="profile-card__field-error">{passwordError}</p>}
              {passwordSuccess && <div className="profile-card__toast profile-card__toast--success">{passwordSuccess}</div>}
              <div className="profile-card__form-actions">
                <button type="submit" className="profile-card__btn profile-card__btn--primary" disabled={changingPassword}>
                  {changingPassword ? t('common.saving') : t('users.profile.changePassword')}
                </button>
              </div>
            </form>
          </div>
        )}

        {activeTab === 'kyc' && (
          <div className="profile-card__tab-panel">
            {kyc ? (
              <dl className="profile-card__meta profile-card__meta--kyc">
                <div className="profile-card__meta-item">
                  <dt>{t('users.profile.kycStatus')}</dt>
                  <dd>
                    <StatusPill
                      label={t(`users.management.status.${kyc.status}`, { defaultValue: kyc.status })}
                      variant={getUserStatusVariant(kyc.status)}
                    />
                  </dd>
                </div>
                <div className="profile-card__meta-item">
                  <dt>{t('users.profile.kycSubmitted')}</dt>
                  <dd>{formatDate(kyc.created_at ?? kyc.createdAt, locale)}</dd>
                </div>
              </dl>
            ) : (
              <div className="profile-card__empty">
                <p className="profile-card__empty-text">{t('users.profile.noKyc')}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default UserProfileCard;