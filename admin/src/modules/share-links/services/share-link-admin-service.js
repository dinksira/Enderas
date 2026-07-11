import { api, ENV } from '@enderass/shared/api';

const BASE = `${ENV.apiV1Prefix}`;

export const shareLinkAdminService = Object.freeze({
  create(auctionId, payload) {
    return api.post(`${BASE}/auctions/${auctionId}/share-links`, payload);
  },

  list(auctionId) {
    return api.get(`${BASE}/auctions/${auctionId}/share-links`);
  },

  revoke(id) {
    return api.delete(`${BASE}/share-links/${id}`);
  },
});

export default shareLinkAdminService;
