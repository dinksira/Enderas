import { useEffect, useState, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { notificationService } from '@enderass/shared/services';

const PAGE_SIZE = 20;
const POLL_INTERVAL = 15000;
const EXIT_DURATION = 300;

function formatTimeAgo(dateString) {
  if (!dateString) return '';
  const now = Date.now();
  const date = new Date(dateString).getTime();
  const diffMs = now - date;
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return new Date(dateString).toLocaleDateString();
}

export function NotificationDropdown({ open, onClose, onUnreadCountChange }) {
  const { t } = useTranslation();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [exitingIds, setExitingIds] = useState(new Set());
  const panelRef = useRef(null);

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const response = await notificationService.listNotifications({ limit: PAGE_SIZE });
      const items = response?.notifications ?? [];

      setNotifications((prev) => {
        const prevIds = new Set(prev.map((n) => n.id));
        const hasNewItems = items.some((n) => !prevIds.has(n.id));
        if (!hasNewItems) return prev;
        const merged = [...items];
        for (const existing of prev) {
          if (!prevIds.has(existing.id)) {
            merged.push(existing);
          }
        }
        return merged;
      });
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      loadNotifications();
      const timer = setInterval(loadNotifications, POLL_INTERVAL);
      return () => clearInterval(timer);
    }
    return undefined;
  }, [open, loadNotifications]);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(event) {
      if (panelRef.current && !panelRef.current.contains(event.target)) {
        onClose();
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    function handleEscape(event) {
      if (event.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [open, onClose]);

  function startExit(id) {
    setExitingIds((prev) => new Set([...prev, id]));
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      setExitingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      if (onUnreadCountChange) onUnreadCountChange();
    }, EXIT_DURATION);
  }

  async function handleMarkRead(id) {
    try {
      await notificationService.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, status: 'read' } : n)),
      );
    } catch {
      // silent
    }
  }

  async function handleDismiss(id) {
    try {
      await notificationService.markAsRead(id);
    } catch {
      // silent
    }
    startExit(id);
  }

  async function handleClearAll() {
    try {
      await notificationService.markAllRead();
    } catch {
      // silent
    }
    const allIds = notifications.map((n) => n.id);
    setExitingIds(new Set(allIds));
    setTimeout(() => {
      setNotifications([]);
      setExitingIds(new Set());
      if (onUnreadCountChange) onUnreadCountChange();
    }, EXIT_DURATION);
  }

  const hasUnread = notifications.some((n) => n.status !== 'read');

  if (!open) return null;

  return (
    <div className="notif-overlay" onClick={onClose}>
      <div className="notif-panel" ref={panelRef} onClick={(e) => e.stopPropagation()} role="dialog" aria-label={t('dashboard.a11y.notifications')}>
        <div className="notif-panel__header">
          <h3 className="notif-panel__title">{t('notifications.title', 'Notifications')}</h3>
          {hasUnread && (
            <button
              type="button"
              className="notif-panel__clear-all"
              onClick={handleClearAll}
            >
              {t('notifications.clearAll', 'Clear all')}
            </button>
          )}
        </div>

        <div className="notif-panel__list">
          {loading && notifications.length === 0 && (
            <div className="notif-panel__empty">{t('common.loading', 'Loading...')}</div>
          )}

          {!loading && notifications.length === 0 && (
            <div className="notif-panel__empty">
              {t('notifications.empty', 'No notifications yet')}
            </div>
          )}

          {notifications.map((n, index) => {
            const isUnread = n.status !== 'read';
            const isExiting = exitingIds.has(n.id);
            return (
              <div
                key={n.id}
                className={`notif-card${isUnread ? ' notif-card--unread' : ''}${isExiting ? ' notif-card--exiting' : ''}${!isExiting ? ' notif-card--enter' : ''}`}
                style={{ '--enter-order': index }}
              >
                <div className="notif-card__inner">
                  <button
                    type="button"
                    className="notif-card__dismiss"
                    aria-label={t('common.dismiss', 'Dismiss')}
                    onClick={(e) => { e.stopPropagation(); handleDismiss(n.id); }}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                  <div className="notif-card__body" onClick={() => { if (isUnread) handleMarkRead(n.id); }}>
                    <div className="notif-card__top">
                      <span className="notif-card__title">{n.title || t('notifications.untitled', 'Notification')}</span>
                      <span className="notif-card__time">{formatTimeAgo(n.created_at || n.createdAt)}</span>
                    </div>
                    {n.message && <p className="notif-card__message">{n.message}</p>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default NotificationDropdown;
