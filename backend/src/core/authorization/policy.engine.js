import {
  canAccess,
  canAccessRoute,
  hasWildcardAccess,
  toCapabilityArray,
} from '../../utils/permission-eval.util.js';

/**
 * Normalize permission context from JWT, req.user, or DB record.
 * @param {object} context
 */
export function normalizeContext(context = {}) {
  return {
    roleCode: context.roleCode ?? context.code ?? null,
    roleId: context.roleId ?? context.id ?? null,
    wildcard: Boolean(context.wildcard),
    modules: toCapabilityArray(context.modules),
    actions: toCapabilityArray(context.actions),
    routes: toCapabilityArray(context.routes),
    moduleActions: context.moduleActions && typeof context.moduleActions === 'object'
      ? context.moduleActions
      : {},
  };
}

export function hasRole(context, roleCode) {
  if (!roleCode) {
    return false;
  }
  return normalizeContext(context).roleCode === roleCode;
}

export function hasPermission(context, moduleName, actionName) {
  return canAccess(normalizeContext(context), moduleName, actionName);
}

export function canPerformAction(context, moduleName, actionName) {
  return hasPermission(context, moduleName, actionName);
}

export function canRead(context, moduleName) {
  return hasPermission(context, moduleName, 'read');
}

export function canCreate(context, moduleName) {
  return hasPermission(context, moduleName, 'create');
}

export function canUpdate(context, moduleName) {
  return hasPermission(context, moduleName, 'update');
}

export function canDelete(context, moduleName) {
  return hasPermission(context, moduleName, 'delete');
}

export function canApprove(context, moduleName) {
  return hasPermission(context, moduleName, 'approve');
}

export function canReject(context, moduleName) {
  return hasPermission(context, moduleName, 'reject');
}

export function canPublish(context, moduleName) {
  return hasPermission(context, moduleName, 'publish');
}

export function canClose(context, moduleName) {
  return hasPermission(context, moduleName, 'close');
}

export function canExport(context, moduleName) {
  return hasPermission(context, moduleName, 'export');
}

export function canAccessRouteSignature(context, routeSignature) {
  return canAccessRoute(normalizeContext(context), routeSignature);
}

export function isWildcardPrincipal(context) {
  return hasWildcardAccess(normalizeContext(context));
}

export const policyEngine = Object.freeze({
  normalizeContext,
  hasRole,
  hasPermission,
  canPerformAction,
  canRead,
  canCreate,
  canUpdate,
  canDelete,
  canApprove,
  canReject,
  canPublish,
  canClose,
  canExport,
  canAccessRouteSignature,
  isWildcardPrincipal,
});

export default policyEngine;
