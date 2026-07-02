import { ENV, api } from '../api/index.js';

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
  getWinnersForAuction: async (auctionId) => {
    const response = await api.get(`${WINNERS_BASE}/auction/${auctionId}`);
    return response?.items ?? [];
  },
  selectWinner: async (payload) => unwrapWinner(await api.post(WINNERS_BASE, payload)),
  confirmWinner: async (id) => unwrapWinner(await api.post(`${WINNERS_BASE}/${id}/confirm`, {})),
  declineWinner: async (id, declineReason) =>
    unwrapWinner(await api.post(`${WINNERS_BASE}/${id}/decline`, { declineReason })),
  replaceWinner: async (id, bidId) =>
    unwrapWinner(await api.post(`${WINNERS_BASE}/${id}/replace`, { bidId })),
});

export default winnerService;
