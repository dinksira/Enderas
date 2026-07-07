'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(`
      ALTER TABLE bid_drafts
      MODIFY status ENUM('draft', 'locked', 'submitted', 'expired') NOT NULL DEFAULT 'draft'
    `);
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(`
      UPDATE bid_drafts SET status = 'draft' WHERE status = 'expired'
    `);
    await queryInterface.sequelize.query(`
      ALTER TABLE bid_drafts
      MODIFY status ENUM('draft', 'locked', 'submitted') NOT NULL DEFAULT 'draft'
    `);
  },
};
