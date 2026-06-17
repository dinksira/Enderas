import { api } from '../../../services/api.js';

export const auctionService = Object.freeze({
  getAll: () => api.get('/auctions'),
  getById: (id) => api.get(`/auctions/${id}`),
  create: (payload) => api.post('/auctions', payload),
  update: (id, payload) => api.put(`/auctions/${id}`, payload),
  remove: (id) => api.delete(`/auctions/${id}`),
});

export default auctionService;
