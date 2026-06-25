import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../../../components/Button.jsx';
import { DateRangeFilter } from '../../../components/admin/DateRangeFilter.jsx';
import { MetricsCardGrid } from '../../role-workspaces/components/MetricsCardGrid.jsx';
import { analyticsService } from '../services/analytics-service.js';
import { ENV } from '../../../config/env.js';
import { useAuthStore } from '../../../stores/auth-store.js';

export function ReportsAnalyticsView() {
  const { t } = useTranslation();
  const token = useAuthStore((state) => state.accessToken);

  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [reports, setReports] = useState([]);
  const [snapshot, setSnapshot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [exporting, setExporting] = useState('');

  const loadReports = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await analyticsService.listReports({
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
      });
      setReports(response?.reports ?? []);
      setSnapshot(response?.dashboardSnapshot ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('reports.loadFailed'));
      setReports([]);
    } finally {
      setLoading(false);
    }
  }, [dateFrom, dateTo, t]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  const handleExport = async (reportType) => {
    setExporting(reportType);
    try {
      const params = new URLSearchParams({
        reportType,
        format: 'csv',
        ...(dateFrom ? { dateFrom } : {}),
        ...(dateTo ? { dateTo } : {}),
      });
      const url = `${ENV.apiBaseUrl}${ENV.apiV1Prefix}/dashboard/reports/export?${params}`;
      const response = await fetch(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!response.ok) throw new Error(t('reports.exportFailed'));
      const blob = await response.blob();
      const downloadUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `${reportType}.csv`;
      link.click();
      URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('reports.exportFailed'));
    } finally {
      setExporting('');
    }
  };

  return (
    <section className="kyc-management-page analytics-report-view">
      <div className="admin-data-table__toolbar-row">
        <DateRangeFilter
          dateFrom={dateFrom}
          dateTo={dateTo}
          onDateFromChange={setDateFrom}
          onDateToChange={setDateTo}
          idPrefix="reports"
        />
        <Button variant="secondary" onClick={loadReports} disabled={loading}>
          {t('reports.refresh')}
        </Button>
      </div>

      {error && (
        <p className="kyc-management-page__alert" role="alert">
          {error}
        </p>
      )}

      {snapshot && (
        <section className="analytics-report-view__snapshot">
          <h2 className="analytics-report-view__section-title">{t('reports.snapshotTitle')}</h2>
          <MetricsCardGrid
            metrics={snapshot}
            metricKeys={['users', 'kyc', 'assets', 'evaluations', 'auctions', 'bids', 'payments', 'cpo', 'winners']}
            loading={loading}
          />
        </section>
      )}

      <section className="analytics-report-view__reports" aria-live="polite">
        <h2 className="analytics-report-view__section-title">{t('reports.reportsTitle')}</h2>
        {loading && <p className="dashboard-table__empty">{t('admin.loading')}</p>}
        {!loading && reports.length === 0 && (
          <p className="dashboard-table__empty">{t('reports.empty')}</p>
        )}
        <div className="analytics-report-view__cards">
          {reports.map((report) => (
            <article key={report.id} className="analytics-report-view__card">
              <h3>{t(`reports.types.${report.id}.title`, { defaultValue: report.title })}</h3>
              <p>{t(`reports.types.${report.id}.description`, { defaultValue: report.description })}</p>
              {report.summary && (
                <p className="analytics-report-view__summary">
                  {t('reports.rowCount', { count: report.summary.length })}
                </p>
              )}
              <Button
                variant="secondary"
                disabled={exporting === report.id}
                onClick={() => handleExport(report.id)}
              >
                {exporting === report.id ? t('reports.exporting') : t('reports.exportCsv')}
              </Button>
            </article>
          ))}
        </div>
      </section>
    </section>
  );
}

export default ReportsAnalyticsView;
