import { useTranslation } from 'react-i18next';
import whiteLogo from '../../../assets/white_logo.svg';

const SYSTEM_INFO = {
  version: '1.0.0',
  environment: import.meta.env.MODE || 'development',
  buildDate: new Date().toISOString().split('T')[0],
};

export function AboutView() {
  const { t } = useTranslation();

  return (
    <section className="about-view">
      <div className="about-card">
        <div className="about-card__header">
          <img src={whiteLogo} alt="Enderas" className="about-card__logo-img" />
          <h1 className="about-card__title">{t('about.title')}</h1>
          <p className="about-card__subtitle">{t('about.subtitle')}</p>
        </div>

        <div className="about-card__section">
          <h3 className="about-card__section-title">{t('about.systemInfo')}</h3>
          <dl className="about-card__list">
            <div className="about-card__list-item">
              <dt>{t('about.version')}</dt>
              <dd>{SYSTEM_INFO.version}</dd>
            </div>
            <div className="about-card__list-item">
              <dt>{t('about.environment')}</dt>
              <dd>
                <span className={`about-card__badge about-card__badge--${SYSTEM_INFO.environment === 'production' ? 'success' : 'warning'}`}>
                  {SYSTEM_INFO.environment}
                </span>
              </dd>
            </div>
            <div className="about-card__list-item">
              <dt>{t('about.buildDate')}</dt>
              <dd>{SYSTEM_INFO.buildDate}</dd>
            </div>
          </dl>
        </div>

        <div className="about-card__section">
          <h3 className="about-card__section-title">{t('about.aboutEnderas')}</h3>
          <p className="about-card__text">{t('about.description')}</p>
        </div>

        <div className="about-card__section">
          <h3 className="about-card__section-title">{t('about.features')}</h3>
          <ul className="about-card__features">
            <li>{t('about.feature1')}</li>
            <li>{t('about.feature2')}</li>
            <li>{t('about.feature3')}</li>
            <li>{t('about.feature4')}</li>
            <li>{t('about.feature5')}</li>
          </ul>
        </div>

        <div className="about-card__footer">
          <p className="about-card__copyright">&copy; {new Date().getFullYear()} Enderas. {t('about.rights')}</p>
        </div>
      </div>
    </section>
  );
}

export default AboutView;
