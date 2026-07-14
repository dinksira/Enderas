import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Input } from '@enderass/shared/ui';
import { useUserProfile } from '../hooks/use-user-profile.js';
import { userService } from '../../../shared/services/user-service.js';

export function UserProfileDashboard({ search = '' }) {
  const { t } = useTranslation();
  const { profile, kyc, loading, error, refetch } = useUserProfile();

  const identity = profile?.identity ?? {};
  const [formState, setFormState] = useState({
    firstName: '',
    lastName: '',
    email: '',
    preferredLanguage: 'en',
  });
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [saveError, setSaveError] = useState('');

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

  const handleSubmit = useCallback(
    async (event) => {
      event.preventDefault();
      setSaveError('');
      setSaveMessage('');
      setSaving(true);

      try {
        await userService.updateMe({
          firstName: formState.firstName,
          lastName: formState.lastName,
          email: formState.email,
          preferredLanguage: formState.preferredLanguage,
        });

        setSaveMessage(t('users.profile.saveSuccess'));
        await refetch();
      } catch (err) {
        setSaveError(err?.message || t('users.profile.saveFailed'));
      } finally {
        setSaving(false);
      }
    },
    [formState, refetch, t],
  );

  const profileLabel = [identity.firstName, identity.lastName].filter(Boolean).join(' ') || identity.displayName || t('users.profile.title');

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
      <div className="user-profile-page__grid">
        <aside className="user-profile-page__overview">
          <article className="card user-profile-page__quick-card">
            <h3 className="user-profile-page__section-title">{t('users.profile.atAGlance')}</h3>
            <p className="user-profile-page__section-copy">{t('users.profile.atAGlanceSubtitle')}</p>
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
            <h3 className="user-profile-page__section-title">{t('users.profile.settingsTitle')}</h3>
            <p className="user-profile-page__section-copy">{t('users.profile.settingsDescription')}</p>
          </article>
        </aside>

        <main className="user-profile-page__main">
          <section className="card user-profile-page__section">
            <div className="user-profile-page__section-header">
              <div>
                <p className="user-profile-page__eyebrow">{t('users.profile.pageTitle')}</p>
                <h2 className="user-profile-page__heading">{profileLabel}</h2>
                <p className="user-profile-page__lead">{t('users.profile.pageSubtitle')}</p>
              </div>
            </div>

            <form className="profile-form" onSubmit={handleSubmit} noValidate>
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
          </section>

          <section className="card user-profile-page__section">
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
          </section>
        </main>
      </div>
    </div>
  );
}

export default UserProfileDashboard;
