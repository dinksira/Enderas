import { ENV } from '../../../config/env.js';
import { api } from '../../../services/api.js';

const CPO_BASE = `${ENV.apiV1Prefix}/cpo`;

function buildQuery(params = {}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      query.set(key, String(value));
    }
  });
  const qs = query.toString();
  return qs ? `?${qs}` : '';
}

async function unwrapCpo(response) {
  return response?.cpo ?? response;
}

export const cpoService = Object.freeze({
  listCpos: (params = {}) => api.get(`${CPO_BASE}${buildQuery(params)}`),
  getCpoById: async (id) => unwrapCpo(await api.get(`${CPO_BASE}/${id}`)),
  createCpo: async (payload) => unwrapCpo(await api.post(CPO_BASE, payload)),
  approveCpo: async (id, expiryDate) =>
    unwrapCpo(await api.post(`${CPO_BASE}/${id}/approve`, { expiryDate: expiryDate || null })),
  rejectCpo: async (id, rejectionReason) =>
    unwrapCpo(await api.post(`${CPO_BASE}/${id}/reject`, { rejectionReason })),
  getAll: (params = {}) => api.get(`${CPO_BASE}${buildQuery(params)}`),
  getById: async (id) => unwrapCpo(await api.get(`${CPO_BASE}/${id}`)),
});

export default cpoService;
