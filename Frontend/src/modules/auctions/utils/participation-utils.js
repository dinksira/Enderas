export const PARTICIPATION_STEPS = Object.freeze(['payment', 'cpo', 'bid']);

export const PARTICIPATION_STATUS_VARIANTS = Object.freeze({
  not_started: 'default',
  payment_pending: 'under-review',
  payment_rejected: 'rejected',
  registered: 'active',
  cpo_pending: 'under-review',
  cpo_rejected: 'rejected',
  ready_to_bid: 'active',
  bidding_waiting: 'under-review',
  bidding_closed: 'default',
  bid_submitted: 'active',
});

export function isAuctionOpenForParticipation(auction) {
  const displayStatus = String(auction?.status || '').toUpperCase();
  const dbStatus = String(auction?.dbStatus || '').toLowerCase();
  return displayStatus === 'ACTIVE' || dbStatus === 'published';
}

export function resolveParticipationStatus(participation) {
  if (participation?.participationStatus) {
    return participation.participationStatus;
  }

  if (!participation) {
    return 'not_started';
  }

  const { flags, bid, bids, payment, cpo } = participation;
  const hasAnyBid = Boolean(flags?.hasBid || bid || (Array.isArray(bids) && bids.length > 0));

  if (flags?.allBidsSubmitted) return 'bid_submitted';
  if (hasAnyBid && participation?.isMultiLot) {
    if (participation?.gates?.canPlaceBid) return 'ready_to_bid';
    return 'bid_submitted';
  }
  if (hasAnyBid) return 'bid_submitted';
  if (flags?.cpoApproved || cpo?.status === 'approved') {
    if (participation?.gates?.canPlaceBid) return 'ready_to_bid';
    if (participation?.gates?.biddingWindowStatus === 'after') return 'bidding_closed';
    return 'bidding_waiting';
  }
  if (cpo?.status === 'rejected' || flags?.cpoRejected) return 'cpo_rejected';
  if (cpo?.status === 'pending') return 'cpo_pending';
  if (flags?.paymentApproved || participation?.isRegisteredBidder) return 'registered';
  if (payment?.status === 'rejected' || flags?.paymentRejected) return 'payment_rejected';
  if (payment?.status === 'pending') return 'payment_pending';

  return 'not_started';
}

export function getParticipationStatusVariant(status) {
  return PARTICIPATION_STATUS_VARIANTS[status] || 'default';
}

export function canShowPaymentButton(participation, auction, { loading = false } = {}) {
  if (loading || !isAuctionOpenForParticipation(auction)) {
    return false;
  }

  if (participation?.gates?.canSubmitPayment) {
    return true;
  }

  if (participation?.flags?.paymentRejected) {
    return true;
  }

  if (!participation) {
    return true;
  }

  return false;
}

export function canShowCpoButton(participation, auction, { loading = false } = {}) {
  if (loading || !isAuctionOpenForParticipation(auction)) {
    return false;
  }

  return Boolean(participation?.gates?.canSubmitCpo);
}

export function getParticipationStepState(participation) {
  if (!participation) {
    return { currentStep: 'payment', payment: 'active', cpo: 'locked', bid: 'locked' };
  }

  const { flags, gates, bid, bids } = participation;
  const hasAnyBid = Boolean(flags?.hasBid || bid || (Array.isArray(bids) && bids.length > 0));
  const allBidsSubmitted = Boolean(flags?.allBidsSubmitted);

  if (allBidsSubmitted || (hasAnyBid && !gates?.canPlaceBid && !participation?.isMultiLot)) {
    return { currentStep: 'bid', payment: 'complete', cpo: 'complete', bid: 'complete' };
  }

  if (hasAnyBid && participation?.isMultiLot) {
    return {
      currentStep: 'bid',
      payment: 'complete',
      cpo: 'complete',
      bid: gates?.canPlaceBid ? 'active' : 'pending',
    };
  }

  if (hasAnyBid) {
    return { currentStep: 'bid', payment: 'complete', cpo: 'complete', bid: 'complete' };
  }

  if (flags?.cpoApproved) {
    return {
      currentStep: 'bid',
      payment: 'complete',
      cpo: 'complete',
      bid: gates?.canPlaceBid ? 'active' : 'pending',
    };
  }

  if (participation.cpo?.status === 'pending') {
    return { currentStep: 'cpo', payment: 'complete', cpo: 'pending', bid: 'locked' };
  }

  if (flags?.paymentApproved || participation?.isRegisteredBidder) {
    return {
      currentStep: 'cpo',
      payment: 'complete',
      cpo: gates?.canSubmitCpo ? 'active' : 'pending',
      bid: 'locked',
    };
  }

  if (participation.payment?.status === 'pending') {
    return { currentStep: 'payment', payment: 'pending', cpo: 'locked', bid: 'locked' };
  }

  if (participation.payment?.status === 'rejected' || flags?.paymentRejected) {
    return { currentStep: 'payment', payment: 'rejected', cpo: 'locked', bid: 'locked' };
  }

  return {
    currentStep: 'payment',
    payment: gates?.canSubmitPayment ? 'active' : 'locked',
    cpo: 'locked',
    bid: 'locked',
  };
}

export function canShowBidForm(participation, displayStatus) {
  const status = String(displayStatus || '').toUpperCase();
  if (status !== 'ACTIVE') return false;
  return Boolean(participation?.gates?.canPlaceBid);
}

export function shouldShowBidSection(participation, displayStatus) {
  const status = String(displayStatus || '').toUpperCase();
  if (status !== 'ACTIVE') return false;
  if (participation?.flags?.allBidsSubmitted) return false;
  if (!participation?.flags?.cpoApproved) return false;
  if (participation?.isMultiLot) {
    return Boolean(participation?.gates?.canPlaceBid || participation?.flags?.hasBid);
  }
  if (participation?.bid || participation?.flags?.hasBid) return false;
  return true;
}

export function getBidStepHintKey(participation, auction) {
  if (!participation) {
    return 'bidder.participation.bidLocked.notRegistered';
  }

  if (participation.bid || participation.flags?.hasBid) {
    if (participation.isMultiLot && participation.gates?.canPlaceBid) {
      return null;
    }
    return null;
  }

  if (!participation.flags?.paymentApproved && !participation.isRegisteredBidder) {
    return 'bidder.participation.bidLocked.notRegistered';
  }

  if (!participation.cpo) {
    return 'bidder.participation.bidLocked.submitCpo';
  }

  if (participation.cpo?.status === 'pending') {
    return 'bidder.participation.bidLocked.cpoPending';
  }

  if (participation.cpo?.status === 'rejected' || participation.flags?.cpoRejected) {
    return 'bidder.participation.bidLocked.cpoRejected';
  }

  if (participation.flags?.cpoApproved && !participation.gates?.canPlaceBid) {
    if (participation.gates?.biddingWindowStatus === 'after') {
      return 'bidder.participation.bidLocked.windowEnded';
    }
    return 'bidder.participation.bidLocked.outsideWindow';
  }

  return 'bidder.participation.bidLocked.submitCpo';
}
