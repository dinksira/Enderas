import { publicApi } from '../api/public-api.js';

const PUBLIC_BASE = '/public/landing';

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

export const publicLandingService = Object.freeze({
  getLanding: () => publicApi.get(`${PUBLIC_BASE}`),
  getStats: () => publicApi.get(`${PUBLIC_BASE}/stats`),
  getFeaturedAuctions: (params = {}) =>
    publicApi.get(`${PUBLIC_BASE}/featured-auctions${buildQuery(params)}`),
});

export default publicLandingService;
