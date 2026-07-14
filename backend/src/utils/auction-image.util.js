import { Op } from 'sequelize';
import { AuctionAsset } from '../models/auctionAsset.model.js';
import { Asset } from '../models/asset.model.js';
import { Evaluation } from '../models/evaluation.model.js';

/**
 * @param {unknown} raw
 * @returns {string[]}
 */
export function parseImageUrlList(raw) {
  if (!raw) {
    return [];
  }

  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (!trimmed) {
      return [];
    }
    if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
      try {
        return parseImageUrlList(JSON.parse(trimmed));
      } catch {
        return [trimmed];
      }
    }
    return [trimmed];
  }

  if (!Array.isArray(raw)) {
    return [];
  }

  return raw
    .map((entry) => {
      if (typeof entry === 'string') {
        return entry.trim();
      }
      if (entry && typeof entry.url === 'string') {
        return entry.url.trim();
      }
      return '';
    })
    .filter(Boolean);
}

/**
 * Normalize stored upload paths to a browser-loadable API path.
 * @param {string|null|undefined} url
 * @returns {string|null}
 */
export function normalizePublicImageUrl(url) {
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

  if (trimmed.startsWith('/api/uploads/')) {
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

/**
 * @param {string[]} candidates
 * @returns {string|null}
 */
export function pickFirstPublicImageUrl(candidates) {
  for (const candidate of candidates) {
    const normalized = normalizePublicImageUrl(candidate);
    if (normalized) {
      return normalized;
    }
  }
  return null;
}

/**
 * @param {object} auction Serialized auction row
 * @param {Map<string, object[]>} lotsByAuctionId
 * @param {Map<string, object>} assetsById
 * @returns {string|null}
 */
function resolveAuctionImageUrl(auction, lotsByAuctionId, assetsById) {
  const fromAuction = pickFirstPublicImageUrl(parseImageUrlList(auction.imageUrls));
  if (fromAuction) {
    return fromAuction;
  }

  const lots = lotsByAuctionId.get(auction.id) ?? [];
  const primaryAssetId = lots[0]?.asset_id ?? auction.assetId ?? null;
  if (!primaryAssetId) {
    return null;
  }

  const asset = assetsById.get(primaryAssetId);
  if (!asset) {
    return null;
  }

  const fromAsset = pickFirstPublicImageUrl(parseImageUrlList(asset.image_urls));
  if (fromAsset) {
    return fromAsset;
  }

  const fromEvaluation = pickFirstPublicImageUrl(
    parseImageUrlList(asset.evaluation?.photo_urls),
  );
  return fromEvaluation;
}

/**
 * Attach `imageUrl` to each public auction card from auction, lot, or asset photos.
 * @param {object[]} items
 * @returns {Promise<object[]>}
 */
export async function enrichAuctionsWithPrimaryImages(items) {
  if (!items?.length) {
    return [];
  }

  const auctionIds = items.map((item) => item.id);
  const directAssetIds = items.map((item) => item.assetId).filter(Boolean);

  const lots = await AuctionAsset.findAll({
    where: { auction_id: { [Op.in]: auctionIds } },
    attributes: ['auction_id', 'asset_id', 'sort_order', 'created_at'],
    order: [['sort_order', 'ASC'], ['created_at', 'ASC']],
    raw: true,
  });

  const lotsByAuctionId = new Map();
  lots.forEach((lot) => {
    if (!lotsByAuctionId.has(lot.auction_id)) {
      lotsByAuctionId.set(lot.auction_id, []);
    }
    lotsByAuctionId.get(lot.auction_id).push(lot);
  });

  const lotAssetIds = lots.map((lot) => lot.asset_id);
  const assetIds = [...new Set([...directAssetIds, ...lotAssetIds])];

  const assets = assetIds.length
    ? await Asset.findAll({
        where: { id: { [Op.in]: assetIds }, deleted_at: null },
        attributes: ['id', 'image_urls'],
        include: [
          {
            model: Evaluation,
            as: 'evaluation',
            required: false,
            attributes: ['photo_urls'],
          },
        ],
      })
    : [];

  const assetsById = new Map(
    assets.map((asset) => [asset.id, asset.get({ plain: true })]),
  );

  return items.map((auction) => {
    const imageUrl = resolveAuctionImageUrl(auction, lotsByAuctionId, assetsById);
    const imageUrls = parseImageUrlList(auction.imageUrls)
      .map((url) => normalizePublicImageUrl(url))
      .filter(Boolean);

    if (imageUrl && !imageUrls.includes(imageUrl)) {
      imageUrls.unshift(imageUrl);
    }

    return {
      ...auction,
      imageUrl,
      imageUrls,
    };
  });
}

export default {
  parseImageUrlList,
  normalizePublicImageUrl,
  pickFirstPublicImageUrl,
  enrichAuctionsWithPrimaryImages,
};
