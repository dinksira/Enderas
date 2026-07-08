import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { APP_LINKS } from '../config/app-links.js';
import { ROUTES } from '../config/routes.js';

const APP_FEATURES = Object.freeze(['browse', 'bids', 'notify']);

function AppleIcon() {
  return (
    <svg className="pub-get-app__badge-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M16.365 1.43c0 1.14-.493 2.219-1.283 3.034-.81.84-2.142 1.49-3.332 1.399-.15-1.108.48-2.279 1.258-3.064.84-.87 2.303-1.508 3.357-1.37zM20.64 17.18c-.66 1.52-1.44 2.98-2.57 4.34-1.01 1.2-2.19 2.54-3.77 2.56-1.44.02-1.81-.84-3.38-.84-1.57 0-1.93.82-3.35.86-1.6.04-2.82-1.28-3.83-2.48-2.08-2.54-3.67-7.18-1.54-10.32 1.05-1.52 2.93-2.48 4.97-2.5 1.55-.03 3.01 1.04 3.95 1.04.93 0 2.68-1.28 4.52-1.09.77.03 2.94.31 4.33 2.33-.11.07-2.59 1.51-2.56 4.5.03 3.58 3.13 4.76 3.17 4.78-.03.08-.5 1.7-1.64 3.36z"
      />
    </svg>
  );
}

function PlayIcon() {
  return (
    <svg className="pub-get-app__badge-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#34A853" d="M3 20.5V3.5C3 2.91 3.34 2.39 3.84 2.15L13.69 12L3.84 21.85C3.34 21.61 3 21.09 3 20.5Z" />
      <path fill="#FBBC04" d="M16.81 15.12L6.05 21.34L14.54 12.85L16.81 15.12Z" />
      <path fill="#4285F4" d="M20.16 10.81C20.5 11.08 20.75 11.5 20.75 12C20.75 12.5 20.5 12.92 20.16 13.19L17.89 14.5L15.39 12L17.89 9.5L20.16 10.81Z" />
      <path fill="#EA4335" d="M6.05 2.66L16.81 8.88L14.54 11.15L6.05 2.66Z" />
    </svg>
  );
}

/**
 * @param {{
 *   platform: 'ios' | 'android',
 *   href: string,
 *   label: string,
 *   sublabel: string,
 *   ariaLabel: string,
 * }} props
 */
function StoreBadge({ platform, href, label, sublabel, ariaLabel }) {
  return (
    <a
      href={href}
      className="pub-get-app__badge"
      target="_blank"
      rel="noopener noreferrer"
      aria-label={ariaLabel}
    >
      {platform === 'ios' ? <AppleIcon /> : <PlayIcon />}
      <span className="pub-get-app__badge-text">
        <span className="pub-get-app__badge-sublabel">{sublabel}</span>
        <span className="pub-get-app__badge-label">{label}</span>
      </span>
    </a>
  );
}

/**
 * "Get the app" section with App Store and Google Play download badges.
 * @param {{ className?: string }} props
 */
export function GetAppSection({ className = '' }) {
  const { t } = useTranslation();

  return (
    <section
      id="get-app"
      className={['pub-section pub-get-app', className].filter(Boolean).join(' ')}
      aria-labelledby="get-app-title"
    >
      <div className="pub-section__inner pub-get-app__inner">
        <div className="pub-get-app__content">
          <p className="pub-get-app__eyebrow">{t('public.getApp.eyebrow')}</p>
          <h2 id="get-app-title" className="pub-section__title pub-get-app__title">
            {t('public.getApp.title')}
          </h2>
          <p className="pub-section__subtitle">{t('public.getApp.subtitle')}</p>

          <ul className="pub-get-app__features">
            {APP_FEATURES.map((key) => (
              <li key={key}>{t(`public.getApp.features.${key}`)}</li>
            ))}
          </ul>

          <p className="pub-get-app__download-heading">{t('public.getApp.downloadHeading')}</p>
          <div className="pub-get-app__stores">
            {APP_LINKS.ios && (
              <StoreBadge
                platform="ios"
                href={APP_LINKS.ios}
                sublabel={t('public.getApp.appStoreSublabel')}
                label={t('public.getApp.appStore')}
                ariaLabel={t('public.getApp.appStoreAria')}
              />
            )}
            {APP_LINKS.android && (
              <StoreBadge
                platform="android"
                href={APP_LINKS.android}
                sublabel={t('public.getApp.playStoreSublabel')}
                label={t('public.getApp.playStore')}
                ariaLabel={t('public.getApp.playStoreAria')}
              />
            )}
          </div>

          <Link
            to={ROUTES.LOGIN}
            state={{ from: ROUTES.APP_BROWSE_AUCTIONS }}
            className="pub-btn pub-btn--ghost pub-get-app__web-cta"
          >
            {t('public.getApp.webCta')}
          </Link>
        </div>
      </div>
    </section>
  );
}

export default GetAppSection;
