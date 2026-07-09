import { VEHICLES_AUCTION } from './catalog/vehicles.mjs';
import { MACHINERY_AUCTION } from './catalog/machinery.mjs';
import { BUILDINGS_AUCTION } from './catalog/buildings.mjs';
import { LAND_AUCTION } from './catalog/land.mjs';

export const BIDDER_USER_ID = 'a1000002-0002-4002-8002-000000000002';
export const ADMIN_STAFF_ID = 'a2000001-0001-4001-8001-000000000001';
export const SEED_ASSET_OWNER_ID = 'b3000001-0001-4001-8001-000000000001';

/** Raw catalog definitions (image URLs resolved at seed time). */
export const SEED_AUCTION_CATALOG = Object.freeze([
  VEHICLES_AUCTION,
  MACHINERY_AUCTION,
  BUILDINGS_AUCTION,
  LAND_AUCTION,
]);

function flattenSeedAssets(auction) {
  return auction.lotGroups.flatMap((group) => group.assets);
}

export const SEED_AUCTION_IDS = Object.freeze(SEED_AUCTION_CATALOG.map((auction) => auction.id));

export const SEED_LOT_GROUP_IDS = Object.freeze(
  SEED_AUCTION_CATALOG.flatMap((auction) => auction.lotGroups.map((group) => group.id)),
);

export const SEED_AUCTION_ASSET_IDS = Object.freeze(
  SEED_AUCTION_CATALOG.flatMap((auction) => flattenSeedAssets(auction).map((asset) => asset.id)),
);

/** @deprecated Use SEED_AUCTION_ASSET_IDS */
export const SEED_LOT_IDS = SEED_AUCTION_ASSET_IDS;

export const SEED_ASSET_IDS = Object.freeze(
  SEED_AUCTION_CATALOG.flatMap((auction) => flattenSeedAssets(auction).map((asset) => asset.assetId)),
);

export const SEED_EVALUATION_IDS = Object.freeze(
  SEED_AUCTION_CATALOG.flatMap((auction) => flattenSeedAssets(auction).map((asset) => asset.evaluationId)),
);
