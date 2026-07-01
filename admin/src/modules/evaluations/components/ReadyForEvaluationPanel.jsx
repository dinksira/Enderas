import { Button } from '@enderass/shared/ui';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { evaluationService } from '@enderass/shared/services';
import { formatAssetCategory, formatDate } from '../utils/evaluation-management-utils.js';

/**
 * @param {{
 *   refreshTrigger?: number,
 *   canSchedule?: boolean,
 *   onScheduleAsset: (asset: object) => void,
 * }} props
 */
export function ReadyForEvaluationPanel({
  refreshTrigger = 0,
  canSchedule = false,
  onScheduleAsset,
}) {
  const { t, i18n } = useTranslation();
  const locale = i18n.language === 'am' ? 'am' : 'en';

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadEligible = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const assets = await evaluationService.getEligibleAssets();
      setItems(assets);
    } catch (err) {
      setItems([]);
      setError(err instanceof Error ? err.message : t('evaluations.management.readyQueue.loadFailed'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    loadEligible();
  }, [loadEligible, refreshTrigger]);

  if (loading) {
    return (
      <section className="evaluation-ready-panel" aria-busy="true">
        <p className="evaluation-ready-panel__hint">{t('evaluations.management.readyQueue.loading')}</p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="evaluation-ready-panel">
        <p className="kyc-management-page__alert" role="alert">
          {error}
        </p>
        <Button variant="secondary" onClick={loadEligible}>
          {t('evaluations.management.readyQueue.retry')}
        </Button>
      </section>
    );
  }

  return (
    <section className="evaluation-ready-panel" aria-labelledby="evaluation-ready-panel-title">
      <div className="evaluation-ready-panel__header">
        <div>
          <h2 id="evaluation-ready-panel-title" className="evaluation-ready-panel__title">
            {t('evaluations.management.readyQueue.title')}
          </h2>
          <p className="evaluation-ready-panel__hint">{t('evaluations.management.readyQueue.subtitle')}</p>
        </div>
        {items.length > 0 && (
          <span className="evaluation-ready-panel__count">
            {t('evaluations.management.readyQueue.count', { count: items.length })}
          </span>
        )}
      </div>

      {items.length === 0 ? (
        <p className="evaluation-ready-panel__empty">{t('evaluations.management.readyQueue.empty')}</p>
      ) : (
        <div className="dashboard-table-wrap">
          <table className="dashboard-table">
            <thead>
              <tr>
                <th>{t('evaluations.management.table.headers.asset')}</th>
                <th>{t('evaluations.management.table.headers.category')}</th>
                <th>{t('evaluations.management.table.headers.owner')}</th>
                <th>{t('assets.table.headers.submitted')}</th>
                <th>{t('evaluations.management.table.headers.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {items.map((asset) => (
                <tr key={asset.id} className="dashboard-table__row">
                  <td className="dashboard-table__cell dashboard-table__cell--strong">{asset.title}</td>
                  <td className="dashboard-table__cell dashboard-table__cell--muted">
                    {formatAssetCategory(t, asset.assetType)}
                  </td>
                  <td className="dashboard-table__cell">{asset.ownerName || '—'}</td>
                  <td className="dashboard-table__cell">
                    {asset.submittedAt ? formatDate(asset.submittedAt, locale) : '—'}
                  </td>
                  <td className="dashboard-table__cell">
                    {canSchedule ? (
                      <Button
                        variant="primary"
                        onClick={() => onScheduleAsset(asset)}
                      >
                        {t('evaluations.management.readyQueue.scheduleAction')}
                      </Button>
                    ) : (
                      '—'
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

export default ReadyForEvaluationPanel;
