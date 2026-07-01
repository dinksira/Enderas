import { ENV } from '@/lib/env';
import { api } from '@/services/api';

const NOTIFICATIONS_BASE = `${ENV.apiV1Prefix}/notifications`;

export interface BackendNotification {
  id: string;
  userId?: string;
  type: string;
  title: string;
  message: string;
  channel?: string;
  status: string;
  metadata?: Record<string, unknown> | null;
  sentAt?: string | null;
  readAt?: string | null;
  createdAt?: string;
}

interface ListNotificationsResponse {
  notifications: BackendNotification[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

function buildQuery(params: Record<string, string | number | undefined>): string {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      query.set(key, String(value));
    }
  });
  const qs = query.toString();
  return qs ? `?${qs}` : '';
}

export async function listNotifications(params: {
  page?: number;
  limit?: number;
  status?: string;
  type?: string;
} = {}): Promise<ListNotificationsResponse> {
  return api.get<ListNotificationsResponse>(`${NOTIFICATIONS_BASE}${buildQuery(params)}`);
}

export async function markNotificationRead(id: string): Promise<BackendNotification> {
  const data = await api.post<{ notification: BackendNotification }>(
    `${NOTIFICATIONS_BASE}/${id}/read`,
    {},
  );
  return data.notification ?? (data as unknown as BackendNotification);
}

export async function markAllNotificationsRead(): Promise<void> {
  await api.post(`${NOTIFICATIONS_BASE}/read-all`, {});
}

export async function getUnreadNotificationCount(): Promise<number> {
  const data = await api.get<{ count: number }>(`${NOTIFICATIONS_BASE}/unread-count`);
  return data.count ?? 0;
}

export const notificationApi = Object.freeze({
  listNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  getUnreadNotificationCount,
});

export default notificationApi;
