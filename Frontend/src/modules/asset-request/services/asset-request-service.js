import { api } from '../../../services/api.js';

export const assetRequestService = Object.freeze({
  getAll: () => api.get('/asset-requests'),
  getById: (id) => api.get(`/asset-requests/${id}`),
  create: (payload) => api.post('/asset-requests', payload),
  update: (id, payload) => api.put(`/asset-requests/${id}`, payload),
  remove: (id) => api.delete(`/asset-requests/${id}`),
});

export default assetRequestService;
