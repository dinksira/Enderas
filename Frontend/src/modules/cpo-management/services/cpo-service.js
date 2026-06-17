import { api } from '../../../services/api.js';

export const cpoService = Object.freeze({
  getAll: () => api.get('/cpo'),
  getById: (id) => api.get(`/cpo/${id}`),
  create: (payload) => api.post('/cpo', payload),
  update: (id, payload) => api.put(`/cpo/${id}`, payload),
  remove: (id) => api.delete(`/cpo/${id}`),
});

export default cpoService;
