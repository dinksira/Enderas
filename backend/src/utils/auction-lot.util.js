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
 * @param {Array<{ id: string, reserve_price?: number, reservePrice?: number }>} lots
 * @param {string[]} selectedLotIds
 * @param {number} cpoPercentage
 */
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
  computeRequiredCpoAmount,
};
