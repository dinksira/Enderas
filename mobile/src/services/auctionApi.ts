import { ENV } from '@/lib/env';
import { api } from '@/services/api';
import type {
  AuctionOwnerOverviewApi,
  AuctionParticipationApi,
  BidDraftApi,
  BrowseAuctionApi,
  BrowseAuctionListResponse,
} from '@/types/auctionApi';

const AUCTIONS_BASE = `${ENV.apiV1Prefix}/auctions`;

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

export async function browseAuctions(params: {
  status?: string;
  search?: string;
} = {}): Promise<BrowseAuctionListResponse> {
  return api.get<BrowseAuctionListResponse>(`${AUCTIONS_BASE}/browse${buildQuery(params)}`);
}

export async function browseAuctionById(id: string): Promise<BrowseAuctionApi> {
  const response = await api.get<{ auction: BrowseAuctionApi } | BrowseAuctionApi>(
    `${AUCTIONS_BASE}/browse/${id}`,
  );
  return (response as { auction?: BrowseAuctionApi }).auction ?? (response as BrowseAuctionApi);
}

export async function getParticipation(id: string): Promise<AuctionParticipationApi> {
  const response = await api.get<{ participation: AuctionParticipationApi } | AuctionParticipationApi>(
    `${AUCTIONS_BASE}/browse/${id}/participation`,
  );
  return (response as { participation?: AuctionParticipationApi }).participation
    ?? (response as AuctionParticipationApi);
}

export async function getBidDrafts(auctionId: string): Promise<BidDraftApi[]> {
  const response = await api.get<{ items: BidDraftApi[] }>(`${AUCTIONS_BASE}/browse/${auctionId}/bid-drafts`);
  return response.items ?? [];
}

export function getDocumentStreamUrl(auctionId: string, docIndex = 0): string {
  return `${ENV.apiBaseUrl}${ENV.apiV1Prefix}/auctions/browse/${auctionId}/documents/${docIndex}/stream`;
}

export async function getOwnerOverview(id: string): Promise<AuctionOwnerOverviewApi> {
  const response = await api.get<{ overview: AuctionOwnerOverviewApi } | AuctionOwnerOverviewApi>(
    `${AUCTIONS_BASE}/browse/${id}/owner-overview`,
  );
  return (response as { overview?: AuctionOwnerOverviewApi }).overview
    ?? (response as AuctionOwnerOverviewApi);
}

export async function listOwnedAuctions(): Promise<BrowseAuctionListResponse> {
  return api.get<BrowseAuctionListResponse>(`${AUCTIONS_BASE}/my-owned`);
}

export const auctionApi = Object.freeze({
  browseAuctions,
  browseAuctionById,
  getParticipation,
  getOwnerOverview,
  listOwnedAuctions,
  getBidDrafts,
  getDocumentStreamUrl,
});

export default auctionApi;
