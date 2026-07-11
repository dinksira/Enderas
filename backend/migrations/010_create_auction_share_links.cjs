'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const { CHAR, DATE, STRING, TEXT, BOOLEAN, INTEGER, literal } = Sequelize;

    await queryInterface.createTable('auction_share_links', {
      id: { type: CHAR(36), allowNull: false, primaryKey: true },
      auction_id: { type: CHAR(36), allowNull: false },
      organization_name: { type: STRING(255), allowNull: false },
      contact_email: { type: STRING(255), allowNull: true },
      token: { type: STRING(64), allowNull: false, unique: true },
      password_hash: { type: STRING(255), allowNull: true },
      expires_at: { type: DATE, allowNull: true },
      max_views: { type: INTEGER.UNSIGNED, allowNull: true },
      view_count: { type: INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
      is_active: { type: BOOLEAN, allowNull: false, defaultValue: true },
      last_accessed_at: { type: DATE, allowNull: true },
      created_by_staff_id: { type: CHAR(36), allowNull: true },
      created_at: { type: DATE, allowNull: false, defaultValue: literal('CURRENT_TIMESTAMP') },
      updated_at: { type: DATE, allowNull: false, defaultValue: literal('CURRENT_TIMESTAMP') },
    });

    await queryInterface.addIndex('auction_share_links', ['auction_id'], {
      name: 'asl_auction_id_idx',
    });
    await queryInterface.addIndex('auction_share_links', ['token'], {
      name: 'asl_token_idx',
    });

    await queryInterface.sequelize.query(`
      ALTER TABLE auction_share_links
        ADD CONSTRAINT asl_auction_id_fk
          FOREIGN KEY (auction_id) REFERENCES auctions (id)
          ON DELETE CASCADE ON UPDATE CASCADE,
        ADD CONSTRAINT asl_created_by_staff_id_fk
          FOREIGN KEY (created_by_staff_id) REFERENCES staff (id)
          ON DELETE SET NULL ON UPDATE CASCADE
    `);
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(`
      ALTER TABLE auction_share_links
        DROP FOREIGN KEY asl_auction_id_fk,
        DROP FOREIGN KEY asl_created_by_staff_id_fk
    `);
    await queryInterface.dropTable('auction_share_links');
  },
};
