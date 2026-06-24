'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.changeColumn('assets', 'asset_type', {
      type: Sequelize.ENUM(
        'vehicle',
        'land',
        'building',
        'machinery',
        'equipment',
        'salvage',
        'other',
      ),
      allowNull: false,
    });

    await queryInterface.addColumn('assets', 'condition_notes', {
      type: Sequelize.TEXT,
      allowNull: true,
    });

    await queryInterface.addColumn('assets', 'image_urls', {
      type: Sequelize.JSON,
      allowNull: true,
    });

    await queryInterface.addColumn('assets', 'desired_reserve_price', {
      type: Sequelize.DECIMAL(15, 2),
      allowNull: true,
    });

    await queryInterface.addColumn('assets', 'auction_conditions', {
      type: Sequelize.TEXT,
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('assets', 'auction_conditions');
    await queryInterface.removeColumn('assets', 'desired_reserve_price');
    await queryInterface.removeColumn('assets', 'image_urls');
    await queryInterface.removeColumn('assets', 'condition_notes');

    await queryInterface.changeColumn('assets', 'asset_type', {
      type: Sequelize.ENUM('vehicle', 'land', 'building', 'machinery', 'other'),
      allowNull: false,
    });
  },
};
