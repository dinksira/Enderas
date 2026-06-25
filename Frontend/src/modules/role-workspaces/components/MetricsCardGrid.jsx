import { useTranslation } from 'react-i18next';

/**
 * @param {Record<string, Record<string, number>>|null|undefined} metrics
 */
function resolveMetricValue(metricGroup) {
  if (!metricGroup || typeof metricGroup !== 'object') return 0;
  if (typeof metricGroup.total === 'number') return metricGroup.total;
  if (typeof metricGroup.all === 'number') return metricGroup.all;
  if (typeof metricGroup.pending === 'number') return metricGroup.pending;
  const values = Object.values(metricGroup).filter((value) => typeof value === 'number');
  return values.reduce((sum, value) => sum + value, 0);
}

/**
 * @param {{
 *   metrics?: Record<string, Record<string, number>>|null,
 *   metricKeys?: string[],
 *   loading?: boolean,
 *   error?: string,
 * }} props
 */
export function MetricsCardGrid({ metrics, metricKeys = [], loading = false, error = '' }) {
  const { t } = useTranslation();

  if (loading) {
    return <p className="metrics-card-grid__status">{t('dashboard.metrics.loading')}</p>;
  }

  if (error) {
    return (
      <p className="metrics-card-grid__status metrics-card-grid__status--error" role="alert">
        {error}
      </p>
    );
  }

  const keys = metricKeys.length > 0 ? metricKeys : Object.keys(metrics || {});

  if (!keys.length) {
    return <p className="metrics-card-grid__status">{t('dashboard.metrics.empty')}</p>;
  }

  return (
    <div className="metrics-card-grid">
      {keys.map((key) => (
        <article key={key} className="metrics-card-grid__card">
          <span className="metrics-card-grid__label">
            {t(`dashboard.metrics.labels.${key}`, { defaultValue: key })}
          </span>
          <strong className="metrics-card-grid__value">{resolveMetricValue(metrics?.[key])}</strong>
        </article>
      ))}
    </div>
  );
}

export default MetricsCardGrid;
