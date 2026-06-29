import { API_ACCESS_MAP, ACTIONS, MODULES } from '../core/authorization/access-map.js';
import { Role, Staff } from '../models/index.js';
import { AppError } from '../utils/error.util.js';
import { normalizeRolePermissions, safeParseRoleDescription } from '../schemas/permission.schema.js';
import { canAccess } from '../utils/permission-eval.util.js';
import { invalidateRolePermissionCache } from '../middleware/auth.middleware.js';
import { authorizationPermissionService } from '../core/authorization/permission.service.js';
import { auditService, AUDIT_ACTIONS } from './audit.service.js';

const AVAILABLE_ACTIONS = Object.freeze(Object.values(ACTIONS));

function uniqueStrings(values) {
  if (!Array.isArray(values)) {
    return [];
  }

  return [...new Set(values.filter((value) => typeof value === 'string' && value.length > 0))];
}

export function getPermissionCatalog() {
  const modules = [];
  const routesByModuleAction = {};

  Object.entries(API_ACCESS_MAP).forEach(([routeSignature, requirement]) => {
    if (!requirement?.module || !requirement?.action) {
      return;
    }

    if (!modules.includes(requirement.module)) {
      modules.push(requirement.module);
    }

    if (!routesByModuleAction[requirement.module]) {
      routesByModuleAction[requirement.module] = {};
    }

    if (!routesByModuleAction[requirement.module][requirement.action]) {
      routesByModuleAction[requirement.module][requirement.action] = [];
    }

    routesByModuleAction[requirement.module][requirement.action].push(routeSignature);
  });

  const actions = AVAILABLE_ACTIONS.filter((action) =>
    modules.some((moduleName) => routesByModuleAction[moduleName]?.[action]?.length > 0));

  const moduleActions = Object.fromEntries(
    modules.map((moduleName) => {
      const actionMap = routesByModuleAction[moduleName] ?? {};
      const moduleActionList = actions.filter((actionName) => (actionMap[actionName]?.length ?? 0) > 0);
      return [moduleName, moduleActionList];
    }),
  );

  return {
    modules,
    actions,
    moduleActions,
    routesByModuleAction,
  };
}

function applyPermissionDependencies(moduleActions) {
  return Object.fromEntries(
    Object.entries(moduleActions)
      .map(([moduleName, grantedActions]) => {
        const actions = new Set(grantedActions);
        const hasNonRead = [...actions].some((action) => action !== 'read');
        if (hasNonRead) {
          actions.add('read');
        }
        return [moduleName, [...actions]];
      })
      .filter(([, grantedActions]) => grantedActions.length > 0),
  );
}

function getModuleCatalogActions(catalog, moduleName) {
  const moduleActions = catalog?.moduleActions?.[moduleName];
  if (Array.isArray(moduleActions) && moduleActions.length > 0) {
    return moduleActions;
  }
  return catalog?.actions ?? [];
}

function normalizeModuleActions(moduleActions, catalog) {
  if (!moduleActions || typeof moduleActions !== 'object' || Array.isArray(moduleActions)) {
    return {};
  }

  const normalized = Object.fromEntries(
    Object.entries(moduleActions)
      .filter(([moduleName]) => catalog.modules.includes(moduleName))
      .map(([moduleName, grantedActions]) => [
        moduleName,
        uniqueStrings(grantedActions).filter((action) =>
          getModuleCatalogActions(catalog, moduleName).includes(action)),
      ])
      .filter(([, grantedActions]) => grantedActions.length > 0),
  );

  return applyPermissionDependencies(normalized);
}

function buildModuleActionsFromLegacy(modules, actions, catalog) {
  const normalizedModules = uniqueStrings(modules).filter((moduleName) =>
    catalog.modules.includes(moduleName));
  const normalizedActions = uniqueStrings(actions).filter((action) =>
    catalog.actions.includes(action));

  return Object.fromEntries(
    normalizedModules
      .map((moduleName) => [moduleName, [...normalizedActions]])
      .filter(([, grantedActions]) => grantedActions.length > 0),
  );
}

function deriveRoutesFromModuleActions(moduleActions, catalog) {
  const routes = new Set();

  Object.entries(moduleActions).forEach(([moduleName, grantedActions]) => {
    grantedActions.forEach((actionName) => {
      const signatures = catalog.routesByModuleAction[moduleName]?.[actionName] ?? [];
      signatures.forEach((signature) => routes.add(signature));
    });
  });

  return [...routes];
}

function buildPermissionEnvelope(roleCode, payload, parsed, catalog) {
  if (roleCode === 'super_admin') {
    return {
      modules: ['*'],
      actions: ['*'],
      routes: ['*'],
      moduleActions: { '*': ['*'] },
    };
  }

  const moduleActions = Object.keys(payload.moduleActions || {}).length > 0
    ? normalizeModuleActions(payload.moduleActions, catalog)
    : buildModuleActionsFromLegacy(
        payload.modules ?? parsed.permissions.modules,
        payload.actions ?? parsed.permissions.actions,
        catalog,
      );

  const modules = Object.keys(moduleActions);
  const actions = uniqueStrings(Object.values(moduleActions).flat());
  const routes = deriveRoutesFromModuleActions(moduleActions, catalog);

  if (!modules.length || !actions.length) {
    throw new AppError('At least one module/action permission is required', 400, 'VALIDATION_ERROR');
  }

  return {
    modules,
    actions,
    routes,
    moduleActions,
  };
}

export function buildRolePermissionProfile(role, affectedStaffCount = 0) {
  const catalog = getPermissionCatalog();
  const canonical = normalizeRolePermissions(role);
  const context = {
    roleCode: role.code,
    wildcard: canonical.wildcard,
    modules: canonical.permissions.modules,
    actions: canonical.permissions.actions,
    routes: canonical.permissions.routes,
    moduleActions: canonical.permissions.moduleActions,
  };

  return {
    summary: canonical.summary,
    wildcard: canonical.wildcard,
    permissionVersion: canonical.permissionVersion,
    permissions: canonical.permissions,
    affectedStaffCount,
    catalog: {
      modules: catalog.modules,
      actions: catalog.actions,
      moduleActions: catalog.moduleActions,
    },
    matrix: catalog.modules.map((moduleName) => {
      const moduleCatalogActions = getModuleCatalogActions(catalog, moduleName);
      return {
        module: moduleName,
        actions: Object.fromEntries(
          moduleCatalogActions.map((actionName) => [
            actionName,
            canAccess(context, moduleName, actionName),
          ]),
        ),
      };
    }),
  };
}

async function invalidateAffectedStaffPermissionCaches(roleId) {
  const staffRows = await Staff.findAll({
    where: { role_id: roleId },
    attributes: ['user_id'],
    raw: true,
  });

  const userIds = [...new Set(staffRows.map((row) => row.user_id).filter(Boolean))];
  await Promise.all(userIds.map((userId) => authorizationPermissionService.invalidateUserPermissions(userId)));
}

/**
 * @param {string} roleId
 * @param {{ summary?: string, modules?: string[], actions?: string[], routes?: string[], moduleActions?: Record<string, string[]> }} payload
 * @param {string} staffId
 */
export async function updateRolePermissions(roleId, payload, staffId) {
  const role = await Role.findByPk(roleId);

  if (!role || !role.is_active) {
    throw new AppError('Role not found or inactive', 404, 'ROLE_NOT_FOUND');
  }

  if (role.code === 'super_admin') {
    throw new AppError('Super admin permissions cannot be modified', 400, 'ROLE_IMMUTABLE');
  }

  if (!staffId) {
    throw new AppError('Only staff can update role permissions', 403, 'STAFF_REQUIRED');
  }

  const actorStaff = await Staff.findByPk(staffId, {
    attributes: ['id', 'role_id'],
  });

  if (!actorStaff) {
    throw new AppError('Acting staff member not found', 403, 'STAFF_REQUIRED');
  }

  if (actorStaff.role_id === roleId) {
    throw new AppError('You cannot edit permissions for your own role', 400, 'SELF_ROLE_EDIT_FORBIDDEN');
  }

  const parsed = safeParseRoleDescription(role.description);
  const currentVersion = Number(parsed.permissionVersion) || 1;
  const catalog = getPermissionCatalog();
  const nextPermissions = buildPermissionEnvelope(role.code, payload, parsed, catalog);

  const nextDescription = {
    summary: payload.summary ?? parsed.summary,
    permissions: nextPermissions,
    permissionVersion: currentVersion + 1,
  };

  const oldDescription = typeof role.description === 'string'
    ? role.description
    : JSON.stringify(role.description);

  await role.update({ description: JSON.stringify(nextDescription) });
  await invalidateRolePermissionCache(roleId);
  await invalidateAffectedStaffPermissionCaches(roleId);

  await auditService.writeAuditLog({
    staffId,
    action: AUDIT_ACTIONS.UPDATE,
    entityType: 'Role',
    entityId: roleId,
    oldValues: { description: oldDescription },
    newValues: { description: nextDescription },
    metadata: { action: 'update_permissions' },
  });

  const affectedStaffCount = await Staff.count({ where: { role_id: roleId } });

  return {
    id: role.id,
    name: role.name,
    code: role.code,
    description: nextDescription,
    permissionVersion: nextDescription.permissionVersion,
    ...buildRolePermissionProfile(
      {
        id: role.id,
        code: role.code,
        description: nextDescription,
        is_active: role.is_active,
      },
      affectedStaffCount,
    ),
  };
}

export const roleAdminService = Object.freeze({
  buildRolePermissionProfile,
  getPermissionCatalog,
  updateRolePermissions,
});

export default roleAdminService;
