'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const cposInfo = await queryInterface.describeTable('cpos');

    // Align cpos.expiry_date with the Cpo model (DATEONLY).
    if (cposInfo.expiry_date) {
      await queryInterface.changeColumn('cpos', 'expiry_date', {
        type: Sequelize.DATEONLY,
        allowNull: true,
      });
    }
  },

  async down(queryInterface, Sequelize) {
    const cposInfo = await queryInterface.describeTable('cpos');

    if (cposInfo.expiry_date) {
      await queryInterface.changeColumn('cpos', 'expiry_date', {
        type: Sequelize.DATE,
        allowNull: true,
      });
    }
  },
};
