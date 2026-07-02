export function roundMoney(amount) {
  const value = Number(amount);
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Math.round(value * 100) / 100;
}

export function computeRequiredCpoFromBidAmounts(proposedBids, cpoPercentage) {
  const percentage = Number(cpoPercentage);
  if (!Array.isArray(proposedBids) || !proposedBids.length) {
    return 0;
  }
  if (!Number.isFinite(percentage) || percentage <= 0) {
    return 0;
  }

  const totalBidAmount = proposedBids.reduce((sum, entry) => {
    const amount = Number(entry?.amount);
    return Number.isFinite(amount) && amount > 0 ? sum + amount : sum;
  }, 0);

  if (totalBidAmount <= 0) {
    return 0;
  }

  return roundMoney((totalBidAmount * percentage) / 100);
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
  const lots = auction?.lots;
  if (Array.isArray(lots) && lots.length > 1) {
    return true;
  }
  return auction?.auctionMode === 'multi' || auction?.auction_mode === 'multi';
}
