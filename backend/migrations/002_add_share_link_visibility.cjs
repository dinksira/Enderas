'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('auction_share_links', 'visibility_settings', {
      type: Sequelize.JSON,
      allowNull: true,
      defaultValue: null,
      after: 'created_by_staff_id',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('auction_share_links', 'visibility_settings');
  },
};
