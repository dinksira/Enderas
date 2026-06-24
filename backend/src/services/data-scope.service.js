import { DATA_SCOPE_RULES } from '../core/authorization/access-map.js';

/**
 * Build Sequelize WHERE clause fragments for row-level data scoping.
 * @param {import('express').Request} req
 * @param {string} moduleName
 * @param {{ userIdColumn?: string, staffColumn?: string }} [options]
 */
export function buildDataScopeWhere(req, moduleName, options = {}) {
  const scope = req.dataScope ?? {};
  const rule = DATA_SCOPE_RULES[moduleName];

  if (scope.isWildcard) {
    return {};
  }

  const userIdColumn = options.userIdColumn ?? 'user_id';

  switch (rule) {
    case 'own_user':
      return { [userIdColumn]: scope.userId };

    case 'own_asset_owner':
      return { asset_owner_user_id: scope.userId };

    case 'own_user_or_finance':
      if (scope.isStaff) {
        return {};
      }
      return { [userIdColumn]: scope.userId };

    case 'own_user_or_staff':
      if (scope.isStaff) {
        return {};
      }
      return { [userIdColumn]: scope.userId };

    case 'staff_module':
      if (!scope.isStaff) {
        return { [userIdColumn]: scope.userId };
      }
      return {};

    default:
      if (!scope.isStaff) {
        return { [userIdColumn]: scope.userId };
      }
      return {};
  }
}

export const dataScopeService = Object.freeze({
  buildDataScopeWhere,
});

export default dataScopeService;
