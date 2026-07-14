'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('users', 'avatar_url', {
      type: Sequelize.STRING(500),
      allowNull: true,
      defaultValue: null,
      after: 'preferred_language',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('users', 'avatar_url');
  },
};