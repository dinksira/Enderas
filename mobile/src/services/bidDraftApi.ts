import { ENV } from '@/lib/env';
import { api } from '@/services/api';
import type { BidDraftApi } from '@/types/auctionApi';

const BID_DRAFTS_BASE = `${ENV.apiV1Prefix}/bid-drafts`;

export async function upsertBidDraft(payload: {
  auctionId: string;
  auctionAssetId: string | null;
  amount: number;
}): Promise<BidDraftApi> {
  const response = await api.put<{ draft: BidDraftApi } | BidDraftApi>(BID_DRAFTS_BASE, payload);
  return (response as { draft?: BidDraftApi }).draft ?? (response as BidDraftApi);
}

export async function deleteBidDraft(id: string): Promise<void> {
  await api.delete(`${BID_DRAFTS_BASE}/${id}`);
}

export const bidDraftApi = Object.freeze({
  upsertBidDraft,
  deleteBidDraft,
});

export default bidDraftApi;
