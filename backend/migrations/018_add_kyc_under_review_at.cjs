'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('kyc_verifications', 'under_review_at', {
      type: Sequelize.DATE,
      allowNull: true,
      after: 'review_notes',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('kyc_verifications', 'under_review_at');
  },
};
