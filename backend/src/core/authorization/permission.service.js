import { getUserPermissions, clearUserPermissionCache } from '../../services/user-permission.service.js';
import { getRolePermissions, clearL1RoleCache } from '../../services/permission.service.js';
import { getCachedPrincipal, clearPrincipalCache as clearLocalPrincipalCache } from './permission-cache.js';
import { policyEngine } from './policy.engine.js';

/**
 * Central authorization permission facade.
 * Delegates to existing cached user/role services — does not duplicate DB access.
 */
export async function resolvePrincipal(userId, options = {}) {
  return getCachedPrincipal(userId, options);
}

export async function resolveRolePermissions(roleId) {
  return getRolePermissions(roleId);
}

export function buildPermissionContext(principal) {
  if (!principal) {
    return policyEngine.normalizeContext({});
  }

  return policyEngine.normalizeContext({
    roleCode: principal.role?.code,
    roleId: principal.effectiveRoleId ?? principal.role?.id,
    wildcard: principal.wildcard,
    modules: principal.modules,
    actions: principal.actions,
    routes: principal.routes,
    moduleActions: principal.moduleActions,
  });
}

export function evaluateAccess(principal, moduleName, actionName) {
  const context = buildPermissionContext(principal);
  return policyEngine.hasPermission(context, moduleName, actionName);
}

export async function invalidateUserPermissions(userId) {
  clearLocalPrincipalCache(userId);
  await clearUserPermissionCache(userId);
}

export function invalidateRolePermissions(roleId) {
  clearL1RoleCache(roleId);
}

export const authorizationPermissionService = Object.freeze({
  resolvePrincipal,
  resolveRolePermissions,
  buildPermissionContext,
  evaluateAccess,
  invalidateUserPermissions,
  invalidateRolePermissions,
  getUserPermissions,
});

export default authorizationPermissionService;
