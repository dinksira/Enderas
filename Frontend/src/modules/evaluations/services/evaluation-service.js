import { ENV } from '../../../config/env.js';
import { api } from '../../../services/api.js';

const BASE = `${ENV.apiV1Prefix}/evaluations`;

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

async function unwrapEvaluation(response) {
  return response?.evaluation ?? response;
}

export const evaluationService = Object.freeze({
  listEvaluations: (params = {}) => api.get(`${BASE}${buildQuery(params)}`),
  getEvaluationById: async (id) => unwrapEvaluation(await api.get(`${BASE}/${id}`)),
  getEligibleAssets: async (params = {}) => {
    const response = await api.get(`${BASE}/eligible-assets${buildQuery(params)}`);
    return response?.items ?? [];
  },
  listEligibleAssets: async (params = {}) => {
    const response = await api.get(`${BASE}/eligible-assets${buildQuery(params)}`);
    return response?.items ?? [];
  },
  scheduleEvaluation: async (payload) => unwrapEvaluation(await api.post(BASE, payload)),
  updateEvaluation: async (id, payload) => unwrapEvaluation(await api.put(`${BASE}/${id}`, payload)),
  startEvaluation: async (id) => unwrapEvaluation(await api.post(`${BASE}/${id}/start`, {})),
  markInProgress: async (id) => unwrapEvaluation(await api.post(`${BASE}/${id}/start`, {})),
  completeEvaluation: async (id, payload) =>
    unwrapEvaluation(await api.post(`${BASE}/${id}/complete`, payload)),
  approveEvaluation: async (id, reviewNotes) =>
    unwrapEvaluation(await api.post(`${BASE}/${id}/approve`, { reviewNotes: reviewNotes || null })),
  rejectEvaluation: async (id, rejectionReason, reviewNotes) =>
    unwrapEvaluation(
      await api.post(`${BASE}/${id}/reject`, {
        rejectionReason,
        reviewNotes: reviewNotes || null,
      }),
    ),
  rescheduleEvaluation: async (id, payload) =>
    unwrapEvaluation(await api.post(`${BASE}/${id}/reschedule`, payload)),
});

export default evaluationService;
