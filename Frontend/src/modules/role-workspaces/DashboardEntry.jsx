import { useEffect, useState } from 'react';
import { usePermission } from '../../core/auth/usePermission.js';
import { dashboardService } from '../dashboard/services/dashboard-service.js';
import { SuperAdminDashboardView } from './super-admin/SuperAdminDashboardView.jsx';
import { RoleDashboardView } from './RoleDashboardView.jsx';

/**
 * Routes users to their role-specific dashboard view.
 */
export function DashboardEntry() {
  const { roleCode } = usePermission();
  const [metricsData, setMetricsData] = useState(null);
  const [metricsLoading, setMetricsLoading] = useState(true);
  const [metricsError, setMetricsError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setMetricsLoading(true);
    setMetricsError('');

    dashboardService
      .getMetrics()
      .then((data) => {
        if (!cancelled) setMetricsData(data);
      })
      .catch((err) => {
        if (!cancelled) {
          setMetricsError(err instanceof Error ? err.message : 'Failed to load metrics');
        }
      })
      .finally(() => {
        if (!cancelled) setMetricsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const metricsProps = {
    metrics: metricsData?.metrics,
    metricsLoading,
    metricsError,
  };

  if (roleCode === 'super_admin') {
    return <SuperAdminDashboardView {...metricsProps} />;
  }

  return <RoleDashboardView {...metricsProps} />;
}

export default DashboardEntry;
