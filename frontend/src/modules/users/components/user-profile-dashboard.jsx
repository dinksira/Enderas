import { useCallback, useEffect, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Input } from '@enderass/shared/ui';
import { useUserProfile } from '../hooks/use-user-profile.js';
import { userService } from '../../../shared/services/user-service.js';
import { useAuth } from '@enderass/shared/hooks';
import { resolveMediaUrl } from '@enderass/shared/utils';

export function UserProfileDashboard({ search = '' }) {
  const { t } = useTranslation();
  const { profile, kyc, loading, error, refetch } = useUserProfile();
  const { setSession } = useAuth(); // If we need to update global context

  const identity = profile?.identity ?? {};
  
  const [activeTab, setActiveTab] = useState('personal'); // personal, security
  
  // Personal Info Form State
  const [formState, setFormState] = useState({
    firstName: '',
    lastName: '',
    email: '',
    preferredLanguage: 'en',
  });
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [saveError, setSaveError] = useState('');

  // Security Form State
  const [securityForm, setSecurityForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [savingSecurity, setSavingSecurity] = useState(false);
  const [securityMessage, setSecurityMessage] = useState('');
  const [securityError, setSecurityError] = useState('');

  // Avatar Upload State
  const fileInputRef = useRef(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  useEffect(() => {
    if (!profile) {
      return;
    }

    setFormState({
      firstName: identity.firstName || profile.firstName || '',
      lastName: identity.lastName || profile.lastName || '',
      email: identity.email || profile.email || '',
      preferredLanguage: profile.preferredLanguage || identity.preferredLanguage || 'en',
    });
  }, [profile, identity]);

  const handleChange = useCallback((event) => {
    const { name, value } = event.target;
    setFormState((current) => ({ ...current, [name]: value }));
  }, []);

  const handleSecurityChange = useCallback((event) => {
    const { name, value } = event.target;
    setSecurityForm((current) => ({ ...current, [name]: value }));
  }, []);

  const handleSubmitPersonal = useCallback(
    async (event) => {
      event.preventDefault();
      setSaveError('');
      setSaveMessage('');
      setSaving(true);

      try {
        const response = await userService.updateMe({
          firstName: formState.firstName,
          lastName: formState.lastName,
          email: formState.email,
          preferredLanguage: formState.preferredLanguage,
        });

        setSaveMessage(t('users.profile.saveSuccess'));
        await refetch();
        // Optional: window.location.reload() to update Sidebar if contexts don't auto-sync
      } catch (err) {
        setSaveError(err?.message || t('users.profile.saveFailed'));
      } finally {
        setSaving(false);
      }
    },
    [formState, refetch, t],
  );

  const handleSubmitSecurity = useCallback(
    async (event) => {
      event.preventDefault();
      setSecurityError('');
      setSecurityMessage('');

      if (securityForm.newPassword !== securityForm.confirmPassword) {
        setSecurityError(t('users.profile.passwordsDoNotMatch', { defaultValue: 'Passwords do not match.' }));
        return;
      }

      setSavingSecurity(true);

      try {
        await userService.changePassword({
          currentPassword: securityForm.currentPassword,
          newPassword: securityForm.newPassword,
        });

        setSecurityMessage(t('users.profile.passwordChangeSuccess', { defaultValue: 'Password changed successfully.' }));
        setSecurityForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } catch (err) {
        setSecurityError(err?.message || t('users.profile.passwordChangeFailed', { defaultValue: 'Failed to change password.' }));
      } finally {
        setSavingSecurity(false);
      }
    },
    [securityForm, t],
  );

  const handleAvatarClick = useCallback(() => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, []);

  const handleAvatarChange = useCallback(async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadingAvatar(true);
    setSaveError('');
    setSaveMessage('');

    try {
      const formData = new FormData();
      formData.append('avatar', file);
      
      await userService.updateAvatar(formData);
      await refetch();
      // Reload page so that the sidebar catches the new profile picture as well
      window.location.reload();
    } catch (err) {
      setSaveError(err?.message || 'Failed to upload avatar.');
    } finally {
      setUploadingAvatar(false);
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }, [refetch]);

  const profileLabel = [identity.firstName, identity.lastName].filter(Boolean).join(' ') || identity.displayName || t('users.profile.title');
  const avatarUrl = identity.avatarUrl || identity.profilePicture;
  
  const initials = profileLabel
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const quickFields = [
    { label: t('users.profile.mobile'), value: identity.mobileNumber || '—' },
    { label: t('users.profile.email'), value: identity.email || profile?.email || '—' },
    { label: t('users.profile.role'), value: profile?.roleCode || '—' },
    { label: t('users.profile.userType'), value: t(`users.management.userTypes.${profile?.userType || 'individual'}`) },
    { label: t('users.profile.kycStatus'), value: kyc ? t(`users.management.status.${kyc.status}`, { defaultValue: kyc.status }) : t('users.profile.helpKycPending') },
  ];

  const visibleQuickFields = search.trim()
    ? quickFields.filter((field) => `${field.label} ${field.value}`.toLowerCase().includes(search.trim().toLowerCase()))
    : quickFields;

  if (loading) {
    return <p className="user-profile-card__status">{t('users.profile.loading')}</p>;
  }

  if (error) {
    return (
      <p className="user-profile-card__status user-profile-card__status--error" role="alert">
        {error}
      </p>
    );
  }

  return (
    <div className="user-profile-page">
      <div className="user-profile-page__header-banner">
        <div className="user-profile-page__avatar-section">
           <div className="user-profile-page__avatar-wrapper" onClick={handleAvatarClick}>
              {avatarUrl ? (
                 <img src={resolveMediaUrl(avatarUrl)} alt={profileLabel} className="user-profile-page__avatar-img" />
              ) : (
                 <div className="user-profile-page__avatar-initials">{initials}</div>
              )}
              <div className="user-profile-page__avatar-overlay">
                 {uploadingAvatar ? (
                    <span className="spinner spinner--small"></span>
                 ) : (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="17 8 12 3 7 8" />
                      <line x1="12" y1="3" x2="12" y2="15" />
                    </svg>
                 )}
              </div>
           </div>
           <input 
              type="file" 
              ref={fileInputRef} 
              style={{ display: 'none' }} 
              accept="image/*"
              onChange={handleAvatarChange}
           />
           <div className="user-profile-page__title-group">
              <h1 className="user-profile-page__heading">{profileLabel}</h1>
              <p className="user-profile-page__lead">{identity.email || identity.mobileNumber}</p>
           </div>
        </div>
      </div>

      <div className="user-profile-page__grid">
        <aside className="user-profile-page__overview">
          <article className="card user-profile-page__quick-card">
            <h3 className="user-profile-page__section-title">{t('users.profile.atAGlance')}</h3>
            <dl className="user-profile-page__meta">
              {visibleQuickFields.map((field) => (
                <div className="user-profile-page__meta-row" key={field.label}>
                  <dt>{field.label}</dt>
                  <dd>{field.value}</dd>
                </div>
              ))}
            </dl>
          </article>

          <article className="card user-profile-page__quick-card">
            <h3 className="user-profile-page__section-title">{t('users.profile.helpTitle')}</h3>
            <p className="user-profile-page__section-copy">{t('users.profile.helpSubtitle')}</p>
            <ul className="profile-support__list">
              <li>{t('users.profile.topicAccount')}</li>
              <li>{t('users.profile.topicPassword')}</li>
              <li>{t('users.profile.topicKyc')}</li>
            </ul>
            <a
              className="btn btn--secondary user-profile-page__support-button"
              href={`mailto:${t('users.profile.supportEmail')}`}
            >
              {t('users.profile.supportEmailLink')}
            </a>
          </article>
        </aside>

        <main className="user-profile-page__main">
          <div className="card user-profile-page__section">
             <div className="user-profile-page__tabs">
                <button 
                  className={`user-profile-page__tab ${activeTab === 'personal' ? 'user-profile-page__tab--active' : ''}`}
                  onClick={() => setActiveTab('personal')}
                >
                  {t('users.profile.personalInfoTab', { defaultValue: 'Personal Info' })}
                </button>
                <button 
                  className={`user-profile-page__tab ${activeTab === 'security' ? 'user-profile-page__tab--active' : ''}`}
                  onClick={() => setActiveTab('security')}
                >
                  {t('users.profile.securityTab', { defaultValue: 'Security' })}
                </button>
             </div>

             {activeTab === 'personal' && (
                <form className="profile-form" onSubmit={handleSubmitPersonal} noValidate>
                  <div className="profile-form__header">
                     <h3>{t('users.profile.settingsTitle')}</h3>
                     <p>{t('users.profile.settingsDescription')}</p>
                  </div>
                  <div className="profile-form__grid">
                    <Input
                      label={t('users.profile.firstName')}
                      name="firstName"
                      value={formState.firstName}
                      onChange={handleChange}
                    />
                    <Input
                      label={t('users.profile.lastName')}
                      name="lastName"
                      value={formState.lastName}
                      onChange={handleChange}
                    />
                    <Input
                      label={t('users.profile.email')}
                      type="email"
                      name="email"
                      value={formState.email}
                      onChange={handleChange}
                    />
                    <div className="input-field">
                      <label className="input-field__label" htmlFor="preferredLanguage">
                        {t('users.profile.preferredLanguage')}
                      </label>
                      <select
                        id="preferredLanguage"
                        name="preferredLanguage"
                        className="input-field__control"
                        value={formState.preferredLanguage}
                        onChange={handleChange}
                      >
                        <option value="en">{t('users.profile.languageEnglish')}</option>
                        <option value="am">{t('users.profile.languageAmharic')}</option>
                      </select>
                    </div>
                  </div>

                  <div className="profile-form__footer">
                    <div className="profile-form__status">
                      {saveMessage ? <p className="profile-form__message">{saveMessage}</p> : null}
                      {saveError ? (
                        <p className="profile-form__error" role="alert">{saveError}</p>
                      ) : null}
                    </div>
                    <Button type="submit" variant="primary" disabled={saving}>
                      {saving ? t('users.profile.saving') : t('users.profile.saveChanges')}
                    </Button>
                  </div>
                </form>
             )}

             {activeTab === 'security' && (
                <form className="profile-form" onSubmit={handleSubmitSecurity} noValidate>
                  <div className="profile-form__header">
                     <h3>{t('users.profile.changePasswordTitle', { defaultValue: 'Change Password' })}</h3>
                     <p>{t('users.profile.changePasswordDesc', { defaultValue: 'Ensure your account is using a long, random password to stay secure.' })}</p>
                  </div>
                  
                  <div className="profile-form__grid profile-form__grid--single">
                    <Input
                      label={t('users.profile.currentPassword', { defaultValue: 'Current Password' })}
                      type="password"
                      name="currentPassword"
                      value={securityForm.currentPassword}
                      onChange={handleSecurityChange}
                    />
                    <Input
                      label={t('users.profile.newPassword', { defaultValue: 'New Password' })}
                      type="password"
                      name="newPassword"
                      value={securityForm.newPassword}
                      onChange={handleSecurityChange}
                    />
                    <Input
                      label={t('users.profile.confirmPassword', { defaultValue: 'Confirm New Password' })}
                      type="password"
                      name="confirmPassword"
                      value={securityForm.confirmPassword}
                      onChange={handleSecurityChange}
                    />
                  </div>

                  <div className="profile-form__footer">
                    <div className="profile-form__status">
                      {securityMessage ? <p className="profile-form__message">{securityMessage}</p> : null}
                      {securityError ? (
                        <p className="profile-form__error" role="alert">{securityError}</p>
                      ) : null}
                    </div>
                    <Button type="submit" variant="primary" disabled={savingSecurity}>
                      {savingSecurity ? t('users.profile.saving') : t('users.profile.updatePassword', { defaultValue: 'Update Password' })}
                    </Button>
                  </div>
                </form>
             )}
          </div>
        </main>
      </div>
    </div>
  );
}

export default UserProfileDashboard;
