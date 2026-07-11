'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const { CHAR, DATE } = Sequelize;

    await queryInterface.createTable('organization_auctions', {
      id: { type: CHAR(36), allowNull: false, primaryKey: true },
      organization_user_id: { type: CHAR(36), allowNull: false },
      auction_id: { type: CHAR(36), allowNull: false },
      linked_by_staff_id: { type: CHAR(36), allowNull: true },
      created_at: { type: DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });

    await queryInterface.addIndex('organization_auctions', ['organization_user_id'], {
      name: 'org_auctions_org_user_id_idx',
    });
    await queryInterface.addIndex('organization_auctions', ['auction_id'], {
      name: 'org_auctions_auction_id_idx',
    });
    await queryInterface.addConstraint('organization_auctions', {
      fields: ['organization_user_id', 'auction_id'],
      type: 'unique',
      name: 'uq_org_user_auction',
    });

    await queryInterface.sequelize.query(`
      ALTER TABLE organization_auctions
        ADD CONSTRAINT org_auctions_org_user_id_fk
          FOREIGN KEY (organization_user_id) REFERENCES users (id)
          ON DELETE CASCADE ON UPDATE CASCADE,
        ADD CONSTRAINT org_auctions_auction_id_fk
          FOREIGN KEY (auction_id) REFERENCES auctions (id)
          ON DELETE CASCADE ON UPDATE CASCADE,
        ADD CONSTRAINT org_auctions_linked_by_staff_id_fk
          FOREIGN KEY (linked_by_staff_id) REFERENCES staff (id)
          ON DELETE SET NULL ON UPDATE CASCADE
    `);
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(`
      ALTER TABLE organization_auctions
        DROP FOREIGN KEY org_auctions_org_user_id_fk,
        DROP FOREIGN KEY org_auctions_auction_id_fk,
        DROP FOREIGN KEY org_auctions_linked_by_staff_id_fk
    `);
    await queryInterface.dropTable('organization_auctions');
  },
};
