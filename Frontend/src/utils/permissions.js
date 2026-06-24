const WILDCARD = '*';
const SUPER_ADMIN_CODE = 'super_admin';

function toCapabilityArray(values) {
  if (!Array.isArray(values)) {
    return [];
  }

  return values.filter((value) => typeof value === 'string' && value.length > 0);
}

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
 * Client-side mirror of backend permission-eval.util.js
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

  if (moduleName && !modules.includes(moduleName)) {
    return false;
  }

  if (actionName && !actions.includes(actionName)) {
    return false;
  }

  return true;
}

export default {
  canAccess,
  hasWildcardAccess,
};
