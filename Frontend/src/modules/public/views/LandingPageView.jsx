import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ROUTES } from '../../../config/routes.js';
import { PublicHeader } from '../components/PublicHeader.jsx';
import { PublicFooter } from '../components/PublicFooter.jsx';

const STATS = [
  { key: 'activeAuctions', value: '47' },
  { key: 'registeredBidders', value: '12,840' },
  { key: 'totalValue', value: 'ETB 2.4B' },
  { key: 'institutions', value: '186' },
];

const FLOW_STEPS = ['register', 'kyc', 'browse', 'cpo', 'bid'];

const FEATURED_AUCTIONS = [
  {
    id: '1',
    title: 'Commercial Plot — Bole Sub-City',
    category: 'land',
    reserve: 'ETB 18,500,000',
    countdown: '02:14:33:08',
    image: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: '2',
    title: 'Toyota Land Cruiser 300 — 2022',
    category: 'vehicle',
    reserve: 'ETB 4,200,000',
    countdown: '01:06:22:41',
    image: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: '3',
    title: 'Office Block — Kazanchis',
    category: 'building',
    reserve: 'ETB 62,000,000',
    countdown: '04:08:11:55',
    image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: '4',
    title: 'Caterpillar D6R Bulldozer',
    category: 'machinery',
    reserve: 'ETB 3,850,000',
    countdown: '00:18:44:12',
    image: 'https://images.unsplash.com/photo-1581094271901-8022df4466f9?auto=format&fit=crop&w=800&q=80',
  },
];

const CATEGORIES = [
  { key: 'vehicles', image: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=800&q=80' },
  { key: 'land', image: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=800&q=80' },
  { key: 'buildings', image: 'https://images.unsplash.com/photo-1460317442991-0ec209397118?auto=format&fit=crop&w=800&q=80' },
  { key: 'machinery', image: 'https://images.unsplash.com/photo-1581094271901-8022df4466f9?auto=format&fit=crop&w=800&q=80' },
];

const TRUST_ITEMS = ['https', 'audit', 'rbac', 'payments'];

export function LandingPageView() {
  const { t } = useTranslation();

  return (
    <>
      <PublicHeader />

      <section className="pub-hero">
        <div className="pub-hero__inner">
          <div>
            <p className="pub-hero__eyebrow">{t('public.hero.eyebrow')}</p>
            <h1 className="pub-hero__title">{t('public.hero.title')}</h1>
            <p className="pub-hero__lead">{t('public.hero.lead')}</p>
            <div className="pub-hero__cta">
              <Link to={ROUTES.APP_BROWSE_AUCTIONS} className="pub-btn pub-btn--primary">
                {t('public.hero.ctaPrimary')}
              </Link>
              <Link to={`${ROUTES.LOGIN}?tab=register`} className="pub-btn pub-btn--ghost">
                {t('public.hero.ctaSecondary')}
              </Link>
            </div>
          </div>

          <div className="pub-hero__visual" aria-hidden="true">
            <div className="pub-hero__visual-caption">
              <span className="pub-hero__visual-label">{t('public.hero.liveLabel')}</span>
              <span className="pub-hero__visual-value">LOT-2026-0047 · ETB 18.5M</span>
            </div>
          </div>
        </div>
      </section>

      <section className="pub-stats" aria-label={t('public.stats.label')}>
        <div className="pub-stats__grid">
          {STATS.map((stat) => (
            <div key={stat.key} className="pub-stat">
              <p className="pub-stat__value">{stat.value}</p>
              <p className="pub-stat__label">{t(`public.stats.${stat.key}`)}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="how-it-works" className="pub-section">
        <div className="pub-section__inner">
          <div className="pub-section__header">
            <div>
              <h2 className="pub-section__title">{t('public.flow.title')}</h2>
              <p className="pub-section__subtitle">{t('public.flow.subtitle')}</p>
            </div>
          </div>

          <div className="pub-flow">
            {FLOW_STEPS.map((step, index) => (
              <article key={step} className="pub-flow__step">
                <span className="pub-flow__index">{String(index + 1).padStart(2, '0')}</span>
                <h3 className="pub-flow__name">{t(`public.flow.steps.${step}.title`)}</h3>
                <p className="pub-flow__desc">{t(`public.flow.steps.${step}.desc`)}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="featured-auctions" className="pub-section">
        <div className="pub-section__inner">
          <div className="pub-section__header">
            <div>
              <h2 className="pub-section__title">{t('public.auctions.title')}</h2>
              <p className="pub-section__subtitle">{t('public.auctions.subtitle')}</p>
            </div>
            <Link to={ROUTES.APP_BROWSE_AUCTIONS} className="pub-btn pub-btn--text">
              {t('public.auctions.viewAll')}
            </Link>
          </div>

          <div className="pub-auctions">
            {FEATURED_AUCTIONS.map((auction) => (
              <Link
                key={auction.id}
                to={ROUTES.LOGIN}
                className="pub-auction-card"
              >
                <div
                  className="pub-auction-card__media"
                  style={{ backgroundImage: `url('${auction.image}')` }}
                >
                  <span className="pub-auction-card__tag">
                    {t(`public.categories.${auction.category}`)}
                  </span>
                </div>
                <div className="pub-auction-card__body">
                  <h3 className="pub-auction-card__title">{auction.title}</h3>
                  <div className="pub-auction-card__meta">
                    <div>
                      <p className="pub-auction-card__reserve-label">{t('public.auctions.reserve')}</p>
                      <p className="pub-auction-card__reserve">{auction.reserve}</p>
                    </div>
                    <p className="pub-auction-card__countdown">{auction.countdown}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="pub-section">
        <div className="pub-section__inner">
          <div className="pub-section__header">
            <div>
              <h2 className="pub-section__title">{t('public.categories.title')}</h2>
              <p className="pub-section__subtitle">{t('public.categories.subtitle')}</p>
            </div>
          </div>

          <div className="pub-categories">
            {CATEGORIES.map((cat) => (
              <Link
                key={cat.key}
                to={ROUTES.LOGIN}
                className="pub-category"
                style={{ backgroundImage: `url('${cat.image}')` }}
              >
                <span className="pub-category__label">{t(`public.categories.${cat.key}`)}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section id="trust" className="pub-section">
        <div className="pub-section__inner">
          <div className="pub-section__header">
            <div>
              <h2 className="pub-section__title">{t('public.trust.title')}</h2>
              <p className="pub-section__subtitle">{t('public.trust.subtitle')}</p>
            </div>
          </div>

          <div className="pub-trust">
            {TRUST_ITEMS.map((item) => (
              <article key={item} className="pub-trust__item">
                <p className="pub-trust__icon">{t(`public.trust.items.${item}.code`)}</p>
                <h3 className="pub-trust__title">{t(`public.trust.items.${item}.title`)}</h3>
                <p className="pub-trust__desc">{t(`public.trust.items.${item}.desc`)}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <PublicFooter />
    </>
  );
}

export default LandingPageView;
