import { Auction } from '../models/auction.model.js';
import { Asset } from '../models/asset.model.js';
import { AssetOwner } from '../models/assetOwner.model.js';
import { AppError } from '../utils/error.util.js';

/**
 * @param {string} auctionId
 */
export async function findAuctionOwnerUserId(auctionId) {
  const auction = await Auction.findOne({
    where: { id: auctionId, deleted_at: null },
    attributes: ['owner_id'],
  });

  return auction?.owner_id ?? null;
}

/**
 * @param {string} userId
 * @param {string} auctionId
 */
export async function isUserAuctionOwner(userId, auctionId) {
  if (!userId || !auctionId) {
    return false;
  }

  const ownerUserId = await findAuctionOwnerUserId(auctionId);
  return Boolean(ownerUserId && ownerUserId === userId);
}

/**
 * @param {string} userId
 * @param {string} auctionId
 */
export async function assertNotAuctionOwner(userId, auctionId) {
  if (await isUserAuctionOwner(userId, auctionId)) {
    throw new AppError(
      'Asset owners cannot bid on or participate in their own auctions',
      403,
      'OWN_AUCTION_BIDDING_FORBIDDEN',
    );
  }
}

/**
 * Resolve the single asset-owner user for a set of catalog asset IDs.
 * @param {string[]} assetIds
 */
export async function resolveOwnerUserIdFromAssetIds(assetIds) {
  if (!assetIds.length) {
    return null;
  }

  const assets = await Asset.findAll({
    where: { id: assetIds, deleted_at: null },
    attributes: ['id', 'asset_owner_id'],
    include: [
      {
        model: AssetOwner,
        as: 'assetOwner',
        attributes: ['user_id'],
        required: true,
      },
    ],
  });

  if (assets.length !== assetIds.length) {
    throw new AppError('One or more assets were not found', 404, 'ASSET_NOT_FOUND');
  }

  const ownerUserIds = new Set(
    assets.map((asset) => asset.assetOwner?.user_id).filter(Boolean),
  );

  if (ownerUserIds.size !== 1) {
    throw new AppError(
      'All assets in an auction must belong to the same owner',
      400,
      'MIXED_ASSET_OWNERS',
    );
  }

  return [...ownerUserIds][0];
}
