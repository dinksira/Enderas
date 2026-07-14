'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const auctionsInfo = await queryInterface.describeTable('auctions');
    if (!auctionsInfo.owner_id) {
      await queryInterface.addColumn('auctions', 'owner_id', {
        type: Sequelize.CHAR(36),
        allowNull: true,
        after: 'created_by_staff_id',
      });
      await queryInterface.addIndex('auctions', ['owner_id'], {
        name: 'auctions_owner_id_idx',
      });
    }

    const usersInfo = await queryInterface.describeTable('users');
    if (!usersInfo.profile_picture) {
      await queryInterface.addColumn('users', 'profile_picture', {
        type: Sequelize.STRING(500),
        allowNull: true,
        after: 'organization_name',
      });
    }
  },

  async down(queryInterface) {
    const auctionsInfo = await queryInterface.describeTable('auctions');
    if (auctionsInfo.owner_id) {
      await queryInterface.removeIndex('auctions', 'auctions_owner_id_idx');
      await queryInterface.removeColumn('auctions', 'owner_id');
    }

    const usersInfo = await queryInterface.describeTable('users');
    if (usersInfo.profile_picture) {
      await queryInterface.removeColumn('users', 'profile_picture');
    }
  },
};
