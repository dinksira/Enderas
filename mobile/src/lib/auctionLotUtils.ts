export function roundMoney(amount: number): number {
  if (!Number.isFinite(amount)) return 0;
  return Math.round(amount * 100) / 100;
}

export function computeCpoFromBidAmount(bidAmount: number, cpoPercentage: number): number {
  const amount = Number(bidAmount);
  const percentage = Number(cpoPercentage);
  if (!Number.isFinite(amount) || amount <= 0) return 0;
  if (!Number.isFinite(percentage) || percentage <= 0) return 0;
  return roundMoney((amount * percentage) / 100);
}

export function computeCpoFromBidAndReserve(
  bidAmount: number,
  reservePrice: number,
  cpoPercentage: number,
): number {
  const bid = Number(bidAmount);
  const reserve = Number(reservePrice);
  const rate = Number(cpoPercentage);
  if (!Number.isFinite(bid) || bid <= 0) return 0;
  if (!Number.isFinite(reserve) || reserve <= 0) return 0;
  if (!Number.isFinite(rate) || rate <= 0) return 0;
  return roundMoney((bid * rate) / 100);
}

type ProposedBid = { auctionAssetId?: string | null; amount: number };
type LotReserve = { id: string; reservePrice: number };

function resolveReserveForBid(
  entry: ProposedBid,
  lots: LotReserve[],
  auctionReservePrice?: number | null,
): number {
  const lotId = entry.auctionAssetId ?? null;
  if (lotId && lots.length > 0) {
    const lot = lots.find((item) => item.id === lotId);
    const lotReserve = Number(lot?.reservePrice);
    if (Number.isFinite(lotReserve) && lotReserve > 0) return lotReserve;
  }

  const fallback = Number(auctionReservePrice);
  return Number.isFinite(fallback) && fallback > 0 ? fallback : 0;
}

/** Total required CPO from saved or in-progress bid amounts (percentage of each bid). */
export function computeRequiredCpoFromBidAmounts(
  proposedBids: ProposedBid[],
  cpoPercentage: number,
  lots: LotReserve[] = [],
  auctionReservePrice?: number | null,
): number {
  const percentage = Number(cpoPercentage);
  if (!Array.isArray(proposedBids) || proposedBids.length === 0) return 0;
  if (!Number.isFinite(percentage) || percentage <= 0) return 0;

  const total = proposedBids.reduce((sum, entry) => {
    const amount = Number(entry.amount);
    if (!Number.isFinite(amount) || amount <= 0) return sum;

    const reserve = resolveReserveForBid(entry, lots, auctionReservePrice);
    if (reserve <= 0) {
      return sum + computeCpoFromBidAmount(amount, percentage);
    }
    return sum + computeCpoFromBidAndReserve(amount, reserve, percentage);
  }, 0);

  return roundMoney(total);
}
