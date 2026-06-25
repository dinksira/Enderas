import { useTranslation } from 'react-i18next';
import { MetricsCardGrid } from '../components/MetricsCardGrid.jsx';
import { WorkspacePage } from '../components/WorkspacePage.jsx';

export function CustomerServiceDashboardView({ metrics, metricsLoading, metricsError, metricKeys }) {
  const { t } = useTranslation();

  return (
    <WorkspacePage
      title={t('dashboard.roles.customerService.title')}
      description={t('dashboard.roles.customerService.description')}
    >
      <MetricsCardGrid
        metrics={metrics}
        metricKeys={metricKeys}
        loading={metricsLoading}
        error={metricsError}
      />
    </WorkspacePage>
  );
}

export default CustomerServiceDashboardView;
