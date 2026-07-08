export function roundMoney(amount) {
  const value = Number(amount);
  if (!Number.isFinite(value)) return 0;
  return Math.round(value * 100) / 100;
}

export function computeBidCoveragePercent(bidAmount, reservePrice) {
  const bid = Number(bidAmount);
  const reserve = Number(reservePrice);
  if (!Number.isFinite(bid) || bid <= 0 || !Number.isFinite(reserve) || reserve <= 0) return 0;
  return roundMoney((bid / reserve) * 100);
}

export function computeCpoFromBidAndReserve(bidAmount, reservePrice, cpoPercentage) {
  const bid = Number(bidAmount);
  const reserve = Number(reservePrice);
  const rate = Number(cpoPercentage);
  if (!Number.isFinite(bid) || bid <= 0) return 0;
  if (!Number.isFinite(reserve) || reserve <= 0) return 0;
  if (!Number.isFinite(rate) || rate <= 0) return 0;
  return roundMoney(reserve * (rate / 100) * (bid / reserve));
}

export function computeMinimumBidFromReserve(reservePrice) {
  const reserve = Number(reservePrice);
  if (!Number.isFinite(reserve) || reserve <= 0) return 0;
  return roundMoney(reserve);
}

export function computeCpoDepositAmount(reservePrice, cpoPercentage) {
  const reserve = Number(reservePrice);
  const pct = Number(cpoPercentage);
  if (!Number.isFinite(reserve) || reserve <= 0) return 0;
  if (!Number.isFinite(pct) || pct <= 0) return 0;
  return roundMoney(reserve * (pct / 100));
}
