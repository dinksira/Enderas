import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ROUTES } from '../../../../config/routes.js';
import { LiveCountdown } from '@enderass/shared/ui';
import { AuctionCardMedia } from '../AuctionCardMedia.jsx';

/**
 * @param {{ auctions: object[], status: 'loading' | 'ready' | 'error' }} props
 */
export function LandingFeaturedAuctions({ auctions, status }) {
  const { t } = useTranslation();

  return (
    <section id="featured-auctions" className="pub-section">
      <div className="pub-section__inner">
        <div className="pub-section__header">
          <div>
            <h2 className="pub-section__title">{t('public.auctions.title')}</h2>
            <p className="pub-section__subtitle">{t('public.auctions.subtitle')}</p>
          </div>
          <Link
            to={ROUTES.LOGIN}
            state={{ from: ROUTES.APP_BROWSE_AUCTIONS }}
            className="pub-btn pub-btn--text"
          >
            {t('public.auctions.viewAll')}
          </Link>
        </div>

        {status === 'loading' && (
          <div className="pub-auctions pub-auctions--loading" aria-busy="true">
            {Array.from({ length: 4 }, (_, i) => (
              <div key={i} className="pub-auction-card pub-auction-card--skeleton" aria-hidden="true" />
            ))}
            <p className="visually-hidden">{t('public.auctions.loading')}</p>
          </div>
        )}

        {status === 'error' && (
          <p className="pub-empty-state pub-empty-state--error" role="alert">
            {t('public.auctions.error')}
          </p>
        )}

        {status === 'ready' && auctions.length === 0 && (
          <p className="pub-empty-state" role="status">
            {t('public.auctions.empty')}
          </p>
        )}

        {status === 'ready' && auctions.length > 0 && (
          <div className="pub-auctions">
            {auctions.map((auction) => {
              const categoryKey = auction.categoryKey || auction.category;

              return (
                <Link
                  key={auction.id}
                  to={ROUTES.LOGIN}
                  state={{ from: ROUTES.APP_BROWSE_AUCTIONS }}
                  className="pub-auction-card"
                >
                  <AuctionCardMedia
                    auction={auction}
                    tag={(
                      <span className="pub-auction-card__tag">
                        {t(`public.categories.${categoryKey}`, { defaultValue: categoryKey })}
                      </span>
                    )}
                  />
                  <div className="pub-auction-card__body">
                    <h3 className="pub-auction-card__title">{auction.title}</h3>
                    {auction.endingDate && (
                      <p className="pub-auction-card__date">{auction.endingDate}</p>
                    )}
                    <div className="pub-auction-card__meta">
                      <LiveCountdown endDate={auction.endDate} />
                    </div>
                    {typeof auction.bidCount === 'number' && (
                      <p className="pub-auction-card__bids">
                        {t('public.auctions.bidCount', { count: auction.bidCount })}
                      </p>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

export default LandingFeaturedAuctions;
