import { useTranslation } from 'react-i18next';
import { StaffPermissionMatrix } from '../../staff/components/StaffPermissionMatrix.jsx';
import { getStaffRoleLabel } from '../../staff/utils/staff-management-utils.js';
import { useStaffRoles } from '../hooks/use-staff-roles.js';

export function RolePermissionTable() {
  const { t } = useTranslation();
  const { records, permissionCatalog, loading, error } = useStaffRoles();

  if (loading) {
    return <p className="role-permission-table__status">{t('admin.loading', 'Loading...')}</p>;
  }

  if (error) {
    return (
      <p className="role-permission-table__status role-permission-table__status--error" role="alert">
        {error}
      </p>
    );
  }

  if (!records.length) {
    return <p className="role-permission-table__status">{t('staff.roles.empty', 'No staff roles found.')}</p>;
  }

  return (
    <div className="role-permission-table__list">
      {records.map((role) => (
        <section key={role.id} className="role-permission-table__role-card">
          <header className="role-permission-table__role-header">
            <div>
              <h3 className="role-permission-table__role-title">
                {getStaffRoleLabel(t, role.code) || role.name}
              </h3>
              <p className="role-permission-table__role-meta">
                {role.code}
                {role.affectedStaffCount != null ? ` · ${role.affectedStaffCount} staff` : ''}
              </p>
              {role.summary ? (
                <p className="role-permission-table__role-summary">{role.summary}</p>
              ) : null}
            </div>
          </header>

          <StaffPermissionMatrix
            t={t}
            catalog={role.catalog ?? permissionCatalog}
            matrix={role.matrix ?? []}
            roleLabel={role.name}
            affectedStaffCount={role.affectedStaffCount ?? 0}
          />
        </section>
      ))}
    </div>
  );
}

export default RolePermissionTable;
