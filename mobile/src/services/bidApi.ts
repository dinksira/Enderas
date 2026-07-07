import { ENV } from '@/lib/env';
import { api } from '@/services/api';
import type { BidListResponse, CpoRecord } from '@/types/bid';

const BIDS_BASE = `${ENV.apiV1Prefix}/bids`;

function buildQuery(params: Record<string, string | number | undefined | null>): string {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      query.set(key, String(value));
    }
  });
  const qs = query.toString();
  return qs ? `?${qs}` : '';
}

export async function getMyBids(params: {
  page?: number;
  limit?: number;
  status?: string;
} = {}): Promise<BidListResponse> {
  return api.get<BidListResponse>(`${BIDS_BASE}/my${buildQuery(params)}`);
}

export interface SubmitBidWithCpoPayload {
  auctionId: string;
  bids: Array<{ auctionAssetId: string; amount: number }>;
  cpoDocumentUrl: string;
  transactionReference?: string;
}

export async function submitBidWithCpo(payload: SubmitBidWithCpoPayload): Promise<CpoRecord> {
  return api.post<CpoRecord>(`${BIDS_BASE}/submit-with-cpo`, payload);
}

export const bidApi = Object.freeze({
  getMyBids,
  submitBidWithCpo,
});

export default bidApi;
