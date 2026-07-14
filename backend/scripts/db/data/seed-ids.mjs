import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

import { TEST_USER_IDS, TEST_STAFF_IDS, TEST_USER_MOBILES } from './test-users.mjs';
import {
  OPERATIONAL_STAFF_USER_IDS,
  OPERATIONAL_STAFF_STAFF_IDS,
  OPERATIONAL_STAFF_MOBILES,
} from './operational-staff.mjs';
import {
  SEED_AUCTION_IDS,
  SEED_LOT_GROUP_IDS,
  SEED_AUCTION_ASSET_IDS,
  SEED_LOT_IDS,
  SEED_ASSET_IDS,
  SEED_EVALUATION_IDS,
  SEED_ASSET_OWNER_ID,
  OWNER_USER_ID,
  BIDDER_USER_ID,
} from './auctions.mjs';

const require = createRequire(import.meta.url);
const rolePermissionsPath = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../../migrations/data/role-permissions.cjs',
);
const {
  ROLE_IDS,
  SUPER_ADMIN_USER_ID,
  SUPER_ADMIN_STAFF_ID,
  DEFAULT_SETTINGS,
} = require(rolePermissionsPath);

export const ALL_TEST_USER_IDS = Object.freeze([
  ...TEST_USER_IDS,
  ...OPERATIONAL_STAFF_USER_IDS,
]);

export const ALL_TEST_STAFF_IDS = Object.freeze([
  ...TEST_STAFF_IDS,
  ...OPERATIONAL_STAFF_STAFF_IDS,
]);

export const ALL_TEST_MOBILES = Object.freeze([
  ...TEST_USER_MOBILES,
  ...OPERATIONAL_STAFF_MOBILES,
]);

export const BASELINE_USER_IDS = Object.freeze([SUPER_ADMIN_USER_ID]);
export const BASELINE_STAFF_IDS = Object.freeze([SUPER_ADMIN_STAFF_ID]);
export const BASELINE_SETTING_IDS = Object.freeze(DEFAULT_SETTINGS.map((row) => row.id));
export const BASELINE_ROLE_IDS = Object.freeze(Object.values(ROLE_IDS));

export {
  ROLE_IDS,
  SUPER_ADMIN_USER_ID,
  SUPER_ADMIN_STAFF_ID,
  OWNER_USER_ID,
  BIDDER_USER_ID,
  SEED_AUCTION_IDS,
  SEED_LOT_GROUP_IDS,
  SEED_AUCTION_ASSET_IDS,
  SEED_LOT_IDS,
  SEED_ASSET_IDS,
  SEED_EVALUATION_IDS,
  SEED_ASSET_OWNER_ID,
};
