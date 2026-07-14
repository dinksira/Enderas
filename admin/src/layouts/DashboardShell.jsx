import { useEffect, useLayoutEffect, useState, useCallback } from 'react';
import { NavLink, Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ROUTES } from '../config/routes.js';
import { resolvePageMeta } from '../config/navigation.config.js';
import { useAuth } from '../hooks/use-auth.js';
import { usePermission } from '@enderass/shared/auth';
import { PageSearchProvider, usePageSearch } from '../contexts/PageSearchContext.jsx';
import { notificationService } from '@enderass/shared/services';
import iconSrc from '../assets/images/frontend_logo.svg';
import { NotificationDropdown } from '../components/NotificationDropdown.jsx';
import { KYCStatusBanner } from '../components/KYCStatusBanner.jsx';
import { AdminUnreadNotificationsBanner } from '../components/AdminUnreadNotificationsBanner.jsx';

const PREFERRED_LANGUAGE_KEY = 'preferredLanguage';
const NOTIFICATION_POLL_MS = 15_000;

const ICON_MAP = {
  dashboard: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3" y="3" width="8" height="8" rx="1" stroke="currentColor" strokeWidth="1.8"/>
      <rect x="13" y="3" width="8" height="4" rx="1" stroke="currentColor" strokeWidth="1.8"/>
      <rect x="13" y="10" width="8" height="11" rx="1" stroke="currentColor" strokeWidth="1.8"/>
      <rect x="3" y="14" width="8" height="7" rx="1" stroke="currentColor" strokeWidth="1.8"/>
    </svg>
  ),
  auctions: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M6 21l12-12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
      <path d="M10 21l12-12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
      <path d="M8 19l-4-4 10-10 4 4" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
      <path d="M16 11l-4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  ),
  'asset-request': (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="4" y="2" width="16" height="20" rx="2" stroke="currentColor" strokeWidth="1.8"/>
      <path d="M9 7h6M9 11h6M9 15h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  ),
  assets: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="4" y="2" width="16" height="20" rx="2" stroke="currentColor" strokeWidth="1.8"/>
      <path d="M9 7h6M9 11h6M9 15h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
      <path d="M16 19l2 2 3-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  'my-assets': (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="4" y="2" width="16" height="20" rx="2" stroke="currentColor" strokeWidth="1.8"/>
      <path d="M9 7h6M9 11h6M12 15h3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  ),
  'submit-asset': (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 2v12M7 9l5 5 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M4 16v4h16v-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  ),
  users: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="9" cy="7" r="3" stroke="currentColor" strokeWidth="1.8"/>
      <path d="M3 21c0-4 3-6 6-6s6 2 6 6" stroke="currentColor" strokeWidth="1.8"/>
      <path d="M15 9c2 0 4 1.5 4 4" stroke="currentColor" strokeWidth="1.8"/>
      <path d="M19 21c0-2-1-4-4-4" stroke="currentColor" strokeWidth="1.8"/>
    </svg>
  ),
  staff: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="7" y="2" width="10" height="20" rx="2" stroke="currentColor" strokeWidth="1.8"/>
      <path d="M10 16h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
      <circle cx="12" cy="9" r="2" stroke="currentColor" strokeWidth="1.8"/>
    </svg>
  ),
  roles: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.8"/>
      <path d="M4 21c0-4 3.6-7 8-7s8 3 8 7" stroke="currentColor" strokeWidth="1.8"/>
      <path d="M12 2v2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  ),
  payments: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="2" y="5" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="1.8"/>
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8"/>
      <path d="M2 9h20" stroke="currentColor" strokeWidth="1.8"/>
    </svg>
  ),
  cpo: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 2l9 4v6c0 5-4 9-9 11-5-2-9-6-9-11V6l9-4z" stroke="currentColor" strokeWidth="1.8"/>
      <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  'bid-management': (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M8 12h8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
      <path d="M12 8v8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
      <rect x="3" y="3" width="18" height="18" rx="3" stroke="currentColor" strokeWidth="1.8"/>
    </svg>
  ),
  bids: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M8 12h8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
      <path d="M12 8v8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
      <rect x="3" y="3" width="18" height="18" rx="3" stroke="currentColor" strokeWidth="1.8"/>
      <path d="M17 7l3 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  ),
  'my-bids': (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 18l8-8 4 4 4-6 4 4" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8"/>
    </svg>
  ),
  'my-payments': (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="2" y="5" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="1.8"/>
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8"/>
      <path d="M2 9h20" stroke="currentColor" strokeWidth="1.8"/>
      <path d="M16 5l-8 14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  ),
  'my-cpo': (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 2l9 4v6c0 5-4 9-9 11-5-2-9-6-9-11V6l9-4z" stroke="currentColor" strokeWidth="1.8"/>
      <path d="M10 13l2 2 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M8 9h1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  ),
  'browse-auctions': (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.8"/>
      <path d="M20 20l-3-3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
      <path d="M8 11h6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  ),
  evaluations: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="4" y="2" width="16" height="20" rx="2" stroke="currentColor" strokeWidth="1.8"/>
      <path d="M8 7l3 3 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="17" cy="18" r="3" stroke="currentColor" strokeWidth="1.8"/>
    </svg>
  ),
  documents: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
      <path d="M14 2v6h6M9 15h6M9 11h3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  ),
  winners: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M6 9H4a2 2 0 01-2-2V5a2 2 0 012-2h2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
      <path d="M18 9h2a2 2 0 002-2V5a2 2 0 00-2-2h-2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
      <path d="M12 13v7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
      <path d="M9 20h6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
      <rect x="7" y="6" width="10" height="7" rx="1" stroke="currentColor" strokeWidth="1.8"/>
      <path d="M5 6h14" stroke="currentColor" strokeWidth="1.8"/>
    </svg>
  ),
  'analytics-report': (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 19V5h16v14H4z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
      <path d="M8 12l3-3 2 2 3-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  reports: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 19V5h16v14H4z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
      <path d="M8 14l3-3 2 2 3-3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="17" cy="7" r="1" fill="currentColor"/>
    </svg>
  ),
  organizations: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.8"/>
      <path d="M8 9h8M8 13h6M8 17h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
      <path d="M12 4V2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  ),
  kyc: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 2l9 4v6c0 5.5-4 9.5-9 11-5-1.5-9-5.5-9-11V6l9-4z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
      <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  setting: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8"/>
      <path d="M12 1v2M12 21v2M1 12h2M21 12h2M4 4l1.5 1.5M18.5 18.5L20 20M4 20l1.5-1.5M18.5 5.5L20 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  ),
  settings: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8"/>
      <path d="M12 1v2M12 21v2M1 12h2M21 12h2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
      <path d="M4 4l2 2M18 18l2 2M4 20l2-2M18 6l2-2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  ),
  notifications: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
      <path d="M13.73 21a2 2 0 01-3.46 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  ),
  profile: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.8"/>
      <path d="M4 21c0-4 3.6-7 8-7s8 3 8 7" stroke="currentColor" strokeWidth="1.8"/>
      <path d="M19 3l2 2-4 4h-2l-2-2 4-4h2z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
    </svg>
  ),
  about: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.8"/>
      <path d="M12 16v-4M12 8h.01" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  ),
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
    <span className="dashboard-shell__nav-icon">
      {ICON_MAP[name] || ICON_MAP.dashboard}
    </span>
  );
}

function DashboardShellHeader({
  isAmharic,
  onLanguageChange,
  activeLanguage,
  unreadCount,
  onNotificationsClick,
  darkMode,
  onThemeToggle,
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
          to={ROUTES.APP_DASHBOARD}
          className="dashboard-shell__header-brand"
          aria-label={t('dashboard.brand.name')}
        >
          <img src={iconSrc} alt="" className="dashboard-shell__header-logo" />
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
          className="dashboard-shell__theme-btn"
          aria-label={darkMode ? t('dashboard.a11y.switch_to_light', 'Switch to light mode') : t('dashboard.a11y.switch_to_dark', 'Switch to dark mode')}
          onClick={onThemeToggle}
        >
          {darkMode ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="1.8" />
              <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M21 12.79A9 9 0 0111.21 3 7 7 0 0021 12.79z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
            </svg>
          )}
        </button>
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
  const location = useLocation();
  const { user, clearSession } = useAuth();
  const { navigation, canRead, isAuthenticated } = usePermission();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [darkMode, setDarkMode] = useState(() => {
    try {
      return localStorage.getItem('dashboardTheme') === 'dark';
    } catch {
      return false;
    }
  });
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

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

    function handleVisibilityChange() {
      if (document.visibilityState === 'visible') {
        loadUnreadCount();
      }
    }

    function handleWindowFocus() {
      loadUnreadCount();
    }

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleWindowFocus);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleWindowFocus);
    };
  }, [isAuthenticated, canRead, location.pathname]);

  function handleLanguageChange(code) {
    i18n.changeLanguage(code);

    try {
      localStorage.setItem(PREFERRED_LANGUAGE_KEY, code);
    } catch {
      // Ignore storage access errors.
    }
  }

  function handleThemeToggle() {
    setDarkMode((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('dashboardTheme', next ? 'dark' : 'light');
      } catch {
        // Ignore storage access errors.
      }
      return next;
    });
  }

  function handleLogout() {
    clearSession();
    navigate(ROUTES.HOME, { replace: true });
  }

  function handleNotificationsClick() {
    setNotifDropdownOpen((prev) => !prev);
  }

  function closeNotifDropdown() {
    setNotifDropdownOpen(false);
  }

  function refreshUnreadCount() {
    if (canRead('notifications')) {
      notificationService.getUnreadCount().then((count) => {
        setUnreadCount(Number(count) || 0);
      }).catch(() => {});
    }
  }

  function getNavLabelKey(item) {
    return `dashboard.nav.${item.id.replace(/-/g, '')}`;
  }

  return (
    <div className={`dashboard-shell${isAmharic ? ' dashboard-shell--am' : ''}${isSidebarCollapsed ? ' dashboard-shell--collapsed' : ''}`}>
      <aside className="dashboard-shell__sidebar" aria-label={t('dashboard.a11y.admin_navigation')}>
        <button
          type="button"
          className="dashboard-shell__toggle-btn"
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          aria-label={isSidebarCollapsed ? t('dashboard.a11y.expand_sidebar') : t('dashboard.a11y.collapse_sidebar')}
        >
          <span className="material-symbols-outlined dashboard-shell__toggle-icon" aria-hidden="true">float_landscape_2</span>
        </button>

        <div className="dashboard-shell__brand">
          <img src={iconSrc} alt={t('dashboard.brand.name')} className="dashboard-shell__brand-icon" />
          {!isSidebarCollapsed && (
            <div className="dashboard-shell__brand-text">
              <p className="dashboard-shell__brand-title">{t('dashboard.brand.name')}</p>
              <p className="dashboard-shell__brand-subtitle">{t('dashboard.brand.systemSubtitle')}</p>
            </div>
          )}
        </div>

        <nav className="dashboard-shell__nav" aria-label={t('dashboard.a11y.main_navigation')}>
          {navigation.map((item) => (
            <NavLink
              key={item.id}
              to={item.path}
              className={({ isActive }) =>
                `dashboard-shell__nav-link${isActive ? ' dashboard-shell__nav-link--active' : ''}`
              }
            >
              <NavIcon name={item.id} />
              {!isSidebarCollapsed && <span>{t(getNavLabelKey(item), item.label)}</span>}
              {isSidebarCollapsed && <span className="dashboard-shell__nav-tooltip">{t(getNavLabelKey(item), item.label)}</span>}
            </NavLink>
          ))}
        </nav>

        <div className="dashboard-shell__footer">
          {!isSidebarCollapsed && (
            <div className="dashboard-shell__profile">
              <div className="dashboard-shell__avatar" aria-hidden="true">
                {initials}
              </div>
              <div>
                <p className="dashboard-shell__profile-name">{displayName}</p>
                <p className="dashboard-shell__profile-status">{t('dashboard.profile.full_access')}</p>
              </div>
            </div>
          )}
          <button type="button" className="dashboard-shell__logout" onClick={handleLogout}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M9 6l-6 6 6 6M3 12h14" stroke="currentColor" strokeWidth="1.8" />
            </svg>
            {!isSidebarCollapsed && <span>{t('dashboard.buttons.logout')}</span>}
          </button>
        </div>
      </aside>

      <div className="dashboard-shell__main">
        <PageSearchProvider>
          <DashboardShellHeader
            isAmharic={isAmharic}
            onLanguageChange={handleLanguageChange}
            activeLanguage={activeLanguage}
            unreadCount={unreadCount}
            onNotificationsClick={handleNotificationsClick}
            darkMode={darkMode}
            onThemeToggle={handleThemeToggle}
          />

          <div className="dashboard-shell__content">
            <AdminUnreadNotificationsBanner unreadCount={unreadCount} />
            <KYCStatusBanner />
            <Outlet />
          </div>
        </PageSearchProvider>

        <NotificationDropdown
          open={notifDropdownOpen}
          onClose={closeNotifDropdown}
          onUnreadCountChange={refreshUnreadCount}
        />
      </div>
    </div>
  );
}

export default DashboardShell;
