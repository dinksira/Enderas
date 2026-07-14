// The backend only ever sets `submitted` or `invalid` on a bid. Winners are
// tracked separately (Winner table), so there is no winning/lost/outbid state
// surfaced through the bids API.
export type BidStatus = 'submitted' | 'invalid';

export interface BidRecord {
  id: string;
  auctionId: string;
  auctionAssetId: string | null;
  auctionTitle: string | null;
  auctionImageUrl: string | null;
  userId: string;
  bidderName: string | null;
  amount: number;
  currency: string;
  status: BidStatus;
  isValid: boolean;
  submittedAt: string;
  createdAt: string;
}

export interface BidListResponse {
  items: BidRecord[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export type BidTabFilter = '' | 'submitted' | 'invalid';
