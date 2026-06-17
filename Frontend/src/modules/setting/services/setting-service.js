import { api } from '../../../services/api.js';

export const settingService = Object.freeze({
  getAll: () => api.get('/settings'),
  getById: (id) => api.get(`/settings/${id}`),
  create: (payload) => api.post('/settings', payload),
  update: (id, payload) => api.put(`/settings/${id}`, payload),
  remove: (id) => api.delete(`/settings/${id}`),
});

export default settingService;
