'use strict';

/**
 * Consolidate the legacy asset_owner role into bidder.
 * The asset_owners table (user ↔ asset profile) is unchanged — only the RBAC role is retired.
 *
 * @type {import('sequelize-cli').Migration}
 */
module.exports = {
  async up(queryInterface) {
    const [bidderRows] = await queryInterface.sequelize.query(
      `SELECT id FROM roles WHERE code = 'bidder' LIMIT 1`,
    );
    const [assetOwnerRows] = await queryInterface.sequelize.query(
      `SELECT id FROM roles WHERE code = 'asset_owner' LIMIT 1`,
    );

    if (bidderRows.length === 0) {
      return;
    }

    const bidderRoleId = bidderRows[0].id;

    if (assetOwnerRows.length > 0) {
      const assetOwnerRoleId = assetOwnerRows[0].id;

      await queryInterface.sequelize.query(
        `UPDATE users
         SET role_id = :bidderRoleId, updated_at = NOW()
         WHERE role_id = :assetOwnerRoleId`,
        {
          replacements: { bidderRoleId, assetOwnerRoleId },
        },
      );

      await queryInterface.sequelize.query(
        `UPDATE roles
         SET is_active = 0, updated_at = NOW()
         WHERE code = 'asset_owner'`,
      );
    }
  },

  async down(queryInterface) {
    const [assetOwnerRows] = await queryInterface.sequelize.query(
      `SELECT id FROM roles WHERE code = 'asset_owner' LIMIT 1`,
    );

    if (assetOwnerRows.length === 0) {
      return;
    }

    await queryInterface.sequelize.query(
      `UPDATE roles SET is_active = 1, updated_at = NOW() WHERE code = 'asset_owner'`,
    );
  },
};
