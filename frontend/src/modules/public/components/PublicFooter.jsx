import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ROUTES } from '../../../config/routes.js';
import { formatLandingStat } from '../utils/landing-utils.js';

/**
 * @param {{
 *   contact?: { email?: string, phone?: string, address?: string } | null,
 *   stats?: object | null,
 *   categories?: Array<{ key: string, activeCount: number }>,
 * }} props
 */
export function PublicFooter({ contact, stats, categories = [] }) {
  const { t } = useTranslation();
  const year = new Date().getFullYear();
  const currency = stats?.currency ?? 'ETB';

  return (
    <footer id="footer" className="pub-footer">
      <div className="pub-footer__inner">
        <div className="pub-footer__grid">
          <div>
            <p className="pub-footer__brand">ENDERAS</p>
            <p className="pub-footer__copy">{t('public.footer.about')}</p>

            {stats && (
              <div className="pub-footer__snapshot" aria-label={t('public.stats.label')}>
                <div className="pub-footer__snapshot-item">
                  <span className="pub-footer__snapshot-value">
                    {formatLandingStat(stats.activeAuctions, 'count')}
                  </span>
                  <span className="pub-footer__snapshot-label">{t('public.stats.activeAuctions')}</span>
                </div>
                <div className="pub-footer__snapshot-item">
                  <span className="pub-footer__snapshot-value">
                    {formatLandingStat(stats.registeredBidders, 'count')}
                  </span>
                  <span className="pub-footer__snapshot-label">{t('public.stats.registeredBidders')}</span>
                </div>
                <div className="pub-footer__snapshot-item">
                  <span className="pub-footer__snapshot-value">
                    {formatLandingStat(stats.totalValue, 'totalValue', currency)}
                  </span>
                  <span className="pub-footer__snapshot-label">{t('public.stats.totalValue')}</span>
                </div>
                <div className="pub-footer__snapshot-item">
                  <span className="pub-footer__snapshot-value">
                    {formatLandingStat(stats.institutions, 'count')}
                  </span>
                  <span className="pub-footer__snapshot-label">{t('public.stats.institutions')}</span>
                </div>
              </div>
            )}

            {categories.length > 0 && (
              <>
                <p className="pub-footer__partners-heading">{t('public.footer.liveCategories')}</p>
                <div className="pub-footer__partners" role="list">
                  {categories.map((cat) => (
                    <div key={cat.key} className="pub-footer__partner" role="listitem">
                      <span className="pub-footer__partner-code">{cat.activeCount}</span>
                      <span className="pub-footer__partner-label">
                        {t(`public.categories.${cat.key}`, { defaultValue: cat.key })}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          <div>
            <p className="pub-footer__heading">{t('public.footer.contact')}</p>
            {contact?.email && (
              <a className="pub-footer__link" href={`mailto:${contact.email}`}>{contact.email}</a>
            )}
            {contact?.phone && (
              <a className="pub-footer__link" href={`tel:${contact.phone.replace(/\s/g, '')}`}>
                {contact.phone}
              </a>
            )}
            {contact?.address && (
              <span className="pub-footer__link">{contact.address}</span>
            )}
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
        </div>
      </div>
    </footer>
  );
}

export default PublicFooter;
