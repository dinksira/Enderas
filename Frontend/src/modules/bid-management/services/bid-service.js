import { api } from '../../../services/api.js';

export const bidService = Object.freeze({
  getAll: () => api.get('/bids'),
  getById: (id) => api.get(`/bids/${id}`),
  create: (payload) => api.post('/bids', payload),
  update: (id, payload) => api.put(`/bids/${id}`, payload),
  remove: (id) => api.delete(`/bids/${id}`),
});

export default bidService;
