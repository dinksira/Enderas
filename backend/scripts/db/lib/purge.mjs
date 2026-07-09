import { sequelize } from '../../../src/config/db.config.js';
import {
  ALL_TEST_MOBILES,
  ALL_TEST_STAFF_IDS,
  ALL_TEST_USER_IDS,
  SEED_AUCTION_IDS,
  SEED_ASSET_IDS,
  SEED_ASSET_OWNER_ID,
  SEED_EVALUATION_IDS,
  SEED_AUCTION_ASSET_IDS,
  SEED_LOT_GROUP_IDS,
} from '../data/seed-ids.mjs';

async function disableForeignKeyChecks(transaction) {
  await sequelize.query('SET FOREIGN_KEY_CHECKS = 0', { transaction });
}

async function enableForeignKeyChecks(transaction) {
  await sequelize.query('SET FOREIGN_KEY_CHECKS = 1', { transaction });
}

async function safeQuery(sql, replacements, transaction) {
  try {
    await sequelize.query(sql, { replacements, transaction });
  } catch (error) {
    if (error?.original?.code === 'ER_NO_SUCH_TABLE') {
      return;
    }
    throw error;
  }
}

async function deleteByIds(table, ids, transaction) {
  if (ids.length === 0) {
    return;
  }

  await safeQuery(`DELETE FROM \`${table}\` WHERE id IN (:ids)`, { ids }, transaction);
}

async function deleteAuctionDependents(auctionIds, transaction) {
  if (auctionIds.length === 0) {
    return;
  }

  const tables = [
    ['bid_drafts', 'auction_id'],
    ['bids', 'auction_id'],
    ['cpos', 'auction_id'],
    ['payments', 'auction_id'],
    ['winners', 'auction_id'],
    ['auction_documents', 'auction_id'],
  ];

  for (const [table, column] of tables) {
    await safeQuery(
      `DELETE FROM \`${table}\` WHERE \`${column}\` IN (:auctionIds)`,
      { auctionIds },
      transaction,
    );
  }
}

export async function purgeTestCatalog({ transaction, logger = console }) {
  await deleteAuctionDependents(SEED_AUCTION_IDS, transaction);
  await deleteByIds('auction_assets', SEED_AUCTION_ASSET_IDS, transaction);
  await deleteByIds('lots', SEED_LOT_GROUP_IDS, transaction);
  await deleteByIds('auctions', SEED_AUCTION_IDS, transaction);
  await deleteByIds('evaluations', SEED_EVALUATION_IDS, transaction);
  await deleteByIds('assets', SEED_ASSET_IDS, transaction);
  await deleteByIds('asset_owners', [SEED_ASSET_OWNER_ID], transaction);
  logger.log('[purge] removed seeded auction catalog data');
}

export async function purgeTestUsers({ transaction, logger = console }) {
  await disableForeignKeyChecks(transaction);

  try {
    const users = await sequelize.query(
      `SELECT id FROM users WHERE mobile_number IN (:mobiles)`,
      {
        replacements: { mobiles: ALL_TEST_MOBILES },
        type: sequelize.QueryTypes.SELECT,
        transaction,
      },
    );

    const userIds = users.map((row) => row.id);
    if (userIds.length > 0) {
      await safeQuery(`DELETE FROM refresh_tokens WHERE user_id IN (:userIds)`, { userIds }, transaction);
    }

    await deleteByIds('staff', ALL_TEST_STAFF_IDS, transaction);

    if (userIds.length > 0) {
      await safeQuery(`DELETE FROM users WHERE id IN (:userIds)`, { userIds }, transaction);
    } else {
      await deleteByIds('users', ALL_TEST_USER_IDS, transaction);
    }

    logger.log('[purge] removed test users and staff profiles');
  } finally {
    await enableForeignKeyChecks(transaction);
  }
}

export async function purgeTestData({ transaction, logger = console }) {
  await purgeTestCatalog({ transaction, logger });
  await purgeTestUsers({ transaction, logger });
}
