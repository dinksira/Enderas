import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ROUTES } from '../../../../config/routes.js';
import { LotSeal } from '../LotSeal.jsx';
import { LiveCountdown } from '@enderass/shared/ui';
import { AuctionCardMedia } from '../AuctionCardMedia.jsx';

/**
 * @param {{ heroLot?: object|null, status: 'loading' | 'ready' | 'error' }} props
 */
export function LandingHero({ heroLot = null, status }) {
  const { t } = useTranslation();
  const isLoading = status === 'loading';

  return (
    <section className="pub-hero" aria-labelledby="landing-hero-title">
      <div className="pub-hero__inner">
        <div className="pub-hero__copy">
          <p className="pub-hero__eyebrow">{t('public.hero.eyebrow')}</p>
          <h1 id="landing-hero-title" className="pub-hero__title">
            {t('public.hero.title')}
          </h1>
          <p className="pub-hero__lead">{t('public.hero.lead')}</p>

          <div className="pub-hero__cta">
            <Link to={ROUTES.LOGIN} state={{ from: ROUTES.APP_BROWSE_AUCTIONS }} className="pub-btn pub-btn--primary">
              {t('public.hero.ctaPrimary')}
            </Link>
            <a href="#how-it-works" className="pub-btn pub-btn--ghost">
              {t('public.hero.ctaSecondary')}
            </a>
          </div>

          <p className="pub-hero__seller">
            {t('public.hero.sellerPrompt')}{' '}
            <a href="#for-sellers" className="pub-hero__seller-link">
              {t('public.hero.sellerLink')}
            </a>
          </p>
        </div>

        <div className="pub-hero__visual" aria-busy={isLoading}>
          <div className="pub-hero__visual-frame">
            <LotSeal className="pub-hero__seal" label={t('public.trust.items.payments.title')} />
            {isLoading && (
              <div className="pub-hero__lot-card pub-hero__lot-card--skeleton" aria-hidden="true" />
            )}
            {!isLoading && heroLot && (
              <div className="pub-hero__lot-card">
                <AuctionCardMedia
                  auction={heroLot}
                  className="pub-hero__lot-media"
                  imageClassName="pub-hero__lot-image"
                />
                <span className="pub-hero__visual-label">{t('public.hero.liveLabel')}</span>
                <p className="pub-hero__lot-title">{heroLot.title}</p>
                <LiveCountdown
                  endDate={heroLot.endDate}
                  className="pub-hero__countdown"
                  label={t('public.auctions.countdownLabel')}
                />
              </div>
            )}
            {!isLoading && !heroLot && (
              <div className="pub-hero__lot-card pub-hero__lot-card--placeholder">
                <span className="pub-hero__visual-label">{t('public.hero.liveLabel')}</span>
                <p className="pub-hero__lot-title">{t('public.auctions.empty')}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

export default LandingHero;
