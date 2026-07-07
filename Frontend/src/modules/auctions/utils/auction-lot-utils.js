export function roundMoney(amount) {
  const value = Number(amount);
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Math.round(value * 100) / 100;
}

/** Bid coverage vs reserve: 100% when bid equals reserve. */
export function computeBidCoveragePercent(bidAmount, reservePrice) {
  const bid = Number(bidAmount);
  const reserve = Number(reservePrice);
  if (!Number.isFinite(bid) || bid <= 0 || !Number.isFinite(reserve) || reserve <= 0) {
    return 0;
  }
  return roundMoney((bid / reserve) * 100);
}

/** CPO amount scales with bid coverage: full reserve = 100% coverage. */
export function computeCpoFromBidAndReserve(bidAmount, reservePrice, cpoPercentage) {
  const bid = Number(bidAmount);
  const reserve = Number(reservePrice);
  const rate = Number(cpoPercentage);
  if (!Number.isFinite(bid) || bid <= 0) {
    return 0;
  }
  if (!Number.isFinite(reserve) || reserve <= 0) {
    return 0;
  }
  if (!Number.isFinite(rate) || rate <= 0) {
    return 0;
  }
  return roundMoney(reserve * (rate / 100) * (bid / reserve));
}

/** Fallback when reserve is unavailable: treats bid as full reserve coverage. */
export function computeCpoFromBidAmount(bidAmount, cpoPercentage) {
  const amount = Number(bidAmount);
  const percentage = Number(cpoPercentage);
  if (!Number.isFinite(amount) || amount <= 0) {
    return 0;
  }
  if (!Number.isFinite(percentage) || percentage <= 0) {
    return 0;
  }
  return roundMoney((amount * percentage) / 100);
}

/** Minimum bid = Asset Reserve Price (hard floor). CPO% is NOT used for minimum bid. */
export function computeMinimumBidFromReserve(reservePrice) {
  const reserve = Number(reservePrice);
  if (!Number.isFinite(reserve) || reserve <= 0) {
    return 0;
  }
  return roundMoney(reserve);
}

/** CPO deposit = reserve × (cpoPercentage / 100). Used only for deposit calc, NOT minimum bid. */
export function computeCpoDepositAmount(reservePrice, cpoPercentage) {
  const reserve = Number(reservePrice);
  const pct = Number(cpoPercentage);
  if (!Number.isFinite(reserve) || reserve <= 0) return 0;
  if (!Number.isFinite(pct) || pct <= 0) return 0;
  return roundMoney(reserve * (pct / 100));
}

function resolveReserveForBid(entry, lots, auctionReservePrice) {
  const lotId = entry?.auctionAssetId ?? null;
  if (lotId && Array.isArray(lots) && lots.length > 0) {
    const lot = lots.find((item) => item.id === lotId);
    const lotReserve = Number(lot?.reservePrice ?? lot?.reserve_price);
    if (Number.isFinite(lotReserve) && lotReserve > 0) {
      return lotReserve;
    }
  }

  const fallback = Number(auctionReservePrice);
  return Number.isFinite(fallback) && fallback > 0 ? fallback : 0;
}

export function computeRequiredCpoFromBidAmounts(
  proposedBids,
  cpoPercentage,
  lots = [],
  auctionReservePrice = null,
) {
  const percentage = Number(cpoPercentage);
  if (!Array.isArray(proposedBids) || !proposedBids.length) {
    return 0;
  }
  if (!Number.isFinite(percentage) || percentage <= 0) {
    return 0;
  }

  const total = proposedBids.reduce((sum, entry) => {
    const amount = Number(entry?.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      return sum;
    }
    const reserve = resolveReserveForBid(entry, lots, auctionReservePrice);
    if (reserve <= 0) {
      return sum;
    }
    return sum + computeCpoDepositAmount(reserve, percentage);
  }, 0);

  return roundMoney(total);
}

export function computeAggregateBidCoveragePercent(
  proposedBids,
  lots = [],
  auctionReservePrice = null,
) {
  if (!Array.isArray(proposedBids) || !proposedBids.length) {
    return 0;
  }

  let totalBid = 0;
  let totalReserve = 0;

  for (const entry of proposedBids) {
    const amount = Number(entry?.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      continue;
    }
    const reserve = resolveReserveForBid(entry, lots, auctionReservePrice);
    if (reserve <= 0) {
      continue;
    }
    totalBid += amount;
    totalReserve += reserve;
  }

  return computeBidCoveragePercent(totalBid, totalReserve);
}

export function computeTotalReserveForLots(lots, selectedLotIds) {
  const selected = new Set(selectedLotIds);
  return roundMoney(
    (lots || [])
      .filter((lot) => selected.has(lot.id))
      .reduce((sum, lot) => {
        const reserve = Number(lot.reservePrice ?? lot.reserve_price);
        return Number.isFinite(reserve) && reserve > 0 ? sum + reserve : sum;
      }, 0),
  );
}

export function computeTotalBidAmountFromDrafts(bidDrafts, selectedLotIds) {
  const selected = new Set(selectedLotIds);
  return roundMoney(
    (bidDrafts || [])
      .filter((draft) => draft.auctionAssetId && selected.has(draft.auctionAssetId))
      .reduce((sum, draft) => {
        const amount = Number(draft.amount);
        return Number.isFinite(amount) && amount > 0 ? sum + amount : sum;
      }, 0),
  );
}

export function computeRequiredCpoAmount(lots, selectedLotIds, cpoPercentage) {
  const selected = new Set(selectedLotIds);
  const totalReserve = (lots || [])
    .filter((lot) => selected.has(lot.id))
    .reduce((sum, lot) => {
      const reserve = Number(lot.reservePrice ?? lot.reserve_price);
      return Number.isFinite(reserve) && reserve > 0 ? sum + reserve : sum;
    }, 0);

  const percentage = Number(cpoPercentage);
  if (!Number.isFinite(percentage) || percentage <= 0 || totalReserve <= 0) {
    return 0;
  }

  return roundMoney((totalReserve * percentage) / 100);
}

export function isMultiLotAuction(auction) {
  return auction?.auctionMode === 'multi' || auction?.auction_mode === 'multi';
}
