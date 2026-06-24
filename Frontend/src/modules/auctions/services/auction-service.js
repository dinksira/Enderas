import { ENV } from '../../../config/env.js';
import { api } from '../../../services/api.js';

const AUCTIONS_BASE = `${ENV.apiV1Prefix}/auctions`;

export const auctionService = Object.freeze({
  getAll: () => api.get(AUCTIONS_BASE),
  getById: (id) => api.get(`${AUCTIONS_BASE}/${id}`),
  create: (payload) => api.post(AUCTIONS_BASE, payload),
  update: (id, payload) => api.put(`${AUCTIONS_BASE}/${id}`, payload),
  remove: (id) => api.delete(`${AUCTIONS_BASE}/${id}`),
});

export default auctionService;
