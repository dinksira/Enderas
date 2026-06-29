'use strict';

const STRIPPED_EVALUATION_ACTIONS = Object.freeze(['approve', 'reject']);
const TARGET_PERMISSION_VERSION = 5;

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

function stripEvalOfficerEvaluationApprovals(description) {
  const parsed = parseDescription(description);

  if (parsed.permissions?.modules?.includes('*') || parsed.permissions?.routes?.includes('*')) {
    return parsed;
  }

  const permissions = parsed.permissions && typeof parsed.permissions === 'object'
    ? parsed.permissions
    : {};

  const moduleActions = permissions.moduleActions && typeof permissions.moduleActions === 'object'
    ? { ...permissions.moduleActions }
    : {};

  if (Array.isArray(moduleActions.evaluations)) {
    moduleActions.evaluations = moduleActions.evaluations.filter(
      (action) => !STRIPPED_EVALUATION_ACTIONS.includes(action),
    );
  }

  return {
    ...parsed,
    permissions: {
      ...permissions,
      moduleActions,
    },
    permissionVersion: TARGET_PERMISSION_VERSION,
  };
}

function restoreEvalOfficerEvaluationApprovals(description, removedActions) {
  const parsed = parseDescription(description);
  const permissions = parsed.permissions && typeof parsed.permissions === 'object'
    ? parsed.permissions
    : {};
  const moduleActions = permissions.moduleActions && typeof permissions.moduleActions === 'object'
    ? { ...permissions.moduleActions }
    : {};

  const current = Array.isArray(moduleActions.evaluations) ? [...moduleActions.evaluations] : [];
  moduleActions.evaluations = [...new Set([...current, ...removedActions])];

  return {
    ...parsed,
    permissions: {
      ...permissions,
      moduleActions,
    },
    permissionVersion: Math.max(Number(parsed.permissionVersion) || 1, 4),
  };
}

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const [rows] = await queryInterface.sequelize.query(
      `SELECT description FROM roles WHERE code = 'evaluation_officer' LIMIT 1`,
    );

    if (rows.length === 0) {
      return;
    }

    const nextDescription = stripEvalOfficerEvaluationApprovals(rows[0].description);

    await queryInterface.sequelize.query(
      `UPDATE roles
       SET description = :description, updated_at = NOW()
       WHERE code = 'evaluation_officer'`,
      { replacements: { description: JSON.stringify(nextDescription) } },
    );
  },

  async down(queryInterface) {
    const [rows] = await queryInterface.sequelize.query(
      `SELECT description FROM roles WHERE code = 'evaluation_officer' LIMIT 1`,
    );

    if (rows.length === 0) {
      return;
    }

    const nextDescription = restoreEvalOfficerEvaluationApprovals(
      rows[0].description,
      STRIPPED_EVALUATION_ACTIONS,
    );

    await queryInterface.sequelize.query(
      `UPDATE roles
       SET description = :description, updated_at = NOW()
       WHERE code = 'evaluation_officer'`,
      { replacements: { description: JSON.stringify(nextDescription) } },
    );
  },
};
