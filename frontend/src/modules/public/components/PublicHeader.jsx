import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ROUTES } from '../../../config/routes.js';
import { PublicLanguageToggle } from './PublicLanguageToggle.jsx';
import whiteLogo from '../../../assets/white_logo.svg';

const NAV_ITEMS = [
  { key: 'auctions', href: '#featured-auctions' },
  { key: 'howItWorks', href: '#how-it-works' },
  { key: 'getApp', href: '#get-app' },
  { key: 'about', href: '#trust' },
  { key: 'contact', href: '#footer' },
];

export function PublicHeader() {
  const { t } = useTranslation();
  const location = useLocation();
  const onLanding = location.pathname === ROUTES.LANDING;
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname, location.hash]);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  useEffect(() => {
    if (!onLanding) {
      return undefined;
    }

    const onScroll = () => {
      setScrolled(window.scrollY > 8);
    };

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [onLanding]);

  const closeMenu = () => setMenuOpen(false);

  return (
    <header className={`pub-header${scrolled ? ' pub-header--scrolled' : ''}`}>
      <div className="pub-header__inner">
        <Link to={ROUTES.LANDING} className="pub-header__brand" onClick={closeMenu}>
          <img
            src={whiteLogo}
            alt="Enderas"
            className="pub-header__logo"
          />
        </Link>

        {onLanding && (
          <nav className="pub-header__nav" aria-label={t('public.nav.label')}>
            {NAV_ITEMS.map((item) => (
              <a key={item.key} href={item.href} className="pub-header__link">
                {t(`public.nav.${item.key}`)}
              </a>
            ))}
          </nav>
        )}

        <div className="pub-header__actions">
          <PublicLanguageToggle className="pub-header__lang" />
          <Link to={ROUTES.LOGIN} className="pub-btn pub-btn--ghost pub-header__login">
            {t('public.header.login')}
          </Link>
          <Link to={`${ROUTES.LOGIN}?tab=register`} className="pub-btn pub-btn--primary pub-header__register">
            {t('public.header.register')}
          </Link>

          {onLanding && (
            <button
              type="button"
              className="pub-header__menu-btn"
              aria-expanded={menuOpen}
              aria-controls="pub-mobile-nav"
              onClick={() => setMenuOpen((open) => !open)}
            >
              <span className="pub-header__menu-icon" aria-hidden="true" />
              <span className="visually-hidden">{menuOpen ? 'Close menu' : 'Open menu'}</span>
            </button>
          )}
        </div>
      </div>

      {onLanding && menuOpen && (
        <>
          <div
            id="pub-mobile-nav"
            className="pub-header__mobile-nav pub-header__mobile-nav--open"
          >
            <nav className="pub-header__mobile-links" aria-label={t('public.nav.label')}>
              {NAV_ITEMS.map((item) => (
                <a
                  key={item.key}
                  href={item.href}
                  className="pub-header__mobile-link"
                  onClick={closeMenu}
                >
                  {t(`public.nav.${item.key}`)}
                </a>
              ))}
            </nav>
            <div className="pub-header__mobile-cta">
              <Link to={ROUTES.LOGIN} className="pub-btn pub-btn--ghost" onClick={closeMenu}>
                {t('public.header.login')}
              </Link>
              <Link
                to={`${ROUTES.LOGIN}?tab=register`}
                className="pub-btn pub-btn--primary"
                onClick={closeMenu}
              >
                {t('public.header.register')}
              </Link>
            </div>
          </div>
          <button
            type="button"
            className="pub-header__backdrop"
            aria-label="Close menu"
            onClick={closeMenu}
          />
        </>
      )}
    </header>
  );
}

export default PublicHeader;
