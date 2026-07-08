import { useTranslation } from 'react-i18next';
import { formatLandingStat } from '../../utils/landing-utils.js';

const STAT_KEYS = [
  { key: 'activeAuctions', field: 'activeAuctions', type: 'count' },
  { key: 'registeredBidders', field: 'registeredBidders', type: 'count' },
  { key: 'totalValue', field: 'totalValue', type: 'totalValue' },
  { key: 'institutions', field: 'institutions', type: 'count' },
];

/**
 * @param {{ stats: object|null, status: 'loading' | 'ready' | 'error' }} props
 */
export function LandingStats({ stats, status }) {
  const { t } = useTranslation();

  return (
    <section className="pub-stats" aria-label={t('public.stats.label')} aria-busy={status === 'loading'}>
      <div className="pub-stats__grid">
        {STAT_KEYS.map(({ key, field, type }) => (
          <div key={key} className="pub-stat">
            {status === 'loading' ? (
              <div className="pub-stat__skeleton" aria-hidden="true" />
            ) : status === 'error' ? (
              <p className="pub-stat__value pub-stat__value--muted">—</p>
            ) : (
              <p className="pub-stat__value">
                {formatLandingStat(
                  stats?.[field],
                  type,
                  stats?.currency ?? 'ETB',
                )}
              </p>
            )}
            <p className="pub-stat__label">{t(`public.stats.${key}`)}</p>
          </div>
        ))}
      </div>
      {status === 'loading' && (
        <p className="visually-hidden">{t('public.stats.loading')}</p>
      )}
      {status === 'error' && (
        <p className="pub-stats__error" role="status">{t('public.stats.unavailable')}</p>
      )}
    </section>
  );
}

export default LandingStats;
