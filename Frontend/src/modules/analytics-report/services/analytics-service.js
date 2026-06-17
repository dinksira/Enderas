import { api } from '../../../services/api.js';

export const analyticsService = Object.freeze({
  getAll: () => api.get('/analytics'),
  getById: (id) => api.get(`/analytics/${id}`),
  create: (payload) => api.post('/analytics', payload),
  update: (id, payload) => api.put(`/analytics/${id}`, payload),
  remove: (id) => api.delete(`/analytics/${id}`),
});

export default analyticsService;
