import { usePermission } from '../../core/auth/usePermission.js';
import { SuperAdminDashboardView } from './super-admin/SuperAdminDashboardView.jsx';
import { RoleDashboardView } from './RoleDashboardView.jsx';

/**
 * Routes users to their role-specific dashboard view.
 */
export function DashboardEntry() {
  const { roleCode } = usePermission();

  if (roleCode === 'super_admin') {
    return <SuperAdminDashboardView />;
  }

  return <RoleDashboardView />;
}

export default DashboardEntry;
