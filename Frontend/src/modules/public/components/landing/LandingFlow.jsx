import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ROUTES } from '../../../../config/routes.js';
import { FLOW_STEPS } from '../../utils/landing-utils.js';

export function LandingForSellers() {
  const { t } = useTranslation();

  return (
    <section id="for-sellers" className="pub-band pub-band--seller" aria-labelledby="for-sellers-title">
      <div className="pub-band__inner">
        <div>
          <h2 id="for-sellers-title" className="pub-band__title">
            {t('public.forSellers.title')}
          </h2>
          <p className="pub-band__body">{t('public.forSellers.body')}</p>
        </div>
        <Link
          to={`${ROUTES.LOGIN}?tab=register`}
          state={{ from: `${ROUTES.APP_MY_ASSETS}?new=1` }}
          className="pub-btn pub-btn--ghost pub-band__cta"
        >
          {t('public.forSellers.cta')}
        </Link>
      </div>
    </section>
  );
}

export function LandingFlow() {
  const { t } = useTranslation();

  return (
    <section id="how-it-works" className="pub-section">
      <div className="pub-section__inner">
        <div className="pub-section__header">
          <div>
            <h2 className="pub-section__title">{t('public.flow.title')}</h2>
            <p className="pub-section__subtitle">{t('public.flow.subtitle')}</p>
          </div>
        </div>

        <ol className="pub-flow">
          {FLOW_STEPS.map((step, index) => (
            <li key={step} className="pub-flow__step">
              <span className="pub-flow__index">{String(index + 1).padStart(2, '0')}</span>
              <h3 className="pub-flow__name">{t(`public.flow.steps.${step}.title`)}</h3>
              <p className="pub-flow__desc">{t(`public.flow.steps.${step}.desc`)}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

export default LandingFlow;
