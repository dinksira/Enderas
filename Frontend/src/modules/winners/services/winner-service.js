import { ENV } from '../../../config/env.js';
import { api } from '../../../services/api.js';

const WINNERS_BASE = `${ENV.apiV1Prefix}/winners`;

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

async function unwrapWinner(response) {
  return response?.winner ?? response;
}

export const winnerService = Object.freeze({
  listWinners: (params = {}) => api.get(`${WINNERS_BASE}${buildQuery(params)}`),
  getWinnerById: async (id) => unwrapWinner(await api.get(`${WINNERS_BASE}/${id}`)),
  selectWinner: async (payload) => unwrapWinner(await api.post(WINNERS_BASE, payload)),
  confirmWinner: async (id) => unwrapWinner(await api.post(`${WINNERS_BASE}/${id}/confirm`, {})),
  declineWinner: async (id, declineReason) =>
    unwrapWinner(await api.post(`${WINNERS_BASE}/${id}/decline`, { declineReason })),
});

export default winnerService;
