'use strict';

async function dropIndexIfExists(queryInterface, tableName, indexName) {
  const [rows] = await queryInterface.sequelize.query(
    `SELECT 1 AS found
     FROM INFORMATION_SCHEMA.STATISTICS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = :tableName
       AND INDEX_NAME = :indexName
     LIMIT 1`,
    { replacements: { tableName, indexName } },
  );

  if (rows.length === 0) {
    return;
  }

  await queryInterface.sequelize.query(
    `ALTER TABLE \`${tableName}\` DROP INDEX \`${indexName}\``,
  );
}

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const bidsTable = await queryInterface.describeTable('bids');

    if (!bidsTable.auction_asset_id) {
      await queryInterface.sequelize.query(`
        ALTER TABLE bids
        ADD COLUMN auction_asset_id CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NULL
          AFTER user_id,
        ADD KEY bids_auction_asset_id_idx (auction_asset_id),
        ADD CONSTRAINT bids_auction_asset_id_fk
          FOREIGN KEY (auction_asset_id) REFERENCES auction_assets (id)
          ON DELETE SET NULL ON UPDATE CASCADE
      `);
    }

    await queryInterface.sequelize.query(`
      UPDATE bids b
      INNER JOIN auction_assets aa ON aa.auction_id = b.auction_id
      SET b.auction_asset_id = aa.id
      WHERE b.auction_asset_id IS NULL
    `);

    await dropIndexIfExists(queryInterface, 'bids', 'unique_bidder_per_auction');

    await queryInterface.addIndex('bids', ['auction_id', 'user_id', 'auction_asset_id'], {
      unique: true,
      name: 'bids_auction_user_lot_unique',
    });

    const winnersTable = await queryInterface.describeTable('winners');

    if (!winnersTable.auction_asset_id) {
      await queryInterface.sequelize.query(`
        ALTER TABLE winners
        ADD COLUMN auction_asset_id CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NULL
          AFTER bid_id,
        ADD KEY winners_auction_asset_id_idx (auction_asset_id),
        ADD CONSTRAINT winners_auction_asset_id_fk
          FOREIGN KEY (auction_asset_id) REFERENCES auction_assets (id)
          ON DELETE SET NULL ON UPDATE CASCADE
      `);
    }

    await queryInterface.sequelize.query(`
      UPDATE winners w
      INNER JOIN auction_assets aa ON aa.auction_id = w.auction_id
      SET w.auction_asset_id = aa.id
      WHERE w.auction_asset_id IS NULL
    `);

    await dropIndexIfExists(queryInterface, 'winners', 'auction_id');
    await dropIndexIfExists(queryInterface, 'winners', 'winners_auction_id_unique');

    await queryInterface.addIndex('winners', ['auction_id', 'auction_asset_id'], {
      unique: true,
      name: 'winners_auction_lot_unique',
    });

    const cposTable = await queryInterface.describeTable('cpos');

    if (!cposTable.selected_auction_asset_ids) {
      await queryInterface.addColumn('cpos', 'selected_auction_asset_ids', {
        type: Sequelize.JSON,
        allowNull: true,
        after: 'document_url',
      });
    }

    if (!cposTable.required_cpo_amount) {
      await queryInterface.addColumn('cpos', 'required_cpo_amount', {
        type: Sequelize.DECIMAL(18, 2),
        allowNull: true,
        after: 'selected_auction_asset_ids',
      });
    }

    if (!cposTable.declared_cpo_amount) {
      await queryInterface.addColumn('cpos', 'declared_cpo_amount', {
        type: Sequelize.DECIMAL(18, 2),
        allowNull: true,
        after: 'required_cpo_amount',
      });
    }

    const [cpos] = await queryInterface.sequelize.query(`
      SELECT c.id, c.auction_id
      FROM cpos c
      WHERE c.deleted_at IS NULL
        AND c.selected_auction_asset_ids IS NULL
    `);

    for (const cpo of cpos) {
      const [lots] = await queryInterface.sequelize.query(
        `SELECT id FROM auction_assets WHERE auction_id = :auctionId ORDER BY sort_order ASC, created_at ASC LIMIT 1`,
        { replacements: { auctionId: cpo.auction_id } },
      );

      if (lots.length === 0) {
        continue;
      }

      const lotId = lots[0].id;
      await queryInterface.sequelize.query(
        `UPDATE cpos
         SET selected_auction_asset_ids = :selectedIds
         WHERE id = :cpoId`,
        {
          replacements: {
            cpoId: cpo.id,
            selectedIds: JSON.stringify([lotId]),
          },
        },
      );
    }
  },

  async down(queryInterface) {
    await dropIndexIfExists(queryInterface, 'bids', 'bids_auction_user_lot_unique');
    await dropIndexIfExists(queryInterface, 'winners', 'winners_auction_lot_unique');

    await queryInterface.addIndex('bids', ['auction_id', 'user_id'], {
      unique: true,
      name: 'unique_bidder_per_auction',
    }).catch(() => {});

    await queryInterface.addIndex('winners', ['auction_id'], {
      unique: true,
      name: 'winners_auction_id_unique',
    }).catch(() => {});

    const cposTable = await queryInterface.describeTable('cpos');
    if (cposTable.declared_cpo_amount) {
      await queryInterface.removeColumn('cpos', 'declared_cpo_amount');
    }
    if (cposTable.required_cpo_amount) {
      await queryInterface.removeColumn('cpos', 'required_cpo_amount');
    }
    if (cposTable.selected_auction_asset_ids) {
      await queryInterface.removeColumn('cpos', 'selected_auction_asset_ids');
    }

    const winnersTable = await queryInterface.describeTable('winners');
    if (winnersTable.auction_asset_id) {
      await queryInterface.removeColumn('winners', 'auction_asset_id');
    }

    const bidsTable = await queryInterface.describeTable('bids');
    if (bidsTable.auction_asset_id) {
      await queryInterface.removeColumn('bids', 'auction_asset_id');
    }
  },
};
