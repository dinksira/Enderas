/**
 * @param {unknown} value
 * @returns {string[]}
 */
export function normalizeLotIdList(value) {
  if (Array.isArray(value)) {
    return value.filter((id) => typeof id === 'string' && id.trim()).map((id) => id.trim());
  }

  if (typeof value === 'string' && value.trim()) {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed)
        ? parsed.filter((id) => typeof id === 'string' && id.trim()).map((id) => id.trim())
        : [];
    } catch {
      return [];
    }
  }

  return [];
}

/**
 * @param {number} amount
 */
export function roundMoney(amount) {
  const value = Number(amount);
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Math.round(value * 100) / 100;
}

/**
 * Bid coverage vs reserve: 100% when bid equals reserve.
 * @param {number} bidAmount
 * @param {number} reservePrice
 */
export function computeBidCoveragePercent(bidAmount, reservePrice) {
  const bid = Number(bidAmount);
  const reserve = Number(reservePrice);
  if (!Number.isFinite(bid) || bid <= 0 || !Number.isFinite(reserve) || reserve <= 0) {
    return 0;
  }
  return roundMoney((bid / reserve) * 100);
}

/**
 * CPO amount scales with bid coverage: full reserve = 100% coverage.
 * Formula: reserve × (auction CPO rate / 100) × (bid / reserve)
 * @param {number} bidAmount
 * @param {number} reservePrice
 * @param {number} cpoPercentage Auction CPO rate at 100% reserve coverage
 */
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

/** Minimum bid = Asset Reserve Price (hard floor). CPO% is NOT used for minimum bid. */
export function computeMinimumBidFromReserve(reservePrice) {
  const reserve = Number(reservePrice);
  if (!Number.isFinite(reserve) || reserve <= 0) {
    return 0;
  }
  return roundMoney(reserve);
}

/** CPO = bid × (cpoPercentage / 100). */
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

/** CPO at full reserve coverage = reserve × (cpoPercentage / 100). */
export function computeCpoDepositAmount(reservePrice, cpoPercentage) {
  const reserve = Number(reservePrice);
  const pct = Number(cpoPercentage);
  if (!Number.isFinite(reserve) || reserve <= 0) return 0;
  if (!Number.isFinite(pct) || pct <= 0) return 0;
  return roundMoney(reserve * (pct / 100));
}

function resolveReserveForBid(entry, lots, auctionReservePrice) {
  const lotId = entry?.auctionAssetId ?? entry?.auction_asset_id ?? null;
  if (lotId && Array.isArray(lots) && lots.length > 0) {
    const lot = lots.find((item) => item.id === lotId);
    const lotReserve = Number(lot?.reserve_price ?? lot?.reservePrice);
    if (Number.isFinite(lotReserve) && lotReserve > 0) {
      return lotReserve;
    }
  }

  const fallback = Number(auctionReservePrice);
  return Number.isFinite(fallback) && fallback > 0 ? fallback : 0;
}

/**
 * @param {Array<{ auctionAssetId?: string, amount: number }>} proposedBids
 * @param {number} cpoPercentage
 * @param {Array<{ id: string, reserve_price?: number, reservePrice?: number }>} [lots]
 * @param {number|null} [auctionReservePrice]
 */
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
      return sum + computeCpoFromBidAmount(amount, percentage);
    }
    return sum + computeCpoFromBidAndReserve(amount, reserve, percentage);
  }, 0);

  return roundMoney(total);
}

/**
 * @param {Array<{ auctionAssetId?: string, amount: number }>} proposedBids
 * @param {Array<{ id: string, reserve_price?: number, reservePrice?: number }>} [lots]
 * @param {number|null} [auctionReservePrice]
 */
export function computeAggregateBidCoveragePercent(proposedBids, lots = [], auctionReservePrice = null) {
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

export function computeRequiredCpoAmount(lots, selectedLotIds, cpoPercentage) {
  const selected = new Set(selectedLotIds);
  const totalReserve = lots
    .filter((lot) => selected.has(lot.id))
    .reduce((sum, lot) => {
      const reserve = Number(lot.reserve_price ?? lot.reservePrice);
      return Number.isFinite(reserve) && reserve > 0 ? sum + reserve : sum;
    }, 0);

  const percentage = Number(cpoPercentage);
  if (!Number.isFinite(percentage) || percentage <= 0 || totalReserve <= 0) {
    return 0;
  }

  return roundMoney((totalReserve * percentage) / 100);
}

export default {
  normalizeLotIdList,
  roundMoney,
  computeBidCoveragePercent,
  computeCpoFromBidAndReserve,
  computeCpoFromBidAmount,
  computeCpoDepositAmount,
  computeRequiredCpoAmount,
  computeRequiredCpoFromBidAmounts,
  computeAggregateBidCoveragePercent,
  computeMinimumBidFromReserve,
};
