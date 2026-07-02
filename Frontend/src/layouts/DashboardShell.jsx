import { useEffect, useLayoutEffect, useState } from 'react';
import { NavLink, Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ROUTES } from '../config/routes.js';
import { resolvePageMeta } from '../config/navigation.config.js';
import { useAuth } from '../hooks/use-auth.js';
import { usePermission } from '@enderass/shared/auth';
import { PageSearchProvider, usePageSearch } from '../contexts/PageSearchContext.jsx';
import { notificationService } from '@enderass/shared/services';
import blueLogo from '../assets/blue_logo.svg';
import { Button, ModalCloseButton } from '@enderass/shared/ui';
import { KYCStatusBanner } from '../components/KYCStatusBanner.jsx';

const PREFERRED_LANGUAGE_KEY = 'preferredLanguage';
const NOTIFICATION_POLL_MS = 60_000;

const ICON_MAP = {
  'browse-auctions': (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M3 9.5L12 4l9 5.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M9 21V12h6v9" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M8 8.5h8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  ),
  'my-bids': (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 18V8l4-2 4 2 4-2 4 2v10" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M8 12l3 3 5-6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  'my-payments': (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3" y="6" width="18" height="13" rx="2" stroke="currentColor" strokeWidth="1.6" />
      <path d="M3 10h18" stroke="currentColor" strokeWidth="1.6" />
      <path d="M7 15h4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  ),
  'my-cpo': (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M8 4h8l2 4v12H6V8l2-4z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  'my-assets': (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 20V9l8-5 8 5v11" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M9 20v-6h6v6" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M9 9h6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  ),
  notifications: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 4a4 4 0 00-4 4v2.5L6 14h12l-2-3.5V8a4 4 0 00-4-4z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M10 17a2 2 0 004 0" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  ),
  profile: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.6" />
      <path d="M5 20c0-3.5 3.1-6 7-6s7 2.5 7 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  ),
  dashboard: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="4" y="4" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
      <rect x="13" y="4" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
      <rect x="4" y="13" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
      <rect x="13" y="13" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  ),
};

function resolveLanguage(language) {
  const code = String(language || 'en').split('-')[0].toLowerCase();
  return code === 'am' ? 'am' : 'en';
}

function resolveInitialLanguage(user) {
  const profileLanguage = resolveLanguage(user?.preferredLanguage);
  if (user?.preferredLanguage) {
    return profileLanguage;
  }

  try {
    const stored = localStorage.getItem(PREFERRED_LANGUAGE_KEY);
    if (stored) {
      return resolveLanguage(stored);
    }
  } catch {
    // Ignore storage access errors.
  }

  return 'en';
}

function NavIcon({ name }) {
  return (
    <span className="dashboard-shell__float-icon">
      {ICON_MAP[name] || ICON_MAP.dashboard}
    </span>
  );
}

function SidebarTooltip({ label }) {
  return <span className="dashboard-shell__tooltip">{label}</span>;
}

function LogoutConfirmModal({ open, onClose, onConfirm }) {
  const { t } = useTranslation();

  if (!open) {
    return null;
  }

  return (
    <div className="kyc-modal-overlay" role="presentation" onClick={onClose}>
      <div
        className="kyc-modal dashboard-shell__logout-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="logout-confirm-title"
        onClick={(event) => event.stopPropagation()}
      >
        <ModalCloseButton onClick={onClose} />
        <h2 id="logout-confirm-title" className="kyc-modal__title">
          {t('dashboard.logoutModal.title')}
        </h2>
        <p className="kyc-modal__body">{t('dashboard.logoutModal.message')}</p>
        <div className="kyc-modal__actions">
          <Button type="button" variant="secondary" onClick={onClose}>
            {t('dashboard.logoutModal.cancel')}
          </Button>
          <Button type="button" variant="primary" onClick={onConfirm}>
            {t('dashboard.logoutModal.confirm')}
          </Button>
        </div>
      </div>
    </div>
  );
}

function DashboardShellHeader({
  isAmharic,
  onLanguageChange,
  activeLanguage,
  unreadCount,
  onNotificationsClick,
}) {
  const { t } = useTranslation();
  const location = useLocation();
  const pageMeta = resolvePageMeta(location.pathname);
  const pageSearch = usePageSearch();

  const searchPlaceholder = pageSearch.placeholder || t(pageMeta.searchPlaceholderKey);
  const searchValue = pageSearch.isRegistered ? pageSearch.value : '';
  const searchOnChange = pageSearch.onChange;

  const badgeLabel =
    unreadCount >= 10 ? '9+' : String(unreadCount);

  return (
    <header className="dashboard-shell__header">
      <div className="dashboard-shell__header-start">
        <Link
          to={ROUTES.LANDING}
          className="dashboard-shell__header-brand"
          aria-label={t('dashboard.brand.name')}
        >
          <img src={blueLogo} alt="" className="dashboard-shell__header-logo" />
        </Link>

        <div className="dashboard-shell__header-title-block">
          <h1
            className={`dashboard-shell__page-title${isAmharic ? ' dashboard-shell__page-title--am' : ''}`}
          >
            {t(pageMeta.titleKey)}
          </h1>
          <p className="dashboard-shell__page-subtitle">{t(pageMeta.subtitleKey)}</p>
        </div>
      </div>

      <div className="dashboard-shell__header-center">
        <div className="dashboard-shell__search-wrap">
          <input
            type="search"
            className="dashboard-shell__search-input"
            value={searchValue}
            onChange={(event) => searchOnChange(event.target.value)}
            placeholder={searchPlaceholder}
            aria-label={searchPlaceholder}
          />
          <span className="dashboard-shell__search-icon" aria-hidden="true">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.8" />
              <path d="M20 20l-3-3" stroke="currentColor" strokeWidth="1.8" />
            </svg>
          </span>
        </div>
      </div>

      <div className="dashboard-shell__header-end">
        <div className="dashboard-shell__utilities">
        <div
          className="dashboard-shell__locale-toggle"
          role="group"
          aria-label={t('dashboard.a11y.language_selection')}
        >
          {['en', 'am'].map((code) => (
            <button
              key={code}
              type="button"
              className={[
                'dashboard-shell__locale-btn',
                activeLanguage === code ? 'dashboard-shell__locale-btn--active' : '',
                code === 'am' ? 'dashboard-shell__locale-btn--am' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              onClick={() => onLanguageChange(code)}
              aria-pressed={activeLanguage === code}
            >
              {code}
            </button>
          ))}
        </div>
        <button
          type="button"
          className="dashboard-shell__notify-btn"
          aria-label={t('dashboard.a11y.notifications')}
          onClick={onNotificationsClick}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M12 4a5 5 0 00-5 5v3l-2 2h14l-2-2V9a5 5 0 00-5-5z"
              stroke="currentColor"
              strokeWidth="1.8"
            />
            <path d="M10 20h4" stroke="currentColor" strokeWidth="1.8" />
          </svg>
          {unreadCount > 0 && (
            <span className="dashboard-shell__notify-badge" aria-hidden="true">
              {badgeLabel}
            </span>
          )}
        </button>
        </div>
      </div>
    </header>
  );
}

export function DashboardShell() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { user, clearSession } = useAuth();
  const { navigation, canRead, isAuthenticated } = usePermission();
  const [unreadCount, setUnreadCount] = useState(0);
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);

  const activeLanguage = resolveLanguage(i18n.language);
  const isAmharic = activeLanguage === 'am';

  const displayName = user?.displayName || user?.name || user?.fullName || user?.mobileNumber || t('dashboard.profile.super_admin');
  const initials = displayName
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  useLayoutEffect(() => {
    const initialLanguage = resolveInitialLanguage(user);
    if (resolveLanguage(i18n.language) !== initialLanguage) {
      i18n.changeLanguage(initialLanguage);
    }

    try {
      localStorage.setItem(PREFERRED_LANGUAGE_KEY, initialLanguage);
    } catch {
      // Ignore storage access errors.
    }
  }, [user, i18n]);

  useEffect(() => {
    if (!isAuthenticated || !canRead('notifications')) {
      setUnreadCount(0);
      return undefined;
    }

    let cancelled = false;

    async function loadUnreadCount() {
      try {
        const count = await notificationService.getUnreadCount();
        if (!cancelled) {
          setUnreadCount(Number(count) || 0);
        }
      } catch {
        if (!cancelled) {
          setUnreadCount(0);
        }
      }
    }

    loadUnreadCount();
    const intervalId = window.setInterval(loadUnreadCount, NOTIFICATION_POLL_MS);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [isAuthenticated, canRead]);

  function handleLanguageChange(code) {
    i18n.changeLanguage(code);

    try {
      localStorage.setItem(PREFERRED_LANGUAGE_KEY, code);
    } catch {
      // Ignore storage access errors.
    }
  }

  function handleLogoutRequest() {
    setLogoutModalOpen(true);
  }

  function handleLogoutCancel() {
    setLogoutModalOpen(false);
  }

  function handleLogoutConfirm() {
    setLogoutModalOpen(false);
    clearSession();
    navigate(ROUTES.HOME, { replace: true });
  }

  function handleNotificationsClick() {
    navigate(ROUTES.APP_NOTIFICATIONS);
  }

  function getNavLabelKey(item) {
    return `dashboard.nav.${item.id.replace(/-/g, '')}`;
  }

  return (
    <div
      className={[
        'dashboard-shell',
        isAmharic ? 'dashboard-shell--am' : '',
        'dashboard-shell--float-nav',
      ].filter(Boolean).join(' ')}
    >
      <nav className="dashboard-shell__float-dock" aria-label={t('dashboard.a11y.main_navigation')}>
        <div className="dashboard-shell__float-nav-list">
          {navigation.map((item) => {
            const navLabel = t(getNavLabelKey(item), item.label);
            return (
              <NavLink
                key={item.id}
                to={item.path}
                className={({ isActive }) =>
                  `dashboard-shell__float-btn${isActive ? ' dashboard-shell__float-btn--active' : ''}`
                }
                aria-label={navLabel}
              >
                <NavIcon name={item.id} />
                <SidebarTooltip label={navLabel} />
              </NavLink>
            );
          })}
        </div>

        <div className="dashboard-shell__float-dock-bottom">
          <div className="dashboard-shell__float-account">
            <Link
              to={ROUTES.APP_PROFILE}
              className="dashboard-shell__float-btn dashboard-shell__float-btn--account"
              aria-label={displayName}
            >
              <span className="dashboard-shell__float-avatar" aria-hidden="true">{initials}</span>
              <SidebarTooltip label={displayName} />
            </Link>

            <span className="dashboard-shell__float-account-divider" aria-hidden="true" />

            <button
              type="button"
              className="dashboard-shell__float-btn dashboard-shell__float-btn--account dashboard-shell__float-btn--logout"
              onClick={handleLogoutRequest}
              aria-label={t('dashboard.buttons.logout')}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M10 7V6a2 2 0 012-2h6v16h-6a2 2 0 01-2-2v-1" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
                <path d="M14 12H4m0 0l3-3M4 12l3 3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <SidebarTooltip label={t('dashboard.buttons.logout')} />
            </button>
          </div>
        </div>
      </nav>

      <div className="dashboard-shell__main dashboard-shell__main--full">
        <PageSearchProvider>
          <DashboardShellHeader
            isAmharic={isAmharic}
            onLanguageChange={handleLanguageChange}
            activeLanguage={activeLanguage}
            unreadCount={unreadCount}
            onNotificationsClick={handleNotificationsClick}
          />

          <div className="dashboard-shell__content">
            <KYCStatusBanner />
            <Outlet />
          </div>
        </PageSearchProvider>
      </div>

      <LogoutConfirmModal
        open={logoutModalOpen}
        onClose={handleLogoutCancel}
        onConfirm={handleLogoutConfirm}
      />
    </div>
  );
}

export default DashboardShell;
