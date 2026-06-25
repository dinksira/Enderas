import { useTranslation } from 'react-i18next';
import { StatusPill } from '../../../components/admin/StatusPill.jsx';
import { useUserProfile } from '../hooks/use-user-profile.js';
import { formatDate, getUserStatusVariant } from '../utils/user-management-utils.js';

export function UserProfileCard() {
  const { t, i18n } = useTranslation();
  const locale = i18n.language === 'am' ? 'am' : 'en';
  const { profile, kyc, loading, error } = useUserProfile();

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

  const identity = profile?.identity ?? {};
  const status = profile?.status;

  return (
    <section className="user-profile-card" aria-live="polite">
      <header className="user-profile-card__header">
        <h3 className="user-profile-card__title">{identity.displayName || t('users.profile.title')}</h3>
        {status && (
          <StatusPill
            label={t(`users.management.status.${status}`, { defaultValue: status })}
            variant={getUserStatusVariant(status)}
          />
        )}
      </header>

      <dl className="kyc-drawer__meta user-profile-card__meta">
        <dt>{t('users.profile.mobile')}</dt>
        <dd>{identity.mobileNumber || '—'}</dd>
        <dt>{t('users.profile.email')}</dt>
        <dd>{identity.email || '—'}</dd>
        <dt>{t('users.profile.role')}</dt>
        <dd>{profile?.roleCode || '—'}</dd>
        <dt>{t('users.profile.userType')}</dt>
        <dd>{t(`users.management.userTypes.${profile?.userType || 'individual'}`)}</dd>
        {kyc && (
          <>
            <dt>{t('users.profile.kycStatus')}</dt>
            <dd>{t(`users.management.status.${kyc.status}`, { defaultValue: kyc.status })}</dd>
            <dt>{t('users.profile.kycSubmitted')}</dt>
            <dd>{formatDate(kyc.created_at ?? kyc.createdAt, locale)}</dd>
          </>
        )}
      </dl>
    </section>
  );
}

export default UserProfileCard;
