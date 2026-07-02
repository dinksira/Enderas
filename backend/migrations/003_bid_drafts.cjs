'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const { CHAR, DECIMAL, DATE, ENUM } = Sequelize;

    await queryInterface.createTable('bid_drafts', {
      id: { type: CHAR(36), allowNull: false, primaryKey: true },
      user_id: { type: CHAR(36), allowNull: false },
      auction_id: { type: CHAR(36), allowNull: false },
      auction_asset_id: { type: CHAR(36), allowNull: true },
      amount: { type: DECIMAL(18, 2), allowNull: false },
      status: {
        type: ENUM('draft', 'locked', 'submitted'),
        allowNull: false,
        defaultValue: 'draft',
      },
      cpo_id: { type: CHAR(36), allowNull: true },
      created_at: { type: DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });

    await queryInterface.addIndex('bid_drafts', ['user_id'], { name: 'bid_drafts_user_id_idx' });
    await queryInterface.addIndex('bid_drafts', ['auction_id'], { name: 'bid_drafts_auction_id_idx' });
    await queryInterface.addIndex('bid_drafts', ['cpo_id'], { name: 'bid_drafts_cpo_id_idx' });
    await queryInterface.addIndex('bid_drafts', ['user_id', 'auction_id'], {
      name: 'bid_drafts_user_auction_idx',
    });
    await queryInterface.addIndex('bid_drafts', ['user_id', 'auction_id', 'auction_asset_id'], {
      unique: true,
      name: 'bid_drafts_user_auction_lot_unique',
    });

    await queryInterface.addColumn('cpos', 'proposed_bids', {
      type: Sequelize.JSON,
      allowNull: true,
    });

    await queryInterface.sequelize.query(`
      ALTER TABLE bid_drafts
        ADD CONSTRAINT bid_drafts_user_id_fk
          FOREIGN KEY (user_id) REFERENCES users (id)
          ON DELETE CASCADE ON UPDATE CASCADE,
        ADD CONSTRAINT bid_drafts_auction_id_fk
          FOREIGN KEY (auction_id) REFERENCES auctions (id)
          ON DELETE CASCADE ON UPDATE CASCADE,
        ADD CONSTRAINT bid_drafts_auction_asset_id_fk
          FOREIGN KEY (auction_asset_id) REFERENCES auction_assets (id)
          ON DELETE SET NULL ON UPDATE CASCADE,
        ADD CONSTRAINT bid_drafts_cpo_id_fk
          FOREIGN KEY (cpo_id) REFERENCES cpos (id)
          ON DELETE SET NULL ON UPDATE CASCADE
    `);
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('cpos', 'proposed_bids');
    await queryInterface.dropTable('bid_drafts');
  },
};
