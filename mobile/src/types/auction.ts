export type AuctionDisplayStatus = 'ACTIVE' | 'CLOSED' | 'SUSPENDED' | 'PENDING';

export type AuctionStatusFilter = '' | 'ACTIVE' | 'CLOSED' | 'SUSPENDED';

export interface BrowseAuction {
  id: string;
  title: string;
  description: string;
  category: string;
  status: AuctionDisplayStatus;
  imageUrls: string[];
  reservePrice: number;
  bidCount: number;
  endingDate: string;
  endDate: string;
  /** Document fee required before viewing docs and bidding. */
  documentPrice: number;
  /** Simulated CPO percentage (backend: cpo_percentage). */
  cpoPercentage: number;
}
