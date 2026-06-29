'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable('assets');

    if (!table.submission_batch_id) {
      await queryInterface.addColumn('assets', 'submission_batch_id', {
        type: Sequelize.CHAR(36),
        allowNull: true,
        after: 'asset_owner_id',
      });

      await queryInterface.addIndex('assets', ['submission_batch_id'], {
        name: 'assets_submission_batch_id_idx',
      });
    }
  },

  async down(queryInterface) {
    const table = await queryInterface.describeTable('assets');

    if (table.submission_batch_id) {
      await queryInterface.removeIndex('assets', 'assets_submission_batch_id_idx').catch(() => {});
      await queryInterface.removeColumn('assets', 'submission_batch_id');
    }
  },
};
