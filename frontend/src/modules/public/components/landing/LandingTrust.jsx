import { useTranslation } from 'react-i18next';
import { LotSeal } from '../LotSeal.jsx';
import { TRUST_ITEMS } from '../../utils/landing-utils.js';

export function LandingTrust() {
  const { t } = useTranslation();

  return (
    <section id="trust" className="pub-section pub-section--trust">
      <div className="pub-section__inner">
        <div className="pub-section__header pub-section__header--trust">
          <LotSeal className="pub-trust__seal" label={t('public.trust.title')} />
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
  );
}

export default LandingTrust;
