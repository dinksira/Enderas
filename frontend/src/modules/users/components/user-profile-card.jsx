import { useTranslation } from 'react-i18next';
import { StatusPill } from '../../../components/admin/StatusPill.jsx';
import { useUserProfile } from '../hooks/use-user-profile.js';
import { formatDate } from '@enderass/shared/utils';
import { getUserStatusVariant } from '../utils/user-management-utils.js';

export function UserProfileCard({ search = '' }) {
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
  const searchTerm = search.trim().toLowerCase();

  const fields = [
    { label: t('users.profile.mobile'), value: identity.mobileNumber || '—' },
    { label: t('users.profile.email'), value: identity.email || '—' },
    { label: t('users.profile.role'), value: profile?.roleCode || '—' },
    {
      label: t('users.profile.userType'),
      value: t(`users.management.userTypes.${profile?.userType || 'individual'}`),
    },
    ...(kyc
      ? [
          {
            label: t('users.profile.kycStatus'),
            value: t(`users.management.status.${kyc.status}`, { defaultValue: kyc.status }),
          },
          {
            label: t('users.profile.kycSubmitted'),
            value: formatDate(kyc.created_at ?? kyc.createdAt, locale),
          },
        ]
      : []),
  ];

  const visibleFields = searchTerm
    ? fields.filter((field) =>
        `${field.label} ${field.value}`.toLowerCase().includes(searchTerm),
      )
    : fields;

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

      {visibleFields.length === 0 ? (
        <p className="user-profile-card__status">{t('users.profile.searchEmpty')}</p>
      ) : (
        <dl className="kyc-drawer__meta user-profile-card__meta">
          {visibleFields.flatMap((field) => [
            <dt key={`${field.label}-label`}>{field.label}</dt>,
            <dd key={`${field.label}-value`}>{field.value}</dd>,
          ])}
        </dl>
      )}
    </section>
  );
}

export default UserProfileCard;
