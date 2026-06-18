import { RolePermissionTable } from '../components/role-permission-table.jsx';

export function StaffRolesView() {
  return (
    <section className="staff-roles-view">
      <header>
        <h1 className="staff-roles-view__title">Staff Roles & Access</h1>
        <p className="staff-roles-view__lead">Internal administrator accounts, role permissions, and access controls.</p>
      </header>
      <RolePermissionTable />
    </section>
  );
}

export default StaffRolesView;
