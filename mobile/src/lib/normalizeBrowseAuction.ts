import { toApiStringArray } from '@/lib/api-array';
import { resolveMediaUrl } from '@/lib/media-utils';
import type { AuctionAssetApi, AuctionDocumentApi, AuctionLotApi, BrowseAuctionApi } from '@/types/auctionApi';

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

function normalizeAssetImages(asset: AuctionAssetApi): string[] {
  const raw = asset.imageUrls ?? asset.assetImages ?? [];
  return toApiStringArray(raw)
    .map((url) => resolveMediaUrl(url))
    .filter((url): url is string => Boolean(url));
}

function normalizeAsset(asset: AuctionAssetApi, lot: AuctionLotApi): AuctionAssetApi {
  return {
    ...asset,
    auctionId: asset.auctionId ?? '',
    lotId: asset.lotId ?? lot.id,
    lotTitle: asset.lotTitle ?? lot.title,
    lotLabel: asset.lotLabel ?? lot.title,
    imageUrls: normalizeAssetImages(asset),
    tags: Array.isArray(asset.tags) ? asset.tags : [],
  };
}

function normalizeLot(lot: AuctionLotApi, index: number): AuctionLotApi {
  const assets = Array.isArray(lot.assets) ? lot.assets : [];
  return {
    ...lot,
    title: typeof lot.title === 'string' && lot.title.length > 0 ? lot.title : `Lot ${index + 1}`,
    sortOrder: Number.isFinite(Number(lot.sortOrder)) ? Number(lot.sortOrder) : index,
    assets: assets.map((asset) => normalizeAsset(asset, lot)),
  };
}

export function flattenAuctionAssets(lots: AuctionLotApi[]): AuctionAssetApi[] {
  return lots.flatMap((lot) => lot.assets ?? []);
}

export function normalizeBrowseAuctionApi(auction: BrowseAuctionApi): BrowseAuctionApi {
  const lots = Array.isArray(auction.lots) ? auction.lots : [];
  const normalizedLots = lots.map(normalizeLot);
  const assetCount = flattenAuctionAssets(normalizedLots).length;

  return {
    ...auction,
    documents: normalizeDocuments(auction.documents),
    imageUrls: toApiStringArray(auction.imageUrls)
      .map((url) => resolveMediaUrl(url))
      .filter((url): url is string => Boolean(url)),
    lots: normalizedLots,
    lotCount: auction.lotCount ?? normalizedLots.length,
    assetCount: auction.assetCount ?? assetCount,
    status: typeof auction.status === 'string' ? auction.status : 'PENDING',
    title: typeof auction.title === 'string' ? auction.title : 'Auction',
    description: typeof auction.description === 'string' ? auction.description : '',
    category: typeof auction.category === 'string' ? auction.category : 'other_assets',
  };
}
