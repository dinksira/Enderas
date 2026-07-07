'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const { CHAR, DECIMAL, STRING, ENUM, DATE, TEXT } = Sequelize;

    await queryInterface.createTable('cpo_payments', {
      id: { type: CHAR(36), allowNull: false, primaryKey: true },
      cpo_id: { type: CHAR(36), allowNull: false },
      user_id: { type: CHAR(36), allowNull: false },
      auction_id: { type: CHAR(36), allowNull: false },
      amount: { type: DECIMAL(18, 2), allowNull: false },
      currency: { type: STRING(3), allowNull: false, defaultValue: 'ETB' },
      payment_method: {
        type: ENUM('addis_pay', 'manual'),
        allowNull: false,
      },
      receipt_url: { type: STRING(500), allowNull: true },
      transaction_reference: { type: STRING(255), allowNull: true },
      status: {
        type: ENUM('pending', 'approved', 'rejected'),
        allowNull: false,
        defaultValue: 'pending',
      },
      verified_by_staff_id: { type: CHAR(36), allowNull: true },
      verified_at: { type: DATE, allowNull: true },
      rejection_reason: { type: TEXT, allowNull: true },
      created_at: { type: DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });

    await queryInterface.addIndex('cpo_payments', ['cpo_id'], { name: 'cpo_payments_cpo_id_idx' });
    await queryInterface.addIndex('cpo_payments', ['status'], { name: 'cpo_payments_status_idx' });
    await queryInterface.addIndex('cpo_payments', ['user_id'], { name: 'cpo_payments_user_id_idx' });
    await queryInterface.addIndex('cpo_payments', ['auction_id'], { name: 'cpo_payments_auction_id_idx' });

    await queryInterface.sequelize.query(`
      ALTER TABLE cpo_payments
        ADD CONSTRAINT cpo_payments_cpo_id_fk
          FOREIGN KEY (cpo_id) REFERENCES cpos (id)
          ON DELETE CASCADE ON UPDATE CASCADE,
        ADD CONSTRAINT cpo_payments_user_id_fk
          FOREIGN KEY (user_id) REFERENCES users (id)
          ON UPDATE CASCADE,
        ADD CONSTRAINT cpo_payments_auction_id_fk
          FOREIGN KEY (auction_id) REFERENCES auctions (id)
          ON UPDATE CASCADE,
        ADD CONSTRAINT cpo_payments_verified_by_staff_id_fk
          FOREIGN KEY (verified_by_staff_id) REFERENCES staff (id)
          ON DELETE SET NULL ON UPDATE CASCADE
    `);
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(`
      ALTER TABLE cpo_payments
        DROP FOREIGN KEY cpo_payments_cpo_id_fk,
        DROP FOREIGN KEY cpo_payments_user_id_fk,
        DROP FOREIGN KEY cpo_payments_auction_id_fk,
        DROP FOREIGN KEY cpo_payments_verified_by_staff_id_fk
    `);
    await queryInterface.dropTable('cpo_payments');
  },
};
