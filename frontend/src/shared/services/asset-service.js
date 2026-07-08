import { ENV, api } from '@enderass/shared/api';

const ASSETS_BASE = `${ENV.apiV1Prefix}/assets`;
const FILES_BASE = `${ENV.apiV1Prefix}/files`;

export const assetService = Object.freeze({
  getAll: (params = {}) => {
    const query = new URLSearchParams();
    if (params.status) query.set('status', params.status);
    if (params.search) query.set('search', params.search);
    if (params.includeStats) query.set('includeStats', 'true');
    const qs = query.toString();
    return api.get(qs ? `${ASSETS_BASE}?${qs}` : ASSETS_BASE);
  },

  getMy: () => api.get(`${ASSETS_BASE}/my`),

  getById: (id) => api.get(`${ASSETS_BASE}/${id}`),

  create: (payload) => api.post(ASSETS_BASE, payload),

  createBatch: (assets) => api.post(`${ASSETS_BASE}/batch`, { assets }),

  staffCreate: (payload) => api.post(`${ASSETS_BASE}/staff-create`, payload),

  update: (id, payload) => api.put(`${ASSETS_BASE}/${id}`, payload),

  approve: (id, reviewNotes) => api.post(`${ASSETS_BASE}/${id}/approve`, { reviewNotes }),

  reject: (id, rejectionReason) => api.post(`${ASSETS_BASE}/${id}/reject`, { rejectionReason }),

  /**
   * @param {File[]} files
   * @param {string} [folder]
   */
  uploadFiles: async (files, folder = 'assets/documents') => {
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

export default assetService;
