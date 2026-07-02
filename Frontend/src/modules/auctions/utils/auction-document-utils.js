import { ENV } from '../../../config/env.js';
import { useAuthStore } from '../../../stores/auth-store.js';
import { resolveMediaUrl } from '../../../utils/media-url.js';

export function getAuctionDocumentStreamUrl(auctionId, docIndex = 0) {
  return `${ENV.apiBaseUrl}${ENV.apiV1Prefix}/auctions/browse/${auctionId}/documents/${docIndex}/stream`;
}

export function resolveAuctionDocumentStreamUrl(auctionId, docIndex = 0, accessToken) {
  const streamUrl = getAuctionDocumentStreamUrl(auctionId, docIndex);
  const token = accessToken ?? useAuthStore.getState().accessToken;

  if (!token) {
    return streamUrl;
  }

  return `${streamUrl}?access_token=${encodeURIComponent(token)}`;
}

/**
 * Link target for an auction document row.
 * Paid bidder docs use the authenticated stream endpoint; staff/public assets use resolved upload URLs.
 */
export function resolveAuctionDocumentHref({
  auctionId,
  doc,
  docIndex = 0,
  unlocked = false,
  useStreamWhenUnlocked = true,
  accessToken,
}) {
  if (unlocked && auctionId && useStreamWhenUnlocked) {
    return resolveAuctionDocumentStreamUrl(auctionId, docIndex, accessToken);
  }

  const rawUrl = typeof doc === 'string'
    ? doc
    : (doc?.url || doc?.fileUrl || '');

  return resolveMediaUrl(rawUrl);
}
