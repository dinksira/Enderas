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

  getEligibleAssets: async (params = {}) => {
    const query = new URLSearchParams();
    if (params.search) query.set('search', params.search);
    if (params.assetId) query.set('assetId', params.assetId);
    const qs = query.toString();
    const response = await api.get(
      qs ? `${AUCTIONS_BASE}/eligible-assets?${qs}` : `${AUCTIONS_BASE}/eligible-assets`,
    );
    return response?.items ?? [];
  },

  getEligibleAssetById: async (assetId) => {
    if (!assetId) return null;
    const items = await auctionService.getEligibleAssets({ assetId });
    return items[0] ?? null;
  },

  create: async (payload) => {
    const response = await api.post(AUCTIONS_BASE, payload);
    return response?.auction ?? response;
  },

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
