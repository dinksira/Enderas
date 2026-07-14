import { useTranslation } from 'react-i18next';
import { RolePermissionTable } from '../components/role-permission-table.jsx';

export function StaffRolesView() {
  const { t } = useTranslation();

  return (
    <section className="staff-roles-view">
      <header>
        <h1 className="staff-roles-view__title">
          {t('staff.roles.pageTitle', 'Staff Roles & Access')}
        </h1>
        <p className="staff-roles-view__lead">
          {t('staff.roles.subtitle', 'Review staff role permissions configured on the backend.')}
        </p>
      </header>
      <RolePermissionTable />
    </section>
  );
}

export default StaffRolesView;
