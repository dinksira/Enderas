import { ENV } from '../../../config/env.js';
import { api } from '../../../services/api.js';

const NOTIFICATIONS_BASE = `${ENV.apiV1Prefix}/notifications`;

function buildQuery(params = {}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      query.set(key, String(value));
    }
  });
  const qs = query.toString();
  return qs ? `?${qs}` : '';
}

async function unwrapNotification(response) {
  return response?.notification ?? response;
}

export const notificationService = Object.freeze({
  listNotifications: (params = {}) => api.get(`${NOTIFICATIONS_BASE}${buildQuery(params)}`),
  getNotificationById: async (id) => unwrapNotification(await api.get(`${NOTIFICATIONS_BASE}/${id}`)),
  markAsRead: async (id) => unwrapNotification(await api.post(`${NOTIFICATIONS_BASE}/${id}/read`, {})),
  markAllRead: () => api.post(`${NOTIFICATIONS_BASE}/read-all`, {}),
  getUnreadCount: async () => {
    const response = await api.get(`${NOTIFICATIONS_BASE}/unread-count`);
    return response?.count ?? 0;
  },
});

export default notificationService;
