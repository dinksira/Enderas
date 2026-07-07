'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const { DECIMAL, ENUM, DATE, CHAR } = Sequelize;

    // 1. Add deposit_amount to cpos (nullable for legacy records)
    await queryInterface.addColumn('cpos', 'deposit_amount', {
      type: DECIMAL(18, 2),
      allowNull: true,
      after: 'declared_cpo_amount',
    });

    // 2. Add refund_status to cpos
    await queryInterface.addColumn('cpos', 'refund_status', {
      type: ENUM('none', 'pending', 'approved', 'paid'),
      allowNull: false,
      defaultValue: 'none',
      after: 'status',
    });

    await queryInterface.addIndex('cpos', ['refund_status'], { name: 'cpos_refund_status_idx' });

    // 3. Add refund_processed_at
    await queryInterface.addColumn('cpos', 'refund_processed_at', {
      type: DATE,
      allowNull: true,
      after: 'refund_status',
    });

    // 4. Add refund_processed_by_staff_id
    await queryInterface.addColumn('cpos', 'refund_processed_by_staff_id', {
      type: CHAR(36),
      allowNull: true,
      after: 'refund_processed_at',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('cpos', 'refund_processed_by_staff_id');
    await queryInterface.removeColumn('cpos', 'refund_processed_at');
    await queryInterface.removeIndex('cpos', 'cpos_refund_status_idx');
    await queryInterface.removeColumn('cpos', 'refund_status');
    await queryInterface.removeColumn('cpos', 'deposit_amount');
  },
};
