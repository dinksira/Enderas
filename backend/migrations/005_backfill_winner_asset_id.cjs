'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    // Backfill winners.auction_asset_id for legacy records
    // Where a winner has NULL auction_asset_id but the auction has exactly
    // one auction_asset, set the winner's auction_asset_id to that asset's id.
    // Multi-asset auctions where auction_asset_id is NULL are unrecoverable
    // and remain NULL (legacy path).
    await queryInterface.sequelize.query(`
      UPDATE winners w
        JOIN auction_assets aa ON aa.auction_id = w.auction_id
        SET w.auction_asset_id = aa.id
        WHERE w.auction_asset_id IS NULL
        AND (
          SELECT COUNT(*)
          FROM auction_assets
          WHERE auction_id = w.auction_id
        ) = 1
    `);
  },

  async down() {
    // No rollback — backfill is data-only, no schema change
  },
};
