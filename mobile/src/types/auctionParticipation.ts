export type ReviewStatus = 'none' | 'pending' | 'approved' | 'rejected';

export type PaymentMethod = 'manual' | 'addis_pay';

export interface LotBidDraft {
  lotId: string;
  amount: number;
}

export interface AuctionDocumentPayment {
  status: ReviewStatus;
  paymentMethod?: PaymentMethod;
  receiptUri?: string;
  receiptName?: string;
  submittedAt?: string;
}

export interface AuctionCpoState {
  status: ReviewStatus;
  receiptUri?: string;
  receiptName?: string;
  selectedLotIds: string[];
  bids: LotBidDraft[];
  locked: boolean;
  submittedAt?: string;
}

export interface AuctionParticipationRecord {
  auctionId: string;
  documentPayment: AuctionDocumentPayment;
  cpo: AuctionCpoState;
}

export interface AuctionLot {
  id: string;
  auctionId: string;
  lotLabel: string;
  title: string;
  description: string;
  category: string;
  imageUrls: string[];
  reservePrice: number;
  sortOrder: number;
}

export interface AuctionDocument {
  id: string;
  auctionId: string;
  title: string;
  url: string;
  mimeType: string;
}
