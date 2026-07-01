import type { AuctionLot } from '@/types/auctionParticipation';
import type { AuctionParticipationApi } from '@/types/auctionApi';

/** True when the bidder should see the buy-document CTA (matches web participation panel). */
export function canShowBuyDocButton(participation: AuctionParticipationApi | null): boolean {
  if (!participation) {
    return true;
  }

  if (participation.gates?.canSubmitPayment) {
    return true;
  }

  if (participation.flags?.paymentRejected) {
    return true;
  }

  const status = participation.payment?.status;
  return !status || status === 'rejected';
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

export type LotBidFeedbackKind = 'hint' | 'error' | 'valid';

/** Real-time bid field feedback while the user types. */
export function getLotBidFeedback(
  bidText: string,
  lot: AuctionLot,
  { forceShow = false } = {},
): { kind: LotBidFeedbackKind; errorKey?: string } {
  const digits = bidText.replace(/[^\d]/g, '');
  if (!digits) {
    return forceShow ? { kind: 'error', errorKey: 'invalid' } : { kind: 'hint' };
  }

  const errorKey = validateLotBid(Number(digits), lot);
  if (errorKey) {
    return { kind: 'error', errorKey };
  }

  return { kind: 'valid' };
}
