import type { AuctionLot } from '@/types/auctionParticipation';
import type { AuctionAssetApi } from '@/types/auctionApi';

export function formatLotOrderLabel(sortOrder?: number): string {
  const order = Number.isFinite(Number(sortOrder)) ? Number(sortOrder) + 1 : 1;
  return `Lot-${order}`;
}

/** Collect unique gallery images: auction cover first, then all asset photos. */
export function collectAuctionGalleryImages(
  auctionImageUrls: string[],
  auctionAssets: AuctionAssetApi[],
): string[] {
  const fromAssets = auctionAssets.flatMap((asset) => asset.imageUrls ?? []);
  const seen = new Set<string>();
  const result: string[] = [];

  for (const url of [...auctionImageUrls, ...fromAssets]) {
    if (!url || seen.has(url)) continue;
    seen.add(url);
    result.push(url);
  }

  return result;
}

export function mapAuctionAssetForDisplay(asset: AuctionAssetApi): AuctionLot {
  return {
    id: asset.id,
    auctionId: asset.auctionId ?? '',
    lotLabel: asset.lotLabel ?? asset.lotTitle ?? 'Lot',
    lotTitle: asset.lotTitle,
    title: asset.assetTitle ?? asset.lotLabel ?? asset.lotTitle ?? 'Asset',
    description: asset.assetLocation ?? '',
    category: asset.assetType ?? 'other_assets',
    imageUrls: asset.imageUrls ?? [],
    tags: asset.tags ?? [],
    reservePrice: asset.reservePrice,
    sortOrder: asset.sortOrder ?? 0,
  };
}
