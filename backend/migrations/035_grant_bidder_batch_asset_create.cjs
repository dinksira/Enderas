'use strict';

const BIDDER_ROLE_DESCRIPTION = {
  summary:
    'Participates in auctions, submits KYC, and requests auctions by submitting owned assets.',
  permissions: {
    modules: ['bids', 'payments', 'cpo', 'notifications', 'kyc', 'assets', 'files'],
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
      'POST /api/v1/assets/batch',
      'GET /api/v1/assets/my',
      'GET /api/v1/assets/:id',
      'PUT /api/v1/assets/:id',
      'POST /api/v1/files',
      'POST /api/v1/files/multiple',
    ],
  },
  permissionVersion: 4,
};

const PREVIOUS_BIDDER_ROLE_DESCRIPTION = {
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
          description: JSON.stringify(PREVIOUS_BIDDER_ROLE_DESCRIPTION),
        },
      },
    );
  },
};
