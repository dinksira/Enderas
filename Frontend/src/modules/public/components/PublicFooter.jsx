import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ROUTES } from '../../../config/routes.js';
import { PublicLanguageToggle } from './PublicLanguageToggle.jsx';

export function PublicFooter() {
  const { t } = useTranslation();
  const year = new Date().getFullYear();

  return (
    <footer id="footer" className="pub-footer">
      <div className="pub-footer__inner">
        <div className="pub-footer__grid">
          <div>
            <p className="pub-footer__brand">ENDERAS</p>
            <p className="pub-footer__copy">{t('public.footer.about')}</p>
            <div className="pub-footer__partners" aria-label={t('public.footer.partners')}>
              {['NBE', 'CBE', 'COOP', 'NGO'].map((partner) => (
                <span key={partner} className="pub-footer__partner">{partner}</span>
              ))}
            </div>
          </div>

          <div>
            <p className="pub-footer__heading">{t('public.footer.contact')}</p>
            <a className="pub-footer__link" href="mailto:info@enderas.et">info@enderas.et</a>
            <span className="pub-footer__link">+251 11 000 0000</span>
            <span className="pub-footer__link">Addis Ababa, Ethiopia</span>
          </div>

          <div>
            <p className="pub-footer__heading">{t('public.footer.legal')}</p>
            <Link className="pub-footer__link" to={ROUTES.LANDING}>{t('public.footer.privacy')}</Link>
            <Link className="pub-footer__link" to={ROUTES.LANDING}>{t('public.footer.terms')}</Link>
            <Link className="pub-footer__link" to={ROUTES.LANDING}>{t('public.footer.audit')}</Link>
          </div>
        </div>

        <div className="pub-footer__bar">
          <span>© {year} Enderas National PLC</span>
          <PublicLanguageToggle />
        </div>
      </div>
    </footer>
  );
}

export default PublicFooter;
