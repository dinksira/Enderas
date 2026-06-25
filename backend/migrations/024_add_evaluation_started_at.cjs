'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('evaluations', 'started_at', {
      type: Sequelize.DATE,
      allowNull: true,
      after: 'scheduled_at',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('evaluations', 'started_at');
  },
};
