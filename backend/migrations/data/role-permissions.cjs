'use strict';

const NOTIFICATION_ROUTES = Object.freeze([
  'GET /api/v1/notifications',
  'GET /api/v1/notifications/unread-count',
  'GET /api/v1/notifications/:id',
  'POST /api/v1/notifications/:id/read',
  'POST /api/v1/notifications/read-all',
]);

const FILE_UPLOAD_ROUTES = Object.freeze([
  'POST /api/v1/files',
  'POST /api/v1/files/multiple',
]);

const ROLE_IDS = Object.freeze({
  bidder: '3f64293e-93eb-4bc0-8839-5dadbfb12a5a',
  asset_owner: '5137cd9c-7fb4-456f-9665-f82727ddc065',
  super_admin: '5a214d89-26a2-470b-a22c-2a4820dff6e8',
  evaluation_officer: 'b5ba62e8-b8eb-4ffb-83f5-f02c398fd22c',
  finance_officer: 'bebdb975-949e-4193-beac-db07b7589967',
  auction_manager: 'c29ccb62-0d88-4746-8051-80cd2fce91d9',
  customer_service_officer: 'fbfe54b5-cb71-4c46-9543-61b5e87521ab',
});

const SUPER_ADMIN_USER_ID = 'f6e697d1-dbe9-472e-abbb-648f410127cc';
const SUPER_ADMIN_STAFF_ID = '29dd14ea-127d-4345-bf02-4ccd0e1ecb36';
const SUPER_ADMIN_PASSWORD_HASH = '$2b$12$KqPopy9eLE1v4IycnsYdm.Z45lFLY9wGQWOXY6xmjl89m7zgBVBKa';

const ROLE_SEEDS = Object.freeze([
  {
    id: ROLE_IDS.bidder,
    name: 'Bidder',
    code: 'bidder',
    is_active: 1,
    description: {
      summary: 'Participates in auctions, submits KYC, and requests auctions by submitting owned assets.',
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
          ...FILE_UPLOAD_ROUTES,
        ],
      },
      permissionVersion: 5,
    },
  },
  {
    id: ROLE_IDS.asset_owner,
    name: 'Asset Owner',
    code: 'asset_owner',
    is_active: 0,
    description: {
      summary: 'Registers and manages owned assets for auction.',
      permissions: {
        modules: ['assets', 'payments'],
        actions: ['create', 'read', 'update'],
        routes: [
          'POST /api/v1/assets',
          'GET /api/v1/assets',
          'PUT /api/v1/assets/:id',
          'DELETE /api/v1/assets/:id',
          'POST /api/v1/payments',
          'GET /api/v1/payments',
        ],
      },
      permissionVersion: 1,
    },
  },
  {
    id: ROLE_IDS.super_admin,
    name: 'Super Administrator',
    code: 'super_admin',
    is_active: 1,
    description: {
      summary: 'Full system access including staff management and all modules.',
      permissions: {
        modules: ['*'],
        actions: ['create', 'read', 'update', 'delete', 'approve', 'reject', 'publish', 'close', 'export'],
        routes: ['*'],
      },
      permissionVersion: 2,
    },
  },
  {
    id: ROLE_IDS.evaluation_officer,
    name: 'Evaluation Officer',
    code: 'evaluation_officer',
    is_active: 1,
    description: {
      summary: 'Schedules evaluations, records valuation data, and submits recommendations.',
      permissions: {
        modules: ['evaluations', 'assets', 'dashboard', 'notifications', 'files'],
        actions: ['create', 'read', 'update'],
        moduleActions: {
          files: ['create'],
        },
        routes: [
          'POST /api/v1/evaluations',
          'GET /api/v1/evaluations',
          'GET /api/v1/evaluations/:id',
          'GET /api/v1/evaluations/eligible-assets',
          'PUT /api/v1/evaluations/:id',
          'POST /api/v1/evaluations/:id/start',
          'POST /api/v1/evaluations/:id/complete',
          'POST /api/v1/evaluations/:id/reschedule',
          'GET /api/v1/assets',
          'GET /api/v1/assets/:id',
          'GET /api/v1/dashboard',
          ...NOTIFICATION_ROUTES,
          ...FILE_UPLOAD_ROUTES,
        ],
      },
      permissionVersion: 6,
    },
  },
  {
    id: ROLE_IDS.finance_officer,
    name: 'Finance Officer',
    code: 'finance_officer',
    is_active: 1,
    description: {
      summary: 'Verifies and manages payments and financial records.',
      permissions: {
        modules: ['payments', 'dashboard', 'notifications'],
        actions: ['read', 'approve', 'reject', 'export', 'update'],
        routes: [
          'GET /api/v1/payments',
          'POST /api/v1/payments/:id/approve',
          'POST /api/v1/payments/:id/reject',
          'GET /api/v1/dashboard',
          'GET /api/v1/dashboard/reports',
          'GET /api/v1/dashboard/reports/export',
          ...NOTIFICATION_ROUTES,
        ],
      },
      permissionVersion: 3,
    },
  },
  {
    id: ROLE_IDS.auction_manager,
    name: 'Auction Manager',
    code: 'auction_manager',
    is_active: 1,
    description: {
      summary: 'Creates and manages auctions; ownership review and publishing are handled by other roles.',
      permissions: {
        modules: ['auctions', 'assets', 'documents', 'bids', 'winners', 'cpo', 'dashboard', 'notifications', 'files'],
        actions: ['create', 'read', 'update', 'delete', 'close'],
        moduleActions: {
          assets: ['read'],
          auctions: ['create', 'read', 'update', 'delete', 'close'],
          cpo: ['read', 'approve', 'reject'],
          files: ['create'],
        },
        routes: [
          'GET /api/v1/auctions',
          'GET /api/v1/auctions/:id',
          'GET /api/v1/auctions/eligible-assets',
          'POST /api/v1/auctions',
          'PUT /api/v1/auctions/:id',
          'POST /api/v1/auctions/:id/close',
          'GET /api/v1/assets',
          'GET /api/v1/assets/:id',
          'GET /api/v1/documents',
          'POST /api/v1/documents',
          'GET /api/v1/bids/auction/:auctionId',
          'POST /api/v1/winners',
          'GET /api/v1/cpo',
          'POST /api/v1/cpo/:id/approve',
          'POST /api/v1/cpo/:id/reject',
          'GET /api/v1/dashboard',
          ...NOTIFICATION_ROUTES,
          ...FILE_UPLOAD_ROUTES,
        ],
      },
      permissionVersion: 6,
    },
  },
  {
    id: ROLE_IDS.customer_service_officer,
    name: 'Customer Service Officer',
    code: 'customer_service_officer',
    is_active: 1,
    description: {
      summary: 'Handles user support, KYC review, and customer-facing operations.',
      permissions: {
        modules: ['users', 'kyc', 'assets', 'cpo', 'dashboard', 'evaluations', 'notifications'],
        actions: ['read', 'approve', 'reject', 'update'],
        routes: [
          'GET /api/v1/users',
          'GET /api/v1/users/:id',
          'PUT /api/v1/users/:id',
          'POST /api/v1/users/:id/status',
          'GET /api/v1/kyc',
          'GET /api/v1/kyc/:id',
          'GET /api/v1/kyc/:id/audit',
          'POST /api/v1/kyc/:id/mark-under-review',
          'POST /api/v1/kyc/:id/approve',
          'POST /api/v1/kyc/:id/reject',
          'GET /api/v1/assets',
          'GET /api/v1/assets/:id',
          'POST /api/v1/assets/:id/approve',
          'POST /api/v1/assets/:id/reject',
          'GET /api/v1/evaluations',
          'GET /api/v1/evaluations/:id',
          'GET /api/v1/cpo',
          'POST /api/v1/cpo/:id/approve',
          'POST /api/v1/cpo/:id/reject',
          'GET /api/v1/dashboard',
          ...NOTIFICATION_ROUTES,
        ],
      },
      permissionVersion: 3,
    },
  },
]);

const DEFAULT_SETTINGS = Object.freeze([
  {
    id: 'a3000001-0001-4001-8001-000000000001',
    setting_key: 'localization.default_language',
    setting_value: 'en',
    description: 'Default UI language code',
  },
  {
    id: 'a3000002-0002-4002-8002-000000000002',
    setting_key: 'localization.supported_languages',
    setting_value: ['en', 'am'],
    description: 'Supported UI language codes',
  },
  {
    id: 'a3000003-0003-4003-8003-000000000003',
    setting_key: 'auction.default_currency',
    setting_value: 'ETB',
    description: 'Default auction currency',
  },
  {
    id: 'a3000004-0004-4004-8004-000000000004',
    setting_key: 'auction.default_cpo_percentage',
    setting_value: 1,
    description: 'Default CPO percentage',
  },
  {
    id: 'a3000005-0005-4005-8005-000000000005',
    setting_key: 'auction.min_bid_increment',
    setting_value: 1000,
    description: 'Minimum bid increment amount',
  },
  {
    id: 'a3000006-0006-4006-8006-000000000006',
    setting_key: 'otp.ttl_seconds',
    setting_value: 300,
    description: 'OTP time-to-live in seconds',
  },
  {
    id: 'a3000007-0007-4007-8007-000000000007',
    setting_key: 'storage.max_file_size',
    setting_value: 5242880,
    description: 'Maximum upload file size in bytes',
  },
]);

module.exports = {
  ROLE_IDS,
  ROLE_SEEDS,
  DEFAULT_SETTINGS,
  SUPER_ADMIN_USER_ID,
  SUPER_ADMIN_STAFF_ID,
  SUPER_ADMIN_PASSWORD_HASH,
};
