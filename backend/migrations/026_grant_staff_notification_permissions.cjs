'use strict';

const STAFF_ROLE_CODES = Object.freeze([
  'auction_manager',
  'finance_officer',
  'customer_service_officer',
  'evaluation_officer',
]);

const NOTIFICATION_MODULE = 'notifications';
const NOTIFICATION_ACTIONS = Object.freeze(['read', 'update']);
const NOTIFICATION_ROUTES = Object.freeze([
  'GET /api/v1/notifications',
  'GET /api/v1/notifications/unread-count',
  'GET /api/v1/notifications/:id',
  'POST /api/v1/notifications/:id/read',
  'POST /api/v1/notifications/read-all',
]);

function mergeNotificationGrants(description) {
  let parsed = description;

  if (typeof parsed === 'string') {
    try {
      parsed = JSON.parse(parsed);
    } catch {
      parsed = {};
    }
  }

  if (!parsed || typeof parsed !== 'object') {
    parsed = {};
  }

  const permissions = parsed.permissions && typeof parsed.permissions === 'object'
    ? parsed.permissions
    : {};

  if (permissions.modules?.includes('*') || permissions.routes?.includes('*')) {
    return parsed;
  }

  const modules = [...new Set([...(permissions.modules || []), NOTIFICATION_MODULE])];
  const actions = [...new Set([...(permissions.actions || []), ...NOTIFICATION_ACTIONS])];
  const routes = [...new Set([...(permissions.routes || []), ...NOTIFICATION_ROUTES])];

  return {
    ...parsed,
    permissions: {
      ...permissions,
      modules,
      actions,
      routes,
    },
    permissionVersion: Math.max(Number(parsed.permissionVersion) || 1, 3),
  };
}

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    for (const roleCode of STAFF_ROLE_CODES) {
      const [rows] = await queryInterface.sequelize.query(
        `SELECT description FROM roles WHERE code = :roleCode LIMIT 1`,
        { replacements: { roleCode } },
      );

      if (rows.length === 0) {
        continue;
      }

      const nextDescription = mergeNotificationGrants(rows[0].description);

      await queryInterface.sequelize.query(
        `UPDATE roles
         SET description = :description, updated_at = NOW()
         WHERE code = :roleCode`,
        {
          replacements: {
            roleCode,
            description: JSON.stringify(nextDescription),
          },
        },
      );
    }
  },

  async down(queryInterface) {
    for (const roleCode of STAFF_ROLE_CODES) {
      const [rows] = await queryInterface.sequelize.query(
        `SELECT description FROM roles WHERE code = :roleCode LIMIT 1`,
        { replacements: { roleCode } },
      );

      if (rows.length === 0) {
        continue;
      }

      let parsed;
      try {
        parsed = JSON.parse(rows[0].description);
      } catch {
        continue;
      }

      const permissions = parsed.permissions || {};
      const modules = (permissions.modules || []).filter((module) => module !== NOTIFICATION_MODULE);
      const actions = (permissions.actions || []).filter((action) => !NOTIFICATION_ACTIONS.includes(action));
      const routes = (permissions.routes || []).filter((route) => !NOTIFICATION_ROUTES.includes(route));

      const nextDescription = {
        ...parsed,
        permissions: {
          ...permissions,
          modules,
          actions,
          routes,
        },
      };

      await queryInterface.sequelize.query(
        `UPDATE roles
         SET description = :description, updated_at = NOW()
         WHERE code = :roleCode`,
        {
          replacements: {
            roleCode,
            description: JSON.stringify(nextDescription),
          },
        },
      );
    }
  },
};
