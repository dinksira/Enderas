import { useCallback, useEffect, useState } from 'react';

import { useIsAuthenticated } from '@/lib/authStore';
import {
  getUnreadNotificationCount,
  listNotifications,
  markAllNotificationsRead as markAllReadApi,
  markNotificationRead as markReadApi,
  type BackendNotification,
} from '@/services/notificationApi';
import type { AppNotification, NotificationKind } from '@/types/notification';

const UNREAD_COUNT_REFRESH_MS = 60_000;

function formatRelativeTimestamp(iso?: string | null): string {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';

  const diffMs = Date.now() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString();
}

function mapNotificationKind(type?: string | null): NotificationKind {
  const normalized = typeof type === 'string' ? type.toLowerCase() : '';
  if (normalized.includes('bid') || normalized.includes('winner') || normalized.includes('outbid')) {
    return 'bid';
  }
  if (normalized.includes('auction')) {
    return 'auction';
  }
  if (normalized.includes('asset') || normalized.includes('ownership')) {
    return 'asset';
  }
  return 'system';
}

function mapNotification(notification: BackendNotification): AppNotification {
  const isRead = notification.status === 'read' || Boolean(notification.readAt);

  return {
    id: notification.id,
    title: typeof notification.title === 'string' ? notification.title : 'Notification',
    body: typeof notification.message === 'string' ? notification.message : '',
    timestamp: formatRelativeTimestamp(notification.sentAt || notification.createdAt),
    read: isRead,
    kind: mapNotificationKind(notification.type),
  };
}

interface UseNotificationsResult {
  notifications: AppNotification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  markNotificationRead: (id: string) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;
}

export function useNotifications(): UseNotificationsResult {
  const isAuthenticated = useIsAuthenticated();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!isAuthenticated) {
      setNotifications([]);
      setUnreadCount(0);
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const [listResult, count] = await Promise.all([
        listNotifications({ limit: 50 }),
        getUnreadNotificationCount(),
      ]);

      setNotifications((listResult.notifications ?? []).map(mapNotification));
      setUnreadCount(count);
    } catch (err) {
      setNotifications([]);
      setUnreadCount(0);
      setError(err instanceof Error ? err.message : 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  const refreshUnreadCount = useCallback(async () => {
    if (!isAuthenticated) {
      setUnreadCount(0);
      return;
    }

    try {
      const count = await getUnreadNotificationCount();
      setUnreadCount(count);
    } catch {
      // Keep the last badge value; the dropdown refresh surfaces full errors.
    }
  }, [isAuthenticated]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void refresh();
    }, 0);

    return () => clearTimeout(timer);
  }, [refresh]);

  useEffect(() => {
    if (!isAuthenticated) return undefined;

    const interval = setInterval(() => {
      void refreshUnreadCount();
    }, UNREAD_COUNT_REFRESH_MS);

    return () => clearInterval(interval);
  }, [isAuthenticated, refreshUnreadCount]);

  const markNotificationRead = useCallback(
    async (id: string) => {
      setNotifications((current) => {
        const wasUnread = current.some((item) => item.id === id && !item.read);
        if (wasUnread) {
          setUnreadCount((count) => Math.max(0, count - 1));
        }
        return current.map((item) => (item.id === id ? { ...item, read: true } : item));
      });

      try {
        await markReadApi(id);
      } catch {
        await refresh();
      }
    },
    [refresh],
  );

  const markAllNotificationsRead = useCallback(async () => {
    setNotifications((current) => current.map((item) => ({ ...item, read: true })));
    setUnreadCount(0);

    try {
      await markAllReadApi();
    } catch {
      await refresh();
    }
  }, [refresh]);

  return {
    notifications,
    unreadCount,
    loading,
    error,
    refresh,
    markNotificationRead,
    markAllNotificationsRead,
  };
}

export default useNotifications;
