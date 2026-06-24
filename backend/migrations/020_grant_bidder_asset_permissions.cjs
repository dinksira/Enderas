'use strict';

const BIDDER_ROLE_DESCRIPTION = {
  summary:
    'Participates in auctions, submits KYC, and requests auctions by submitting owned assets.',
  permissions: {
    modules: ['bids', 'payments', 'cpo', 'notifications', 'kyc', 'assets'],
    actions: ['create', 'read', 'update'],
    routes: [
      'POST /api/v1/bids',
      'GET /api/v1/bids/my',
      'POST /api/v1/payments',
      'GET /api/v1/payments',
      'POST /api/v1/cpo',
      'GET /api/v1/notifications',
      'POST /api/v1/kyc',
      'GET /api/v1/kyc/my',
      'POST /api/v1/kyc/resubmit',
      'POST /api/v1/assets',
      'GET /api/v1/assets/my',
      'GET /api/v1/assets/:id',
      'PUT /api/v1/assets/:id',
    ],
  },
  permissionVersion: 3,
};

const LEGACY_BIDDER_ROLE_DESCRIPTION = {
  summary: 'Participates in auctions by submitting bids and related payments.',
  permissions: {
    modules: ['bids', 'payments', 'cpo', 'notifications'],
    actions: ['create', 'read', 'update'],
    routes: [
      'POST /api/v1/bids',
      'GET /api/v1/bids/my',
      'POST /api/v1/payments',
      'GET /api/v1/payments',
      'POST /api/v1/cpo',
      'GET /api/v1/notifications',
    ],
  },
  permissionVersion: 1,
};

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(
      `UPDATE roles
       SET description = :description, updated_at = NOW()
       WHERE code = 'bidder'`,
      {
        replacements: {
          description: JSON.stringify(BIDDER_ROLE_DESCRIPTION),
        },
      },
    );
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(
      `UPDATE roles
       SET description = :description, updated_at = NOW()
       WHERE code = 'bidder'`,
      {
        replacements: {
          description: JSON.stringify(LEGACY_BIDDER_ROLE_DESCRIPTION),
        },
      },
    );
  },
};
