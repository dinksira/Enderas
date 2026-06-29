'use strict';

const FILES_MODULE = 'files';
const FILES_CREATE_ACTION = 'create';
const FILE_UPLOAD_ROUTES = Object.freeze([
  'POST /api/v1/files',
  'POST /api/v1/files/multiple',
]);

function mergeBidderFileGrants(description) {
  let parsed = description;

  if (typeof parsed === 'string') {
    try {
      parsed = JSON.parse(description);
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
  const actions = [...new Set([...(permissions.actions || []), FILES_CREATE_ACTION])];
  const routes = [...new Set([...(permissions.routes || []), ...FILE_UPLOAD_ROUTES])];

  return {
    ...parsed,
    permissions: {
      ...permissions,
      modules,
      actions,
      routes,
    },
    permissionVersion: Math.max(Number(parsed.permissionVersion) || 1, 5),
  };
}

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const [rows] = await queryInterface.sequelize.query(
      `SELECT description FROM roles WHERE code = 'bidder' LIMIT 1`,
    );

    if (rows.length === 0) {
      return;
    }

    const nextDescription = mergeBidderFileGrants(rows[0].description);

    await queryInterface.sequelize.query(
      `UPDATE roles
       SET description = :description, updated_at = NOW()
       WHERE code = 'bidder'`,
      {
        replacements: {
          description: JSON.stringify(nextDescription),
        },
      },
    );
  },

  async down(queryInterface) {
    const [rows] = await queryInterface.sequelize.query(
      `SELECT description FROM roles WHERE code = 'bidder' LIMIT 1`,
    );

    if (rows.length === 0) {
      return;
    }

    let parsed;
    try {
      parsed = JSON.parse(rows[0].description);
    } catch {
      return;
    }

    const permissions = parsed.permissions || {};
    const modules = (permissions.modules || []).filter((module) => module !== FILES_MODULE);
    const routes = (permissions.routes || []).filter((route) => !FILE_UPLOAD_ROUTES.includes(route));

    const nextDescription = {
      ...parsed,
      permissions: {
        ...permissions,
        modules,
        routes,
      },
    };

    await queryInterface.sequelize.query(
      `UPDATE roles
       SET description = :description, updated_at = NOW()
       WHERE code = 'bidder'`,
      {
        replacements: {
          description: JSON.stringify(nextDescription),
        },
      },
    );
  },
};
