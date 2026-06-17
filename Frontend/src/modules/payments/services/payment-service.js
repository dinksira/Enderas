import { api } from '../../../services/api.js';

export const paymentService = Object.freeze({
  getAll: () => api.get('/payments'),
  getById: (id) => api.get(`/payments/${id}`),
  create: (payload) => api.post('/payments', payload),
  update: (id, payload) => api.put(`/payments/${id}`, payload),
  remove: (id) => api.delete(`/payments/${id}`),
});

export default paymentService;
