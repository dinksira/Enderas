/**
 * Applies bid_drafts schema when the DB was bootstrapped from SQL dump
 * without Sequelize migrations (common in local dev).
 */
import { sequelize } from '../src/config/db.config.js';

async function tableExists(name) {
  const [rows] = await sequelize.query(`SHOW TABLES LIKE '${name}'`);
  return rows.length > 0;
}

async function columnExists(table, column) {
  const [rows] = await sequelize.query(`SHOW COLUMNS FROM ${table} LIKE '${column}'`);
  return rows.length > 0;
}

try {
  await sequelize.authenticate();

  if (!(await tableExists('bid_drafts'))) {
    console.log('[patch] creating bid_drafts table...');
    await sequelize.query(`
      CREATE TABLE bid_drafts (
        id CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL PRIMARY KEY,
        user_id CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
        auction_id CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
        auction_asset_id CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NULL,
        amount DECIMAL(18, 2) NOT NULL,
        status ENUM('draft', 'locked', 'submitted') NOT NULL DEFAULT 'draft',
        cpo_id CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX bid_drafts_user_id_idx (user_id),
        INDEX bid_drafts_auction_id_idx (auction_id),
        INDEX bid_drafts_cpo_id_idx (cpo_id),
        INDEX bid_drafts_user_auction_idx (user_id, auction_id),
        UNIQUE INDEX bid_drafts_user_auction_lot_unique (user_id, auction_id, auction_asset_id),
        CONSTRAINT bid_drafts_user_id_fk FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT bid_drafts_auction_id_fk FOREIGN KEY (auction_id) REFERENCES auctions (id) ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT bid_drafts_auction_asset_id_fk FOREIGN KEY (auction_asset_id) REFERENCES auction_assets (id) ON DELETE SET NULL ON UPDATE CASCADE,
        CONSTRAINT bid_drafts_cpo_id_fk FOREIGN KEY (cpo_id) REFERENCES cpos (id) ON DELETE SET NULL ON UPDATE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin
    `);
    console.log('[patch] bid_drafts created');
  } else {
    console.log('[patch] bid_drafts already exists');
  }

  if (!(await columnExists('cpos', 'proposed_bids'))) {
    console.log('[patch] adding cpos.proposed_bids column...');
    await sequelize.query('ALTER TABLE cpos ADD COLUMN proposed_bids JSON NULL');
    console.log('[patch] cpos.proposed_bids added');
  } else {
    console.log('[patch] cpos.proposed_bids already exists');
  }

  console.log('[patch] done');
} catch (error) {
  console.error('[patch] failed:', error.message);
  process.exitCode = 1;
} finally {
  await sequelize.close();
}
