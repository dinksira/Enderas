'use strict';

const LEGACY_CSO_DESCRIPTION = {
  summary: 'Handles user support, KYC review, and customer-facing operations.',
  permissions: {
    modules: ['users', 'kyc', 'assets', 'cpo', 'dashboard'],
    actions: ['read', 'approve', 'reject', 'update'],
    routes: [
      'GET /api/v1/users',
      'GET /api/v1/users/:id',
      'PUT /api/v1/users/:id',
      'GET /api/v1/kyc',
      'POST /api/v1/kyc/:id/approve',
      'POST /api/v1/kyc/:id/reject',
      'GET /api/v1/assets',
      'POST /api/v1/assets/:id/approve',
      'POST /api/v1/assets/:id/reject',
      'GET /api/v1/cpo',
      'POST /api/v1/cpo/:id/approve',
      'POST /api/v1/cpo/:id/reject',
      'GET /api/v1/dashboard',
    ],
  },
  permissionVersion: 1,
};

const UPDATED_CSO_DESCRIPTION = {
  summary: 'Handles user support, KYC review, and customer-facing operations.',
  permissions: {
    modules: ['users', 'kyc', 'assets', 'cpo', 'dashboard', 'evaluations'],
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
    ],
  },
  permissionVersion: 2,
};

const LEGACY_EVAL_OFFICER_DESCRIPTION = {
  summary: 'Creates and manages asset evaluations.',
  permissions: {
    modules: ['evaluations', 'assets', 'dashboard'],
    actions: ['create', 'read', 'update', 'delete', 'approve', 'reject', 'publish', 'close'],
    routes: [
      'POST /api/v1/evaluations',
      'GET /api/v1/evaluations',
      'PUT /api/v1/evaluations/:id',
      'POST /api/v1/evaluations/:id/approve',
      'POST /api/v1/evaluations/:id/reject',
      'GET /api/v1/assets',
      'GET /api/v1/dashboard',
    ],
  },
  permissionVersion: 1,
};

const UPDATED_EVAL_OFFICER_DESCRIPTION = {
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

const UPDATED_SUPER_ADMIN_DESCRIPTION = {
  summary: 'Full system access including staff management and all modules.',
  permissions: {
    modules: ['*'],
    actions: ['create', 'read', 'update', 'delete', 'approve', 'reject', 'publish', 'close', 'export'],
    routes: ['*'],
  },
  permissionVersion: 2,
};

const STAFF_CRUD_ROUTES = [
  'GET /api/v1/staff',
  'GET /api/v1/staff/:id',
  'GET /api/v1/staff/assignable-roles',
  'POST /api/v1/staff',
  'PUT /api/v1/staff/:id',
  'POST /api/v1/staff/:id/deactivate',
  'DELETE /api/v1/staff/:id',
];

const AUDIT_LOG_ROUTES = [
  'GET /api/v1/audit-logs',
  'GET /api/v1/audit-logs/:id',
  'GET /api/v1/audit-logs/entity/:entityType/:entityId',
];

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(
      `UPDATE roles
       SET description = :description, updated_at = NOW()
       WHERE code = 'customer_service_officer'`,
      { replacements: { description: JSON.stringify(UPDATED_CSO_DESCRIPTION) } },
    );

    await queryInterface.sequelize.query(
      `UPDATE roles
       SET description = :description, updated_at = NOW()
       WHERE code = 'evaluation_officer'`,
      { replacements: { description: JSON.stringify(UPDATED_EVAL_OFFICER_DESCRIPTION) } },
    );

    const [superAdminRows] = await queryInterface.sequelize.query(
      `SELECT description FROM roles WHERE code = 'super_admin' LIMIT 1`,
    );

    if (superAdminRows.length > 0) {
      let parsed;
      try {
        parsed = JSON.parse(superAdminRows[0].description);
      } catch {
        parsed = UPDATED_SUPER_ADMIN_DESCRIPTION;
      }

      const permissions = parsed.permissions && typeof parsed.permissions === 'object'
        ? parsed.permissions
        : UPDATED_SUPER_ADMIN_DESCRIPTION.permissions;

      const explicitRoutes = [
        ...STAFF_CRUD_ROUTES,
        ...AUDIT_LOG_ROUTES,
        'PUT /api/v1/roles/:id',
        'POST /api/v1/users/:id/status',
        'DELETE /api/v1/auctions/:id',
        'GET /api/v1/winners/:id',
      ];

      const mergedRoutes = permissions.routes?.includes('*')
        ? ['*']
        : [...new Set([...(permissions.routes || []), ...explicitRoutes])];

      const nextDescription = {
        summary: parsed.summary || UPDATED_SUPER_ADMIN_DESCRIPTION.summary,
        permissions: {
          modules: permissions.modules || ['*'],
          actions: permissions.actions || UPDATED_SUPER_ADMIN_DESCRIPTION.permissions.actions,
          routes: mergedRoutes,
        },
        permissionVersion: Math.max(Number(parsed.permissionVersion) || 1, 2),
      };

      await queryInterface.sequelize.query(
        `UPDATE roles
         SET description = :description, updated_at = NOW()
         WHERE code = 'super_admin'`,
        { replacements: { description: JSON.stringify(nextDescription) } },
      );
    }
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(
      `UPDATE roles
       SET description = :description, updated_at = NOW()
       WHERE code = 'customer_service_officer'`,
      { replacements: { description: JSON.stringify(LEGACY_CSO_DESCRIPTION) } },
    );

    await queryInterface.sequelize.query(
      `UPDATE roles
       SET description = :description, updated_at = NOW()
       WHERE code = 'evaluation_officer'`,
      { replacements: { description: JSON.stringify(LEGACY_EVAL_OFFICER_DESCRIPTION) } },
    );

    await queryInterface.sequelize.query(
      `UPDATE roles
       SET description = :description, updated_at = NOW()
       WHERE code = 'super_admin'`,
      {
        replacements: {
          description: JSON.stringify({
            ...UPDATED_SUPER_ADMIN_DESCRIPTION,
            permissionVersion: 1,
          }),
        },
      },
    );
  },
};
