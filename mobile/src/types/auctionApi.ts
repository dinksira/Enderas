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
  | 'bid_submitted'
  | 'owner_monitoring';

export type ReviewStatus = 'pending' | 'approved' | 'rejected';

export interface AuctionAssetApi {
  id: string;
  auctionId?: string;
  lotId?: string | null;
  lotTitle?: string;
  assetId?: string;
  reservePrice: number;
  sortOrder?: number;
  lotLabel?: string;
  assetTitle?: string | null;
  assetType?: string | null;
  assetLocation?: string | null;
  imageUrls?: string[];
  assetImages?: string[];
  tags?: string[];
}

export interface AuctionLotApi {
  id: string;
  title: string;
  description?: string | null;
  sortOrder: number;
  assets: AuctionAssetApi[];
}

export interface AuctionDocumentApi {
  name: string;
  url: string;
  size?: number;
}

export interface OwnerLotOverviewApi {
  id: string;
  lotId?: string | null;
  lotTitle?: string | null;
  assetId?: string;
  assetTitle?: string | null;
  assetType?: string | null;
  assetLocation?: string | null;
  reservePrice: number;
  bidCount: number;
  imageUrls?: string[];
  tags?: string[];
}

export interface AuctionOwnerOverviewApi {
  auctionId: string;
  isAuctionOwner: boolean;
  summary: {
    assetCount: number;
    lotCount: number;
    totalBidCount: number;
    documentFee: number;
    reservePrice: number;
    totalReservePrice?: number | null;
  };
  lots: OwnerLotOverviewApi[];
  documents: AuctionDocumentApi[];
  auction?: BrowseAuctionApi;
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
  assetCount?: number;
  documents?: AuctionDocumentApi[];
  documentAccess?: boolean;
  isAuctionOwner?: boolean;
  ownerId?: string | null;
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
  isAuctionOwner?: boolean;
  isMultiLot: boolean;
  ownerOverview?: {
    lots: OwnerLotOverviewApi[];
    totalBidCount: number;
    documents: AuctionDocumentApi[];
    documentFee: number;
    reservePrice: number;
    totalReservePrice?: number | null;
  };
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
  lotParticipation?: (AuctionAssetApi & {
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
    isAuctionOwner?: boolean;
    biddingBlockedReason?: string | null;
  };
  flags: {
    paymentApproved: boolean;
    paymentRejected: boolean;
    cpoApproved: boolean;
    cpoRejected: boolean;
    hasBid: boolean;
    allBidsSubmitted: boolean;
    pendingLotCount: number;
    isAuctionOwner?: boolean;
  };
}

export interface ProposedBidPayload {
  auctionAssetId: string | null;
  amount: number;
}
