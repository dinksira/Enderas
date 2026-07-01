import { useTranslation } from 'react-i18next';
import { MetricsCardGrid } from '../components/MetricsCardGrid.jsx';
import { WorkspacePage } from '../components/WorkspacePage.jsx';

export function FinanceOfficerDashboardView({ metrics, metricsLoading, metricsError, metricKeys }) {
  const { t } = useTranslation();

  return (
    <WorkspacePage
      title={t('dashboard.roles.financeOfficer.title')}
      description={t('dashboard.roles.financeOfficer.description')}
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

export default FinanceOfficerDashboardView;
