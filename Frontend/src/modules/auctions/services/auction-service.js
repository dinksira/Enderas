import { ENV } from '../../../config/env.js';
import { api } from '../../../services/api.js';

const AUCTIONS_BASE = `${ENV.apiV1Prefix}/auctions`;
const FILES_BASE = `${ENV.apiV1Prefix}/files`;

export const auctionService = Object.freeze({
  getAll: (params = {}) => {
    const query = new URLSearchParams();
    if (params.status) query.set('status', params.status);
    if (params.search) query.set('search', params.search);
    const qs = query.toString();
    return api.get(qs ? `${AUCTIONS_BASE}?${qs}` : AUCTIONS_BASE);
  },

  browse: (params = {}) => {
    const query = new URLSearchParams();
    if (params.status) query.set('status', params.status);
    if (params.search) query.set('search', params.search);
    const qs = query.toString();
    return api.get(qs ? `${AUCTIONS_BASE}/browse?${qs}` : `${AUCTIONS_BASE}/browse`);
  },

  browseById: async (id) => {
    const response = await api.get(`${AUCTIONS_BASE}/browse/${id}`);
    return response;
  },

  getParticipation: async (id) => api.get(`${AUCTIONS_BASE}/browse/${id}/participation`),

  getById: (id) => api.get(`${AUCTIONS_BASE}/${id}`),

  create: (payload) => api.post(AUCTIONS_BASE, payload),

  update: (id, payload) => api.put(`${AUCTIONS_BASE}/${id}`, payload),

  remove: (id) => api.delete(`${AUCTIONS_BASE}/${id}`),

  publish: (id) => api.post(`${AUCTIONS_BASE}/${id}/publish`, {}),

  suspend: (id) => api.post(`${AUCTIONS_BASE}/${id}/suspend`, {}),

  reactivate: (id) => api.post(`${AUCTIONS_BASE}/${id}/reactivate`, {}),

  close: (id) => api.post(`${AUCTIONS_BASE}/${id}/close`, {}),

  /**
   * @param {File[]} files
   * @param {string} [folder]
   */
  uploadFiles: async (files, folder = 'auctions') => {
    if (!files?.length) {
      return [];
    }

    const formData = new FormData();
    files.forEach((file) => formData.append('files', file));
    formData.append('folder', folder);

    const response = await api.post(`${FILES_BASE}/multiple`, formData);
    return response?.files || [];
  },
});

export default auctionService;
