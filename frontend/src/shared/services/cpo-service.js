import { ENV, api } from '@enderass/shared/api';

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
  approveCpoDeposit: async (cpoPaymentId) =>
    api.post(`${CPO_BASE}/${cpoPaymentId}/approve-deposit`, {}),
  processRefund: async (cpoId, transactionReference = null) =>
    unwrapCpo(await api.post(`${CPO_BASE}/${cpoId}/process-refund`, { transactionReference })),
  getAll: (params = {}) => api.get(`${CPO_BASE}${buildQuery(params)}`),
  getById: async (id) => unwrapCpo(await api.get(`${CPO_BASE}/${id}`)),
});

export default cpoService;
