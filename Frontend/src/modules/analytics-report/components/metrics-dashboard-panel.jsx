import { useAnalyticsMetrics } from '../hooks/use-analytics-metrics.js';
import './metrics-dashboard-panel.css';

export function MetricsDashboardPanel() {
  const { records, loading, error } = useAnalyticsMetrics();

  return (
    <section className="metrics-dashboard-panel" aria-live="polite">
      <h3 className="metrics-dashboard-panel__title">Analytics & Reports</h3>
      <p className="metrics-dashboard-panel__body">
        Module-specific UI fragment scoped to the analytics-report domain.
      </p>
      <p className="metrics-dashboard-panel__status">
        {loading && 'Loading records...'}
        {!loading && error && `Error: ${error}`}
        {!loading && !error && `${records.length} record(s) loaded`}
      </p>
    </section>
  );
}

export default MetricsDashboardPanel;
