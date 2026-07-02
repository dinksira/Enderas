import { ENV, api } from '../api/index.js';

const SETTINGS_BASE = `${ENV.apiV1Prefix}/settings`;

export const settingService = Object.freeze({
  getSettings: () => api.get(SETTINGS_BASE),
  updateSettings: (settings) => api.put(SETTINGS_BASE, { settings }),
  getAll: () => api.get(SETTINGS_BASE),
  getById: (id) => api.get(`${SETTINGS_BASE}/${id}`),
  create: (payload) => api.post(SETTINGS_BASE, payload),
  update: (payload) => api.put(SETTINGS_BASE, { settings: payload }),
  remove: (id) => api.delete(`${SETTINGS_BASE}/${id}`),
});

export default settingService;
