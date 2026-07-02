import { toApiStringArray } from '@/lib/api-array';
import { resolveMediaUrl } from '@/lib/media-utils';
import type { AuctionDocumentApi, BrowseAuctionApi } from '@/types/auctionApi';

function normalizeDocuments(value: unknown): AuctionDocumentApi[] {
  let items: unknown[] = [];

  if (Array.isArray(value)) {
    items = value;
  } else if (typeof value === 'string' && value.trim()) {
    try {
      const parsed = JSON.parse(value);
      items = Array.isArray(parsed) ? parsed : [];
    } catch {
      items = [];
    }
  }

  return items
    .filter((doc): doc is AuctionDocumentApi => Boolean(doc) && typeof doc === 'object')
    .map((doc) => ({
      ...doc,
      url: resolveMediaUrl(doc.url) ?? doc.url,
    }))
    .filter((doc) => Boolean(doc.url));
}

export function normalizeBrowseAuctionApi(auction: BrowseAuctionApi): BrowseAuctionApi {
  const lots = Array.isArray(auction.lots) ? auction.lots : [];

  return {
    ...auction,
    documents: normalizeDocuments(auction.documents),
    imageUrls: toApiStringArray(auction.imageUrls)
      .map((url) => resolveMediaUrl(url))
      .filter((url): url is string => Boolean(url)),
    lots: lots.map((lot) => ({
      ...lot,
      lotLabel: typeof lot.lotLabel === 'string' && lot.lotLabel.length > 0 ? lot.lotLabel : 'Lot',
      imageUrls: toApiStringArray(lot.imageUrls)
        .map((url) => resolveMediaUrl(url))
        .filter((url): url is string => Boolean(url)),
    })),
    status: typeof auction.status === 'string' ? auction.status : 'PENDING',
    title: typeof auction.title === 'string' ? auction.title : 'Auction',
    description: typeof auction.description === 'string' ? auction.description : '',
    category: typeof auction.category === 'string' ? auction.category : 'other_assets',
  };
}
