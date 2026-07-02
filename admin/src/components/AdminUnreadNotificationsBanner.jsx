import { useTranslation } from 'react-i18next';
import { useNavigate, useLocation } from 'react-router-dom';
import { ROUTES } from '../config/routes.js';

/**
 * Prominent banner when the signed-in admin has unread in-app notifications.
 * @param {{ unreadCount: number }} props
 */
export function AdminUnreadNotificationsBanner({ unreadCount }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  if (!unreadCount || unreadCount <= 0 || location.pathname === ROUTES.APP_NOTIFICATIONS) {
    return null;
  }

  const label = unreadCount === 1
    ? t('notifications.banner.unreadOne')
    : t('notifications.banner.unreadMany', { count: unreadCount });

  return (
    <div className="admin-notify-banner" role="status">
      <div className="admin-notify-banner__copy">
        <span className="admin-notify-banner__icon" aria-hidden="true">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 4a5 5 0 00-5 5v3l-2 2h14l-2-2V9a5 5 0 00-5-5z"
              stroke="currentColor"
              strokeWidth="1.8"
            />
            <path d="M10 20h4" stroke="currentColor" strokeWidth="1.8" />
          </svg>
        </span>
        <p className="admin-notify-banner__message">{label}</p>
      </div>
      <button
        type="button"
        className="admin-notify-banner__action"
        onClick={() => navigate(ROUTES.APP_NOTIFICATIONS)}
      >
        {t('notifications.banner.viewAll')}
      </button>
    </div>
  );
}

export default AdminUnreadNotificationsBanner;
