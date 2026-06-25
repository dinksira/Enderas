import { SUPER_ADMIN_CODE } from '../schemas/permission.schema.js';

const WILDCARD = '*';

/**
 * Normalizes permission capability arrays from JWT payloads or DB records.
 * @param {unknown} values
 * @returns {string[]}
 */
export function toCapabilityArray(values) {
  if (!Array.isArray(values)) {
    return [];
  }

  return values.filter((value) => typeof value === 'string' && value.length > 0);
}

/**
 * Returns true when the role or permission matrix grants unrestricted access.
 * @param {{ roleCode?: string, wildcard?: boolean, modules?: string[], actions?: string[], routes?: string[] }} context
 */
export function hasWildcardAccess(context = {}) {
  if (!context || typeof context !== 'object') {
    return false;
  }

  if (context.roleCode === SUPER_ADMIN_CODE || context.wildcard === true) {
    return true;
  }

  const modules = toCapabilityArray(context.modules);
  const actions = toCapabilityArray(context.actions);
  const routes = toCapabilityArray(context.routes);

  return (
    modules.includes(WILDCARD)
    || actions.includes(WILDCARD)
    || routes.includes(WILDCARD)
  );
}

/**
 * Evaluates module + action authorization against deserialized DB/JWT capabilities.
 * @param {{ roleCode?: string, wildcard?: boolean, modules?: string[], actions?: string[], routes?: string[] }} context
 * @param {string} [moduleName]
 * @param {string} [actionName]
 */
export function canAccess(context, moduleName, actionName) {
  if (hasWildcardAccess(context)) {
    return true;
  }

  const modules = toCapabilityArray(context?.modules);
  const actions = toCapabilityArray(context?.actions);
  const moduleActions = context?.moduleActions && typeof context.moduleActions === 'object'
    ? context.moduleActions
    : null;

  if (moduleName && actionName && moduleActions && Object.keys(moduleActions).length > 0) {
    const grantedActions = toCapabilityArray(moduleActions[moduleName]);
    return grantedActions.includes(actionName);
  }

  if (moduleName && !modules.includes(moduleName)) {
    return false;
  }

  if (actionName && !actions.includes(actionName)) {
    return false;
  }

  return true;
}

/**
 * Evaluates explicit HTTP route grants (e.g. "POST /api/v1/auctions").
 * @param {{ roleCode?: string, wildcard?: boolean, routes?: string[] }} context
 * @param {string} routeSignature
 */
export function canAccessRoute(context, routeSignature) {
  if (hasWildcardAccess(context)) {
    return true;
  }

  const routes = toCapabilityArray(context?.routes);
  return routes.includes(routeSignature);
}

export default {
  canAccess,
  canAccessRoute,
  hasWildcardAccess,
  toCapabilityArray,
  WILDCARD,
};
