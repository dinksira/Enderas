export const PARTICIPATION_STEPS = Object.freeze(['payment', 'bid', 'cpo']);

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

  if (flags?.allBidsSubmitted || hasAnyBid) return 'bid_submitted';
  if (cpo?.status === 'rejected' || flags?.cpoRejected) return 'cpo_rejected';
  if (cpo?.status === 'pending') return 'cpo_pending';
  if (participation?.gates?.canSubmitCpoWithBids) return 'ready_to_bid';
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

  return Boolean(participation?.gates?.canSubmitCpoWithBids);
}

export function getParticipationStepState(participation) {
  if (!participation) {
    return { currentStep: 'payment', payment: 'active', bid: 'locked', cpo: 'locked' };
  }

  const { flags, gates, bid, bids } = participation;
  const hasAnyBid = Boolean(flags?.hasBid || bid || (Array.isArray(bids) && bids.length > 0));
  const hasBidDrafts = Array.isArray(participation?.bidDrafts) && participation.bidDrafts.length > 0;
  const allBidsSubmitted = Boolean(flags?.allBidsSubmitted);

  if (allBidsSubmitted || (hasAnyBid && !gates?.canPlaceBid && !participation?.isMultiLot)) {
    return { currentStep: 'cpo', payment: 'complete', bid: 'complete', cpo: 'complete' };
  }

  if (hasAnyBid && participation?.isMultiLot) {
    return {
      currentStep: 'cpo',
      payment: 'complete',
      bid: gates?.canPlaceBid ? 'active' : 'pending',
      cpo: 'complete',
    };
  }

  if (hasAnyBid) {
    return { currentStep: 'cpo', payment: 'complete', bid: 'complete', cpo: 'complete' };
  }

  if (participation.cpo?.status === 'pending') {
    return {
      currentStep: 'cpo',
      payment: 'complete',
      bid: 'complete',
      cpo: 'pending',
    };
  }

  if (flags?.paymentApproved || participation?.isRegisteredBidder) {
    return {
      currentStep: hasBidDrafts ? 'cpo' : 'bid',
      payment: 'complete',
      bid: gates?.canEditBidDrafts ? 'active' : (hasBidDrafts ? 'complete' : 'pending'),
      cpo: gates?.canSubmitCpoWithBids ? 'active' : 'locked',
    };
  }

  if (participation.payment?.status === 'pending') {
    return { currentStep: 'payment', payment: 'pending', bid: 'locked', cpo: 'locked' };
  }

  if (participation.payment?.status === 'rejected' || flags?.paymentRejected) {
    return { currentStep: 'payment', payment: 'rejected', bid: 'locked', cpo: 'locked' };
  }

  return {
    currentStep: 'payment',
    payment: gates?.canSubmitPayment ? 'active' : 'locked',
    bid: 'locked',
    cpo: 'locked',
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
  if (participation?.cpo?.status === 'pending' || participation?.flags?.cpoApproved) return false;
  return Boolean(participation?.gates?.canEditBidDrafts || participation?.gates?.canSubmitCpoWithBids);
}

export function getBidStepHintKey(participation, auction) {
  if (!participation) {
    return 'bidder.participation.bidLocked.notRegistered';
  }

  if (!participation.flags?.paymentApproved && !participation.isRegisteredBidder) {
    return 'bidder.participation.bidLocked.notRegistered';
  }

  if (participation?.gates?.canEditBidDrafts || participation?.gates?.canSubmitCpoWithBids) {
    return null;
  }

  if (participation.cpo?.status === 'pending') {
    return 'bidder.participation.bidLocked.cpoPending';
  }

  if (participation.cpo?.status === 'rejected' || participation.flags?.cpoRejected) {
    return 'bidder.participation.bidLocked.cpoRejected';
  }

  if (participation.flags?.cpoApproved) {
    return null;
  }

  return 'bidder.participation.bidLocked.notRegistered';
}
