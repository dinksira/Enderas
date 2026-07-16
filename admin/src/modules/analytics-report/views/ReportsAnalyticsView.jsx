import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';
import { Button } from '@enderass/shared/ui';
import { analyticsService } from '@enderass/shared/services';
import { ENV } from '@enderass/shared/api';
import { useAuthStore } from '@enderass/shared/auth';
import { useAnalyticsPolling } from '../hooks/use-analytics-polling.js';

const METRIC_CONFIG = {
  users:        { color: '#3b82f6', bg: 'rgba(59,130,246,0.12)', icon: 'U' },
  kyc:          { color: '#10b981', bg: 'rgba(16,185,129,0.12)', icon: 'K' },
  assets:       { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', icon: 'A' },
  evaluations:  { color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)', icon: 'E' },
  auctions:     { color: '#06b6d4', bg: 'rgba(6,182,212,0.12)', icon: 'Au' },
  bids:         { color: '#6366f1', bg: 'rgba(99,102,241,0.12)', icon: 'B' },
  payments:     { color: '#34d399', bg: 'rgba(52,211,153,0.12)', icon: 'P' },
  cpo:          { color: '#f43f5e', bg: 'rgba(244,63,94,0.12)', icon: 'C' },
  winners:      { color: '#e4b853', bg: 'rgba(228,184,83,0.12)', icon: 'W' },
};

const CHART_COLORS = [
  '#3b82f6','#10b981','#f59e0b','#8b5cf6','#06b6d4',
  '#6366f1','#34d399','#f43f5e','#e4b853',
];

function resolveMetricValue(metricGroup) {
  if (!metricGroup || typeof metricGroup !== 'object') return 0;
  if (typeof metricGroup.total === 'number') return metricGroup.total;
  if (typeof metricGroup.all === 'number') return metricGroup.all;
  if (typeof metricGroup.pending === 'number') return metricGroup.pending;
  const values = Object.values(metricGroup).filter((v) => typeof v === 'number');
  return values.reduce((s, v) => s + v, 0);
}

function TrendIndicator({ delta }) {
  if (delta == null || delta === 0) return null;
  const isUp = delta > 0;
  return (
    <span className={`analytics-kpi__trend ${isUp ? 'analytics-kpi__trend--up' : 'analytics-kpi__trend--down'}`}>
      <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
        {isUp ? (
          <path d="M5 1l4 5H1z" fill="currentColor"/>
        ) : (
          <path d="M5 9l4-5H1z" fill="currentColor"/>
        )}
      </svg>
      {Math.abs(delta).toFixed(1)}%
    </span>
  );
}

function KpiCard({ metricKey, metricGroup, delta }) {
  const { t } = useTranslation();
  const cfg = METRIC_CONFIG[metricKey] || { color: '#6b7280', bg: 'rgba(107,114,128,0.12)', icon: '?' };
  const value = resolveMetricValue(metricGroup);
  const label = t(`dashboard.metrics.labels.${metricKey}`, { defaultValue: metricKey });

  return (
    <article className="analytics-kpi" style={{ '--kpi-accent': cfg.color, '--kpi-accent-bg': cfg.bg }}>
      <div className="analytics-kpi__icon" style={{ background: cfg.bg, color: cfg.color }}>
        {cfg.icon}
      </div>
      <div className="analytics-kpi__body">
        <span className="analytics-kpi__label">{label}</span>
        <span className="analytics-kpi__value">{value.toLocaleString()}</span>
        <TrendIndicator delta={delta} />
      </div>
    </article>
  );
}

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="analytics-chart-tooltip">
      <span className="analytics-chart-tooltip__label">{label}</span>
      <span className="analytics-chart-tooltip__value">
        {payload[0].value.toLocaleString()}
      </span>
    </div>
  );
}

function DonutTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const { name, value, payload: entry } = payload[0];
  return (
    <div className="analytics-chart-tooltip">
      <span className="analytics-chart-tooltip__label" style={{ color: entry.fill }}>
        {name}
      </span>
      <span className="analytics-chart-tooltip__value">{value.toLocaleString()}</span>
    </div>
  );
}

function DonutCenter({ total }) {
  return (
    <div className="analytics-donut-center">
      <span className="analytics-donut-center__value">{total.toLocaleString()}</span>
      <span className="analytics-donut-center__label">Total</span>
    </div>
  );
}

function LiveDot() {
  return (
    <span className="analytics-live-dot" aria-label="Live">
      <span className="analytics-live-dot__pulse" />
      <span className="analytics-live-dot__text">LIVE</span>
    </span>
  );
}

export function ReportsAnalyticsView() {
  const { t } = useTranslation();
  const token = useAuthStore((state) => state.accessToken);

  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [exporting, setExporting] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(true);

  const { snapshot, deltas, reports, loading, error, refetch } = useAnalyticsPolling({
    enabled: autoRefresh,
  });

  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  const handleExport = useCallback(async (reportType) => {
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
      console.error(err);
    } finally {
      setExporting('');
    }
  }, [dateFrom, dateTo, token, t]);

  const snapshotKeys = snapshot ? Object.keys(snapshot) : [];
  const selectedKeys = ['users', 'kyc', 'assets', 'evaluations', 'auctions', 'bids'];

  const chartData = snapshot
    ? selectedKeys
        .filter((k) => k in snapshot)
        .map((k, i) => ({
          name: t(`dashboard.metrics.labels.${k}`, { defaultValue: k }),
          value: resolveMetricValue(snapshot[k]),
          fill: CHART_COLORS[i % CHART_COLORS.length],
        }))
    : [];

  const totalAll = chartData.reduce((s, d) => s + d.value, 0);

  return (
    <section className="analytics-view">
      <div className="analytics-view__top">
        <div className="analytics-view__top-row">
          <div className="analytics-view__title-group">
            <h1 className="analytics-view__title">{t('reports.pageTitle')}</h1>
            <p className="analytics-view__subtitle">{t('reports.subtitle')}</p>
          </div>
          <div className="analytics-view__controls">
            {autoRefresh && <LiveDot />}
            <button
              type="button"
              className="analytics-view__icon-btn"
              onClick={handleRefresh}
              disabled={loading}
              aria-label={t('reports.refresh')}
              title={t('reports.refresh')}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M1 4v6h6M23 20v-6h-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M20.49 9A9 9 0 005.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 013.51 15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <button
              type="button"
              className={`analytics-view__icon-btn analytics-view__auto-btn ${autoRefresh ? 'analytics-view__auto-btn--active' : ''}`}
              onClick={() => setAutoRefresh((p) => !p)}
              aria-label="Toggle auto-refresh"
              title={autoRefresh ? 'Auto-refresh on' : 'Auto-refresh off'}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8"/>
                <path d="M12 7v5l3 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
              </svg>
            </button>
          </div>
        </div>
        <div className="analytics-view__filter-row">
          <div className="analytics-view__date-field">
            <label className="analytics-view__date-label" htmlFor="analytics-from">From</label>
            <input
              id="analytics-from"
              type="date"
              className="analytics-view__date-input"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
          </div>
          <div className="analytics-view__date-field">
            <label className="analytics-view__date-label" htmlFor="analytics-to">To</label>
            <input
              id="analytics-to"
              type="date"
              className="analytics-view__date-input"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </div>
        </div>
      </div>

      {error && (
        <div className="analytics-view__alert" role="alert">
          <span>{error}</span>
          <button type="button" onClick={handleRefresh} className="analytics-view__alert-retry">
            {t('reports.retry') || 'Retry'}
          </button>
        </div>
      )}

      {snapshot && (
        <>
          <div className="analytics-kpi-grid">
            {selectedKeys.map((key) => (
              snapshot[key] && (
                <KpiCard
                  key={key}
                  metricKey={key}
                  metricGroup={snapshot[key]}
                  delta={deltas[key]}
                />
              )
            ))}
          </div>

          <div className="analytics-charts">
            <div className="analytics-chart-card">
              <h3 className="analytics-chart-card__title">
                {t('reports.metricsComparison') || 'Metrics Comparison'}
              </h3>
              <div className="analytics-chart-card__body">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: 'var(--dashboard-text-muted)' }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: 'var(--dashboard-text-muted)' }}
                    />
                    <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(0,0,0,0.04)' }} />
                    <Bar
                      dataKey="value"
                      radius={[6, 6, 0, 0]}
                      maxBarSize={48}
                    >
                      {chartData.map((entry, i) => (
                        <Cell key={i} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="analytics-chart-card">
              <h3 className="analytics-chart-card__title">
                {t('reports.distribution') || 'Distribution'}
              </h3>
              <div className="analytics-chart-card__body">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={72}
                      outerRadius={110}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {chartData.map((entry, i) => (
                        <Cell key={i} fill={entry.fill} stroke="transparent" />
                      ))}
                    </Pie>
                    <Tooltip content={<DonutTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <DonutCenter total={totalAll} />
              </div>
            </div>
          </div>
        </>
      )}

      {!snapshot && loading && (
        <div className="analytics-view__loading">
          {[1,2,3,4,5,6].map((i) => (
            <div key={i} className="analytics-view__skeleton" />
          ))}
        </div>
      )}

      <section className="analytics-reports">
        <h2 className="analytics-reports__title">{t('reports.reportsTitle')}</h2>
        {loading && (
          <div className="analytics-reports__loading">
            {[1,2,3].map((i) => (
              <div key={i} className="analytics-reports__skeleton" />
            ))}
          </div>
        )}
        {!loading && reports.length === 0 && (
          <p className="analytics-reports__empty">{t('reports.empty')}</p>
        )}
        <div className="analytics-reports__grid">
          {reports.map((report) => (
            <article key={report.id} className="analytics-reports__card">
              <div className="analytics-reports__card-body">
                <h3 className="analytics-reports__card-title">
                  {t(`reports.types.${report.id}.title`, { defaultValue: report.title })}
                </h3>
                <p className="analytics-reports__card-desc">
                  {t(`reports.types.${report.id}.description`, { defaultValue: report.description })}
                </p>
                {report.summary && (
                  <p className="analytics-reports__card-meta">
                    {t('reports.rowCount', { count: report.summary.length })}
                  </p>
                )}
              </div>
              <div className="analytics-reports__card-action">
                <Button
                  variant="secondary"
                  disabled={exporting === report.id}
                  onClick={() => handleExport(report.id)}
                >
                  {exporting === report.id ? t('reports.exporting') : t('reports.exportCsv')}
                </Button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </section>
  );
}

export default ReportsAnalyticsView;
