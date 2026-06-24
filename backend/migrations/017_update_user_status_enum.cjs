'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.changeColumn('users', 'status', {
      type: Sequelize.ENUM(
        'pending',
        'kyc_pending',
        'kyc_under_review',
        'kyc_rejected',
        'active',
        'suspended',
        'deactivated',
      ),
      allowNull: false,
      defaultValue: 'pending',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.changeColumn('users', 'status', {
      type: Sequelize.ENUM('pending', 'active', 'suspended', 'deactivated'),
      allowNull: false,
      defaultValue: 'pending',
    });
  },
};
