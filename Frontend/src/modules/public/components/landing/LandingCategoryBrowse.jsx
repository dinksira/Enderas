import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ROUTES } from '../../../../config/routes.js';
import { CATEGORY_GLYPHS } from '../../utils/landing-utils.js';

/**
 * @param {{
 *   categories: Array<{ key: string, activeCount: number }>,
 *   status: 'loading' | 'ready' | 'error',
 * }} props
 */
export function LandingCategoryBrowse({ categories = [], status }) {
  const { t } = useTranslation();

  return (
    <section id="browse-categories" className="pub-section pub-section--categories">
      <div className="pub-section__inner">
        <div className="pub-section__header">
          <div>
            <h2 className="pub-section__title">{t('public.categories.title')}</h2>
            <p className="pub-section__subtitle">{t('public.categories.subtitle')}</p>
          </div>
        </div>

        {status === 'loading' && (
          <div className="pub-categories pub-categories--loading" aria-busy="true">
            {Array.from({ length: 4 }, (_, i) => (
              <div key={i} className="pub-category pub-category--skeleton" aria-hidden="true" />
            ))}
          </div>
        )}

        {status !== 'loading' && categories.length === 0 && (
          <p className="pub-empty-state" role="status">
            {t('public.categories.empty')}
          </p>
        )}

        {status !== 'loading' && categories.length > 0 && (
          <div className="pub-categories" role="list">
            {categories.map((cat) => (
              <Link
                key={cat.key}
                to={ROUTES.LOGIN}
                state={{ from: `${ROUTES.APP_BROWSE_AUCTIONS}?category=${cat.key}` }}
                className={`pub-category pub-category--${cat.key}`}
                role="listitem"
                aria-label={t('public.categories.filterHint', {
                  category: t(`public.categories.${cat.key}`, { defaultValue: cat.key }),
                })}
              >
                <span className="pub-category__glyph" aria-hidden="true">
                  {CATEGORY_GLYPHS[cat.key] ?? '◆'}
                </span>
                <span className="pub-category__label">
                  {t(`public.categories.${cat.key}`, { defaultValue: cat.key })}
                </span>
                <span className="pub-category__count">
                  {t('public.categories.activeCount', { count: cat.activeCount })}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export default LandingCategoryBrowse;
