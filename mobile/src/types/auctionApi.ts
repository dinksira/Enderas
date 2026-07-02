export type ParticipationStatus =
  | 'not_started'
  | 'payment_pending'
  | 'payment_rejected'
  | 'registered'
  | 'cpo_pending'
  | 'cpo_rejected'
  | 'ready_to_bid'
  | 'bidding_waiting'
  | 'bidding_closed'
  | 'bid_submitted';

export type ReviewStatus = 'pending' | 'approved' | 'rejected';

export interface AuctionLotApi {
  id: string;
  auctionId: string;
  assetId?: string;
  reservePrice: number;
  sortOrder: number;
  lotLabel: string;
  assetTitle?: string | null;
  assetType?: string | null;
  assetLocation?: string | null;
  imageUrls?: string[];
}

export interface AuctionDocumentApi {
  name: string;
  url: string;
  size?: number;
}

export interface BrowseAuctionApi {
  id: string;
  title: string;
  description: string;
  category: string;
  status: string;
  dbStatus?: string;
  imageUrls: string[];
  reservePrice: number;
  documentFee: number;
  cpoPercentage: number;
  bidCount?: number;
  endDate: string;
  startDate?: string;
  endingDate?: string;
  lots?: AuctionLotApi[];
  lotCount?: number;
  documents?: AuctionDocumentApi[];
  documentAccess?: boolean;
  myParticipation?: {
    participationStatus: ParticipationStatus;
    isRegisteredBidder?: boolean;
    documentAccess?: boolean;
    hasBid?: boolean;
  };
}

export interface BrowseAuctionListResponse {
  items: BrowseAuctionApi[];
  total: number;
}

export interface BidDraftApi {
  id: string;
  auctionId?: string;
  auctionAssetId: string | null;
  amount: number;
  status: 'draft' | 'locked' | 'submitted';
  cpoId?: string | null;
}

export interface ParticipationBidApi {
  id: string;
  auctionAssetId: string | null;
  amount: number;
  status: string;
  submittedAt?: string;
}

export interface AuctionParticipationApi {
  auctionId: string;
  participationStatus: ParticipationStatus;
  isRegisteredBidder: boolean;
  isMultiLot: boolean;
  requiredCpoAmountPreview?: number | null;
  payment: {
    id: string;
    status: ReviewStatus;
    amount: number;
    rejectionReason?: string | null;
    createdAt?: string;
  } | null;
  cpo: {
    id: string;
    status: ReviewStatus;
    rejectionReason?: string | null;
    expiryDate?: string | null;
    selectedAuctionAssetIds?: string[];
    requiredCpoAmount?: number | null;
    declaredCpoAmount?: number | null;
    createdAt?: string;
  } | null;
  bids: ParticipationBidApi[];
  bidDrafts: BidDraftApi[];
  lotParticipation?: (AuctionLotApi & {
    selected?: boolean;
    bid?: ParticipationBidApi | null;
    canPlaceBid?: boolean;
  })[];
  gates: {
    documentAccess: boolean;
    cpoApproved: boolean;
    canSubmitPayment: boolean;
    canSubmitCpo: boolean;
    canSubmitCpoWithBids: boolean;
    canEditBidDrafts: boolean;
    bidsLocked: boolean;
    canPlaceBid: boolean;
    inBiddingWindow: boolean;
    biddingWindowStatus?: string;
    paymentPending: boolean;
    cpoPending: boolean;
  };
  flags: {
    paymentApproved: boolean;
    paymentRejected: boolean;
    cpoApproved: boolean;
    cpoRejected: boolean;
    hasBid: boolean;
    allBidsSubmitted: boolean;
    pendingLotCount: number;
  };
}

export interface ProposedBidPayload {
  auctionAssetId: string | null;
  amount: number;
}
