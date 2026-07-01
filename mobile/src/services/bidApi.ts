import { ENV } from '@/lib/env';
import { api } from '@/services/api';
import type { BidListResponse } from '@/types/bid';

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

export const bidApi = Object.freeze({
  getMyBids,
});

export default bidApi;
