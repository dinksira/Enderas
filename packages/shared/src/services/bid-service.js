import { ENV, api } from '@enderass/shared/api';

const BIDS_BASE = `${ENV.apiV1Prefix}/bids`;

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

async function unwrapBid(response) {
  return response?.bid ?? response;
}

export const bidService = Object.freeze({
  listBids: (params = {}) => api.get(`${BIDS_BASE}${buildQuery(params)}`),
  listMyBids: (params = {}) => api.get(`${BIDS_BASE}/my${buildQuery(params)}`),
  listBidsForAuction: (auctionId, params = {}) =>
    api.get(`${BIDS_BASE}/auction/${auctionId}${buildQuery(params)}`),
  getBidById: async (id) => unwrapBid(await api.get(`${BIDS_BASE}/${id}`)),
  placeBid: async (payload) => unwrapBid(await api.post(BIDS_BASE, payload)),
  getAll: (params = {}) => api.get(`${BIDS_BASE}${buildQuery(params)}`),
  getById: async (id) => unwrapBid(await api.get(`${BIDS_BASE}/${id}`)),
});

export default bidService;
