import { ENV, api } from '@enderass/shared/api';

const BID_DRAFTS_BASE = `${ENV.apiV1Prefix}/bid-drafts`;
const AUCTIONS_BASE = `${ENV.apiV1Prefix}/auctions`;

function unwrapDraft(response) {
  return response?.draft ?? response;
}

export const bidDraftService = Object.freeze({
  listForAuction: async (auctionId) => {
    const response = await api.get(`${AUCTIONS_BASE}/browse/${auctionId}/bid-drafts`);
    return response?.items ?? [];
  },
  saveDraft: async (payload) => unwrapDraft(await api.put(BID_DRAFTS_BASE, payload)),
  deleteDraft: async (id) => api.delete(`${BID_DRAFTS_BASE}/${id}`),
});

export default bidDraftService;
