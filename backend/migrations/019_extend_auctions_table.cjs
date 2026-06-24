'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(
      'ALTER TABLE `auctions` DROP FOREIGN KEY `auctions_ibfk_1`',
    ).catch(() => {});

    await queryInterface.changeColumn('auctions', 'asset_id', {
      type: Sequelize.CHAR(36),
      allowNull: true,
      defaultValue: null,
    });

    await queryInterface.sequelize.query(`
      ALTER TABLE \`auctions\`
      ADD CONSTRAINT \`auctions_ibfk_1\`
      FOREIGN KEY (\`asset_id\`) REFERENCES \`assets\`(\`id\`)
      ON DELETE SET NULL ON UPDATE CASCADE
    `).catch(() => {});

    await queryInterface.addColumn('auctions', 'category', {
      type: Sequelize.ENUM(
        'vehicles',
        'machinery',
        'buildings',
        'land',
        'equipment',
        'salvage_assets',
        'other_assets',
      ),
      allowNull: false,
      defaultValue: 'other_assets',
      after: 'title',
    });

    await queryInterface.addColumn('auctions', 'cpo_percentage', {
      type: Sequelize.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 1,
      after: 'document_price',
    });

    await queryInterface.addColumn('auctions', 'auction_conditions', {
      type: Sequelize.TEXT,
      allowNull: true,
      after: 'description',
    });

    await queryInterface.addColumn('auctions', 'image_urls', {
      type: Sequelize.JSON,
      allowNull: true,
      after: 'auction_conditions',
    });

    await queryInterface.addColumn('auctions', 'document_files', {
      type: Sequelize.JSON,
      allowNull: true,
      after: 'image_urls',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('auctions', 'document_files');
    await queryInterface.removeColumn('auctions', 'image_urls');
    await queryInterface.removeColumn('auctions', 'auction_conditions');
    await queryInterface.removeColumn('auctions', 'cpo_percentage');
    await queryInterface.removeColumn('auctions', 'category');
    await queryInterface.changeColumn('auctions', 'asset_id', {
      type: Sequelize.CHAR(36),
      allowNull: false,
    });
  },
};
