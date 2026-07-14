import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useRegisterPageSearch } from '@enderass/shared/contexts';
import { UserProfileDashboard } from '../components/user-profile-dashboard.jsx';

export function UserProfileView() {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');

  useRegisterPageSearch({
    value: search,
    onChange: setSearch,
    placeholder: t('users.profile.searchPlaceholder'),
  });

  return (
    <section className="users-view">
      <UserProfileDashboard search={search} />
    </section>
  );
}

export default UserProfileView;
