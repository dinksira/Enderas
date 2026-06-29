'use strict';

const LEGACY_EVAL_OFFICER_DESCRIPTION = {
  summary: 'Creates and manages asset evaluations.',
  permissions: {
    modules: ['evaluations', 'assets', 'dashboard'],
    actions: ['create', 'read', 'update', 'delete', 'approve', 'reject', 'publish', 'close'],
    routes: [
      'POST /api/v1/evaluations',
      'GET /api/v1/evaluations',
      'GET /api/v1/evaluations/:id',
      'PUT /api/v1/evaluations/:id',
      'POST /api/v1/evaluations/:id/approve',
      'POST /api/v1/evaluations/:id/reject',
      'GET /api/v1/assets',
      'GET /api/v1/assets/:id',
      'GET /api/v1/dashboard',
    ],
  },
  permissionVersion: 2,
};

const LAUNCH_EVAL_OFFICER_DESCRIPTION = {
  summary: 'Schedules evaluations, records valuation data, and submits recommendations.',
  permissions: {
    modules: ['evaluations', 'assets', 'dashboard'],
    actions: ['create', 'read', 'update'],
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
    ],
  },
  permissionVersion: 3,
};

const LEGACY_AUCTION_MANAGER_DESCRIPTION = {
  summary: 'Manages auctions, asset reviews, documents, winners, and auction-related workflows.',
  permissions: {
    modules: ['auctions', 'assets', 'documents', 'bids', 'winners', 'cpo', 'dashboard'],
    actions: ['create', 'read', 'update', 'delete', 'approve', 'reject', 'publish', 'close'],
    routes: [
      'GET /api/v1/auctions',
      'POST /api/v1/auctions',
      'PUT /api/v1/auctions/:id',
      'POST /api/v1/auctions/:id/publish',
      'POST /api/v1/auctions/:id/close',
      'GET /api/v1/assets',
      'POST /api/v1/assets/:id/approve',
      'POST /api/v1/assets/:id/reject',
      'GET /api/v1/documents',
      'POST /api/v1/documents',
      'GET /api/v1/bids/auction/:auctionId',
      'POST /api/v1/winners',
      'GET /api/v1/cpo',
      'POST /api/v1/cpo/:id/approve',
      'POST /api/v1/cpo/:id/reject',
      'GET /api/v1/dashboard',
    ],
  },
  permissionVersion: 1,
};

const LAUNCH_AUCTION_MANAGER_DESCRIPTION = {
  summary: 'Creates and manages auctions; ownership review and publishing are handled by other roles.',
  permissions: {
    modules: ['auctions', 'assets', 'documents', 'bids', 'winners', 'cpo', 'dashboard'],
    actions: ['create', 'read', 'update', 'delete', 'close'],
    moduleActions: {
      assets: ['read'],
      auctions: ['create', 'read', 'update', 'delete', 'close'],
      cpo: ['read', 'approve', 'reject'],
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
    ],
  },
  permissionVersion: 2,
};

function parseDescription(description) {
  if (typeof description === 'string') {
    try {
      return JSON.parse(description);
    } catch {
      return {};
    }
  }
  return description && typeof description === 'object' ? description : {};
}

function mergeLaunchRoleDescription(currentDescription, launchDescription) {
  const parsed = parseDescription(currentDescription);
  const launchPermissions = launchDescription.permissions;

  if (parsed.permissions?.modules?.includes('*') || parsed.permissions?.routes?.includes('*')) {
    return parsed;
  }

  const currentPermissions = parsed.permissions && typeof parsed.permissions === 'object'
    ? parsed.permissions
    : {};

  const modules = [...new Set([
    ...(launchPermissions.modules || []),
    ...(currentPermissions.modules || []),
  ])];

  const routes = [...new Set([
    ...(launchPermissions.routes || []),
    ...(currentPermissions.routes || []),
  ])].filter((route) => ![
    'POST /api/v1/auctions/:id/publish',
    'POST /api/v1/assets/:id/approve',
    'POST /api/v1/assets/:id/reject',
    'POST /api/v1/evaluations/:id/approve',
    'POST /api/v1/evaluations/:id/reject',
  ].includes(route));

  return {
    summary: launchDescription.summary || parsed.summary,
    permissions: {
      ...currentPermissions,
      modules,
      actions: launchPermissions.actions,
      moduleActions: launchPermissions.moduleActions || currentPermissions.moduleActions,
      routes,
    },
    permissionVersion: Math.max(
      Number(parsed.permissionVersion) || 1,
      launchDescription.permissionVersion || 1,
    ),
  };
}

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const [evalRows] = await queryInterface.sequelize.query(
      `SELECT description FROM roles WHERE code = 'evaluation_officer' LIMIT 1`,
    );
    const evalDescription = evalRows.length > 0
      ? mergeLaunchRoleDescription(evalRows[0].description, LAUNCH_EVAL_OFFICER_DESCRIPTION)
      : LAUNCH_EVAL_OFFICER_DESCRIPTION;

    await queryInterface.sequelize.query(
      `UPDATE roles
       SET description = :description, updated_at = NOW()
       WHERE code = 'evaluation_officer'`,
      { replacements: { description: JSON.stringify(evalDescription) } },
    );

    const [mgrRows] = await queryInterface.sequelize.query(
      `SELECT description FROM roles WHERE code = 'auction_manager' LIMIT 1`,
    );
    const mgrDescription = mgrRows.length > 0
      ? mergeLaunchRoleDescription(mgrRows[0].description, LAUNCH_AUCTION_MANAGER_DESCRIPTION)
      : LAUNCH_AUCTION_MANAGER_DESCRIPTION;

    await queryInterface.sequelize.query(
      `UPDATE roles
       SET description = :description, updated_at = NOW()
       WHERE code = 'auction_manager'`,
      { replacements: { description: JSON.stringify(mgrDescription) } },
    );
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(
      `UPDATE roles
       SET description = :description, updated_at = NOW()
       WHERE code = 'evaluation_officer'`,
      { replacements: { description: JSON.stringify(LEGACY_EVAL_OFFICER_DESCRIPTION) } },
    );

    await queryInterface.sequelize.query(
      `UPDATE roles
       SET description = :description, updated_at = NOW()
       WHERE code = 'auction_manager'`,
      { replacements: { description: JSON.stringify(LEGACY_AUCTION_MANAGER_DESCRIPTION) } },
    );
  },
};
