import { useStaffRoles } from '../hooks/use-staff-roles.js';
import './role-permission-table.css';

export function RolePermissionTable() {
  const { records, loading, error } = useStaffRoles();

  return (
    <section className="role-permission-table" aria-live="polite">
      <h3 className="role-permission-table__title">Staff Roles & Access</h3>
      <p className="role-permission-table__body">
        Module-specific UI fragment scoped to the staff-roles domain.
      </p>
      <p className="role-permission-table__status">
        {loading && 'Loading records...'}
        {!loading && error && `Error: ${error}`}
        {!loading && !error && `${records.length} record(s) loaded`}
      </p>
    </section>
  );
}

export default RolePermissionTable;
