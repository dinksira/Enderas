export type BidStatus = 'submitted' | 'winning' | 'lost' | 'invalid';

export interface BidRecord {
  id: string;
  auctionId: string;
  auctionAssetId: string | null;
  auctionTitle: string | null;
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

export type BidTabFilter = '' | 'active' | 'winning' | 'outbid' | 'won' | 'lost';
