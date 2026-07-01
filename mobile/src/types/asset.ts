export type AssetType =
  | 'vehicle'
  | 'land'
  | 'building'
  | 'machinery'
  | 'equipment'
  | 'salvage'
  | 'other';

export type AssetDisplayStatus =
  | 'PENDING_REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'UNDER_EVALUATION'
  | 'EVALUATED'
  | 'IN_AUCTION';

export interface AssetDocument {
  name: string;
  url: string;
  size?: number;
}

export interface AssetRecord {
  id: string;
  title: string;
  assetType: AssetType;
  category: string;
  description: string | null;
  conditionNotes: string | null;
  location: string | null;
  address: string | null;
  imageUrls: string[];
  desiredReservePrice: number;
  auctionConditions: string | null;
  ownershipDocumentType: string;
  ownershipDocumentUrl: string | null;
  additionalDocuments: AssetDocument[];
  status: AssetDisplayStatus;
  dbStatus: string;
  rejectionReason: string | null;
  ownerName: string | null;
  ownerMobile: string | null;
  ownerId: string;
  submissionBatchId: string | null;
  submittedAt: string;
  submittedAtFormatted: string;
  reviewedAt: string | null;
  reviewedAtFormatted: string;
  reviewedByName: string | null;
  createdAt: string;
  updatedAt: string;
  auctionId?: string;
  auctionTitle?: string;
  auctionStatus?: string;
}

export interface AssetListResponse {
  items: AssetRecord[];
  stats?: Record<string, number>;
}

export interface AssetCreatePayload {
  title: string;
  assetType: AssetType;
  description: string;
  conditionNotes: string;
  location: string;
  address?: string;
  imageUrls: string[];
  desiredReservePrice: number;
  auctionConditions: string;
  ownershipDocumentType: string;
  ownershipDocumentUrl: string;
  additionalDocuments: AssetDocument[];
}

export interface AssetBatchCreateResponse {
  batchId: string;
  count: number;
  items: AssetRecord[];
}
