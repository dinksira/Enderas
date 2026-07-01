import { toApiStringArray } from '@/lib/api-array';
import { resolveMediaUrl } from '@/lib/media-utils';
import type { BrowseAuctionApi } from '@/types/auctionApi';

export function normalizeBrowseAuctionApi(auction: BrowseAuctionApi): BrowseAuctionApi {
  return {
    ...auction,
    documents: (auction.documents ?? [])
      .map((doc) => ({
        ...doc,
        url: resolveMediaUrl(doc.url) ?? doc.url,
      }))
      .filter((doc) => Boolean(doc.url)),
    imageUrls: toApiStringArray(auction.imageUrls)
      .map((url) => resolveMediaUrl(url))
      .filter((url): url is string => Boolean(url)),
    lots: (auction.lots ?? []).map((lot) => ({
      ...lot,
      imageUrls: toApiStringArray(lot.imageUrls)
        .map((url) => resolveMediaUrl(url))
        .filter((url): url is string => Boolean(url)),
    })),
  };
}
