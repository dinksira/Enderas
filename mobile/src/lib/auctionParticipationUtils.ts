import type {
  AuctionCpoState,
  AuctionDocumentPayment,
  AuctionParticipationRecord,
  LotBidDraft,
} from '@/types/auctionParticipation';
import type { AuctionLot } from '@/types/auctionParticipation';

export const SIMULATED_CPO_PERCENTAGE = 20;

export function createEmptyParticipation(auctionId: string): AuctionParticipationRecord {
  return {
    auctionId,
    documentPayment: { status: 'none' },
    cpo: {
      status: 'none',
      selectedLotIds: [],
      bids: [],
      locked: false,
    },
  };
}

export function hasDocumentAccess(payment: AuctionDocumentPayment): boolean {
  return payment.status === 'approved';
}

export function canEnterBidFlow(
  payment: AuctionDocumentPayment,
  isKycVerified: boolean,
): boolean {
  return hasDocumentAccess(payment) && isKycVerified;
}

export function calculateCpoAmount(bids: LotBidDraft[]): number {
  const total = bids.reduce((sum, bid) => sum + (Number.isFinite(bid.amount) ? bid.amount : 0), 0);
  return Math.round((total * SIMULATED_CPO_PERCENTAGE) / 100);
}

export function validateLotBid(amount: number, lot: AuctionLot): string | null {
  if (!Number.isFinite(amount) || amount <= 0) {
    return 'invalid';
  }
  if (amount < lot.reservePrice) {
    return 'belowReserve';
  }
  return null;
}

export function getParticipationSummary(
  record: AuctionParticipationRecord,
  lots: AuctionLot[],
): {
  selectedLots: AuctionLot[];
  cpoAmount: number;
  totalBidAmount: number;
} {
  const selectedLots = lots.filter((lot) => record.cpo.selectedLotIds.includes(lot.id));
  const bids = record.cpo.bids.filter((bid) => record.cpo.selectedLotIds.includes(bid.lotId));
  const totalBidAmount = bids.reduce((sum, bid) => sum + bid.amount, 0);

  return {
    selectedLots,
    cpoAmount: calculateCpoAmount(bids),
    totalBidAmount,
  };
}

export function syncBidsWithSelection(
  selectedLotIds: string[],
  existingBids: LotBidDraft[],
  lots: AuctionLot[],
): LotBidDraft[] {
  return selectedLotIds.map((lotId) => {
    const existing = existingBids.find((bid) => bid.lotId === lotId);
    const lot = lots.find((item) => item.id === lotId);
    return {
      lotId,
      amount: existing?.amount ?? lot?.reservePrice ?? 0,
    };
  });
}

export function getCpoStatusLabel(status: AuctionCpoState['status'], locked: boolean): string {
  if (locked && status === 'pending') return 'underReview';
  if (status === 'approved') return 'approved';
  if (status === 'rejected') return 'rejected';
  if (status === 'pending') return 'pending';
  return 'draft';
}
