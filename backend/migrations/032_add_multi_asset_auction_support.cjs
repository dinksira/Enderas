'use strict';

const { randomUUID } = require('crypto');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable('auctions');

    if (!table.auction_mode) {
      await queryInterface.addColumn('auctions', 'auction_mode', {
        type: Sequelize.ENUM('single', 'multi'),
        allowNull: false,
        defaultValue: 'single',
        after: 'status',
      });
    }

    if (!table.total_reserve_price) {
      await queryInterface.addColumn('auctions', 'total_reserve_price', {
        type: Sequelize.DECIMAL(18, 2),
        allowNull: true,
        after: 'reserve_price',
      });
    }

    const auctionAssetsExists = await queryInterface
      .describeTable('auction_assets')
      .then(() => true)
      .catch(() => false);

    if (!auctionAssetsExists) {
      await queryInterface.sequelize.query(`
        CREATE TABLE auction_assets (
          id CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
          auction_id CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
          asset_id CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
          reserve_price DECIMAL(18,2) NOT NULL,
          sort_order INT NOT NULL DEFAULT 0,
          lot_label VARCHAR(50) NULL,
          outcome_status ENUM('pending', 'sold', 'unsold', 'withdrawn') NOT NULL DEFAULT 'pending',
          created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          PRIMARY KEY (id),
          UNIQUE KEY auction_assets_auction_id_asset_id_unique (auction_id, asset_id),
          KEY auction_assets_auction_id_idx (auction_id),
          KEY auction_assets_asset_id_idx (asset_id),
          CONSTRAINT auction_assets_auction_id_fk
            FOREIGN KEY (auction_id) REFERENCES auctions (id)
            ON DELETE CASCADE ON UPDATE CASCADE,
          CONSTRAINT auction_assets_asset_id_fk
            FOREIGN KEY (asset_id) REFERENCES assets (id)
            ON DELETE RESTRICT ON UPDATE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
      `);
    }

    const [linkedAuctions] = await queryInterface.sequelize.query(`
      SELECT id, asset_id, reserve_price
      FROM auctions
      WHERE deleted_at IS NULL
        AND asset_id IS NOT NULL
    `);

    for (const auction of linkedAuctions) {
      const [existing] = await queryInterface.sequelize.query(
        `SELECT id FROM auction_assets WHERE auction_id = :auctionId LIMIT 1`,
        { replacements: { auctionId: auction.id } },
      );

      if (existing.length > 0) {
        continue;
      }

      await queryInterface.sequelize.query(
        `INSERT INTO auction_assets (
          id, auction_id, asset_id, reserve_price, sort_order, lot_label, outcome_status, created_at, updated_at
        ) VALUES (
          :id, :auctionId, :assetId, :reservePrice, 0, 'Lot 1', 'pending', NOW(), NOW()
        )`,
        {
          replacements: {
            id: randomUUID(),
            auctionId: auction.id,
            assetId: auction.asset_id,
            reservePrice: auction.reserve_price,
          },
        },
      );
    }

    await queryInterface.sequelize.query(`
      UPDATE auctions
      SET auction_mode = 'single'
      WHERE deleted_at IS NULL
    `);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('auction_assets').catch(() => {});

    const table = await queryInterface.describeTable('auctions');

    if (table.total_reserve_price) {
      await queryInterface.removeColumn('auctions', 'total_reserve_price');
    }

    if (table.auction_mode) {
      await queryInterface.removeColumn('auctions', 'auction_mode');
    }
  },
};
