import { formatEtbAmount } from '@enderass/shared/utils';

/**
 * @param {number} value
 * @param {'count' | 'totalValue'} type
 * @param {string} [currency]
 */
export function formatLandingStat(value, type = 'count', currency = 'ETB') {
  const n = Number(value);
  if (!Number.isFinite(n)) {
    return '—';
  }

  if (type === 'totalValue') {
    if (n >= 1_000_000_000) {
      return `${currency} ${(n / 1_000_000_000).toFixed(1)}B`;
    }
    if (n >= 1_000_000) {
      return `${currency} ${(n / 1_000_000).toFixed(1)}M`;
    }
    if (n === 0) {
      return `${currency} 0`;
    }
    return formatEtbAmount(n);
  }

  return new Intl.NumberFormat('en-ET').format(n);
}

export const CATEGORY_GLYPHS = Object.freeze({
  vehicles: '▣',
  land: '◫',
  buildings: '▤',
  machinery: '⚙',
  equipment: '⚒',
  salvage_assets: '◇',
  other_assets: '◆',
});

export const FLOW_STEPS = Object.freeze(['register', 'kyc', 'browse', 'cpo', 'bid']);

export const TRUST_ITEMS = Object.freeze(['https', 'audit', 'rbac', 'payments']);

/**
 * @param {object} auction
 * @returns {string|null}
 */
export function resolveAuctionImageUrl(auction) {
  if (auction?.imageUrl) {
    return toLoadableMediaUrl(auction.imageUrl);
  }

  let imageUrls = auction?.imageUrls;

  if (typeof imageUrls === 'string') {
    try {
      imageUrls = JSON.parse(imageUrls);
    } catch {
      imageUrls = [imageUrls];
    }
  }

  const first = Array.isArray(imageUrls) ? imageUrls[0] : null;
  if (!first) {
    return null;
  }

  return toLoadableMediaUrl(first);
}

/**
 * @param {string} url
 * @returns {string|null}
 */
export function toLoadableMediaUrl(url) {
  if (!url || typeof url !== 'string') {
    return null;
  }

  const trimmed = url.trim();
  if (!trimmed) {
    return null;
  }

  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }

  if (trimmed.startsWith('/api/')) {
    return trimmed;
  }

  if (trimmed.startsWith('/uploads/')) {
    return `/api${trimmed}`;
  }

  if (trimmed.startsWith('uploads/')) {
    return `/api/${trimmed}`;
  }

  return `/api/uploads/${trimmed.replace(/^\/+/, '')}`;
}

export default formatLandingStat;
