'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const { CHAR, STRING, TEXT, DATE, INTEGER, JSON } = Sequelize;

    // 1. Create lots table
    await queryInterface.createTable('lots', {
      id: { type: CHAR(36), allowNull: false, primaryKey: true },
      auction_id: { type: CHAR(36), allowNull: false },
      title: { type: STRING(255), allowNull: false },
      description: { type: TEXT, allowNull: true },
      sort_order: { type: INTEGER, allowNull: false, defaultValue: 0 },
      created_at: { type: DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      deleted_at: { type: DATE, allowNull: true },
    });

    await queryInterface.addIndex('lots', ['auction_id'], { name: 'lots_auction_id_idx' });
    await queryInterface.addIndex('lots', ['auction_id', 'sort_order'], { name: 'lots_sort_order_idx' });

    await queryInterface.sequelize.query(`
      ALTER TABLE lots
        ADD CONSTRAINT lots_auction_id_fk
          FOREIGN KEY (auction_id) REFERENCES auctions (id)
          ON DELETE CASCADE ON UPDATE CASCADE
    `);

    // 2. Add lot_id to auction_assets (nullable, after auction_id)
    await queryInterface.addColumn('auction_assets', 'lot_id', {
      type: CHAR(36),
      allowNull: true,
      after: 'auction_id',
    });

    await queryInterface.addIndex('auction_assets', ['lot_id'], { name: 'auction_assets_lot_id_idx' });

    await queryInterface.sequelize.query(`
      ALTER TABLE auction_assets
        ADD CONSTRAINT fk_auction_assets_lot_id
          FOREIGN KEY (lot_id) REFERENCES lots (id)
          ON DELETE SET NULL ON UPDATE CASCADE
    `);

    // 3. Add tags JSON to auction_assets (nullable, after lot_label)
    await queryInterface.addColumn('auction_assets', 'tags', {
      type: JSON,
      allowNull: true,
      after: 'lot_label',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('auction_assets', 'tags');
    await queryInterface.sequelize.query(`
      ALTER TABLE auction_assets DROP FOREIGN KEY fk_auction_assets_lot_id
    `);
    await queryInterface.removeIndex('auction_assets', 'auction_assets_lot_id_idx');
    await queryInterface.removeColumn('auction_assets', 'lot_id');
    await queryInterface.sequelize.query(`
      ALTER TABLE lots DROP FOREIGN KEY lots_auction_id_fk
    `);
    await queryInterface.dropTable('lots');
  },
};
