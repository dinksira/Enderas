'use strict';

const STAFF_ROLE_CODES = Object.freeze([
  'evaluation_officer',
  'auction_manager',
]);

const FILES_MODULE = 'files';
const FILES_CREATE_ACTION = 'create';
const FILE_UPLOAD_ROUTES = Object.freeze([
  'POST /api/v1/files',
  'POST /api/v1/files/multiple',
]);

function mergeStaffFileGrants(description) {
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

  const modules = [...new Set([...(permissions.modules || []), FILES_MODULE])];
  const routes = [...new Set([...(permissions.routes || []), ...FILE_UPLOAD_ROUTES])];
  const moduleActions = {
    ...(permissions.moduleActions && typeof permissions.moduleActions === 'object'
      ? permissions.moduleActions
      : {}),
  };

  moduleActions[FILES_MODULE] = [
    ...new Set([...(moduleActions[FILES_MODULE] || []), FILES_CREATE_ACTION]),
  ];

  return {
    ...parsed,
    permissions: {
      ...permissions,
      modules,
      moduleActions,
      routes,
    },
    permissionVersion: Math.max(Number(parsed.permissionVersion) || 1, 6),
  };
}

function stripStaffFileGrants(description) {
  let parsed = description;

  if (typeof parsed === 'string') {
    try {
      parsed = JSON.parse(parsed);
    } catch {
      return description;
    }
  }

  const permissions = parsed?.permissions || {};
  const modules = (permissions.modules || []).filter((module) => module !== FILES_MODULE);
  const routes = (permissions.routes || []).filter((route) => !FILE_UPLOAD_ROUTES.includes(route));
  const moduleActions = {
    ...(permissions.moduleActions && typeof permissions.moduleActions === 'object'
      ? permissions.moduleActions
      : {}),
  };

  delete moduleActions[FILES_MODULE];

  return {
    ...parsed,
    permissions: {
      ...permissions,
      modules,
      moduleActions: Object.keys(moduleActions).length ? moduleActions : permissions.moduleActions,
      routes,
    },
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

      const nextDescription = mergeStaffFileGrants(rows[0].description);

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

      const nextDescription = stripStaffFileGrants(rows[0].description);

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
