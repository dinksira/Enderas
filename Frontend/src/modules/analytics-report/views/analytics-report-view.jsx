import { MetricsDashboardPanel } from '../components/metrics-dashboard-panel.jsx';
import './analytics-report-view.css';

export function AnalyticsReportView() {
  return (
    <section className="analytics-report-view">
      <header>
        <h1 className="analytics-report-view__title">Analytics & Reports</h1>
        <p className="analytics-report-view__lead">System metrics dashboard, operational graphs, and file exports.</p>
      </header>
      <MetricsDashboardPanel />
    </section>
  );
}

export default AnalyticsReportView;
