import { useEffect, useLayoutEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ROUTES } from '../config/routes.js';
import { resolvePageMeta } from '../config/navigation.config.js';
import { useAuth } from '../hooks/use-auth.js';
import { usePermission } from '../core/auth/usePermission.js';
import { PageSearchProvider, usePageSearch } from '../contexts/PageSearchContext.jsx';
import { notificationService } from '../modules/notifications/services/notification-service.js';
import iconSrc from '../assets/images/enderas_icon.svg';
import { KYCStatusBanner } from '../components/KYCStatusBanner.jsx';

const PREFERRED_LANGUAGE_KEY = 'preferredLanguage';
const NOTIFICATION_POLL_MS = 60_000;

const ICON_MAP = {
  dashboard: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 7h16M6 7v12h12V7M9 11h6M9 15h4" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  ),
  auctions: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 7h16M6 7v12h12V7M9 11h6M9 15h4" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  ),
  'asset-request': (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5 19h14V9l-7-5-7 5v10z" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  ),
  assets: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5 19h14V9l-7-5-7 5v10z" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  ),
  'my-assets': (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5 19h14V9l-7-5-7 5v10z" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  ),
  'submit-asset': (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5 19h14V9l-7-5-7 5v10z" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  ),
  users: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="9" cy="8" r="3" stroke="currentColor" strokeWidth="1.8" />
      <path d="M4 19c0-3 2.5-5 5-5s5 2 5 5" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="17" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.8" />
      <path d="M15 19c.3-2 1.8-3.5 4-3.5" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  ),
  staff: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 3l7 4v10l-7 4-7-4V7l7-4z" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  ),
  roles: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 3l7 4v10l-7 4-7-4V7l7-4z" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  ),
  payments: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3" y="6" width="18" height="12" stroke="currentColor" strokeWidth="1.8" />
      <path d="M3 10h18" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  ),
  cpo: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M6 4h12v16H6zM9 8h6M9 12h6M9 16h4" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  ),
  'bid-management': (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 18l8-8 4 4 4-6 4 4" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  ),
  bids: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 18l8-8 4 4 4-6 4 4" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  ),
  'my-bids': (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 18l8-8 4 4 4-6 4 4" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  ),
  'my-payments': (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3" y="6" width="18" height="12" stroke="currentColor" strokeWidth="1.8" />
      <path d="M3 10h18" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  ),
  'my-cpo': (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M6 4h12v16H6zM9 8h6M9 12h6M9 16h4" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  ),
  'browse-auctions': (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 7h16M6 7v12h12V7M9 11h6M9 15h4" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  ),
  evaluations: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M9 11l3 3L22 4" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  ),
  documents: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M6 4h12v16H6zM9 8h6M9 12h6M9 16h4" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  ),
  winners: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 18l8-8 4 4 4-6 4 4" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  ),
  'analytics-report': (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5 19V9M12 19V5M19 19v-7" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  ),
  reports: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5 19V9M12 19V5M19 19v-7" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  ),
  kyc: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 1l9 5v12l-9 5-9-5V6l9-5z" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  ),
  setting: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M12 3v2M12 19v2M3 12h2M19 12h2M5 5l1.5 1.5M17.5 17.5L19 19M5 19l1.5-1.5M17.5 6.5L19 5"
        stroke="currentColor"
        strokeWidth="1.8"
      />
    </svg>
  ),
  settings: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M12 3v2M12 19v2M3 12h2M19 12h2M5 5l1.5 1.5M17.5 17.5L19 19M5 19l1.5-1.5M17.5 6.5L19 5"
        stroke="currentColor"
        strokeWidth="1.8"
      />
    </svg>
  ),
  notifications: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 4a5 5 0 00-5 5v3l-2 2h14l-2-2V9a5 5 0 00-5-5z"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path d="M10 20h4" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  ),
  profile: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.8" />
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="currentColor" strokeWidth="1.8" />
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
}) {
  const { t } = useTranslation();
  const location = useLocation();
  const pageMeta = resolvePageMeta(location.pathname);
  const pageSearch = usePageSearch();

  const showSearch = pageSearch.isRegistered
    ? pageSearch.enabled
    : pageMeta.searchEnabled;

  const searchPlaceholder = pageSearch.placeholder || t(pageMeta.searchPlaceholderKey);
  const searchValue = pageSearch.isRegistered ? pageSearch.value : '';
  const searchOnChange = pageSearch.onChange;

  const badgeLabel =
    unreadCount >= 10 ? '9+' : String(unreadCount);

  return (
    <header className="dashboard-shell__header">
      <div className="dashboard-shell__header-title-block">
        <h1
          className={`dashboard-shell__page-title${isAmharic ? ' dashboard-shell__page-title--am' : ''}`}
        >
          {t(pageMeta.titleKey)}
        </h1>
        <p className="dashboard-shell__page-subtitle">{t(pageMeta.subtitleKey)}</p>
      </div>

      {showSearch && (
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
      )}

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
    </header>
  );
}

export function DashboardShell() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { user, clearSession } = useAuth();
  const { navigation, canRead, isAuthenticated } = usePermission();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

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

  function handleLogout() {
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
    <div className={`dashboard-shell${isAmharic ? ' dashboard-shell--am' : ''}${isSidebarCollapsed ? ' dashboard-shell--collapsed' : ''}`}>
      <aside className="dashboard-shell__sidebar" aria-label={t('dashboard.a11y.admin_navigation')}>
        <button
          type="button"
          className="dashboard-shell__toggle-btn"
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          aria-label={isSidebarCollapsed ? t('dashboard.a11y.expand_sidebar') : t('dashboard.a11y.collapse_sidebar')}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
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
              title={t(getNavLabelKey(item), item.label)}
            >
              <NavIcon name={item.id} />
              {!isSidebarCollapsed && <span>{t(getNavLabelKey(item), item.label)}</span>}
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
          />

          <div className="dashboard-shell__content">
            <KYCStatusBanner />
            <Outlet />
          </div>
        </PageSearchProvider>
      </div>
    </div>
  );
}

export default DashboardShell;
