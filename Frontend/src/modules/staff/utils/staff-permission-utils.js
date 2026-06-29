const READ_ACTION = 'read';

function uniqueActions(actions = []) {
  return [...new Set(actions.filter((action) => typeof action === 'string' && action.length > 0))];
}

/**
 * @param {{ modules?: string[], actions?: string[], moduleActions?: Record<string, string[]> } | null} catalog
 * @param {string} moduleName
 */
export function getModuleCatalogActions(catalog, moduleName) {
  const moduleActions = catalog?.moduleActions?.[moduleName];
  if (Array.isArray(moduleActions) && moduleActions.length > 0) {
    return moduleActions;
  }
  return catalog?.actions ?? [];
}

/**
 * Keeps only module/action pairs that exist in the permission catalog.
 * @param {Record<string, string[]>} moduleActions
 * @param {{ modules?: string[], actions?: string[], moduleActions?: Record<string, string[]> } | null} catalog
 */
export function sanitizePermissionDraft(moduleActions = {}, catalog = null) {
  const modules = catalog?.modules ?? [];
  return Object.fromEntries(
    Object.entries(moduleActions)
      .filter(([moduleName]) => modules.includes(moduleName))
      .map(([moduleName, grantedActions]) => [
        moduleName,
        uniqueActions(grantedActions).filter((action) =>
          getModuleCatalogActions(catalog, moduleName).includes(action)),
      ])
      .filter(([, grantedActions]) => grantedActions.length > 0),
  );
}

/**
 * Ensures non-read actions always include read on the same module.
 * @param {Record<string, string[]>} moduleActions
 */
export function applyPermissionDependencies(moduleActions = {}) {
  return Object.fromEntries(
    Object.entries(moduleActions)
      .map(([moduleName, grantedActions]) => {
        const actions = new Set(uniqueActions(grantedActions));
        const hasNonRead = [...actions].some((action) => action !== READ_ACTION);
        if (hasNonRead) {
          actions.add(READ_ACTION);
        }
        return [moduleName, [...actions]];
      })
      .filter(([, grantedActions]) => grantedActions.length > 0),
  );
}

/**
 * @param {Record<string, string[]>} draft
 * @param {string} moduleName
 * @param {string} actionName
 * @param {boolean} checked
 */
export function togglePermissionDraft(draft, moduleName, actionName, checked) {
  const next = { ...draft };
  const current = new Set(uniqueActions(next[moduleName]));

  if (checked) {
    current.add(actionName);
  } else if (actionName === READ_ACTION) {
    current.clear();
  } else {
    current.delete(actionName);
  }

  if (current.size > 0) {
    next[moduleName] = [...current];
  } else {
    delete next[moduleName];
  }

  return applyPermissionDependencies(next);
}

/**
 * @param {Record<string, string[]>} draft
 * @param {string} moduleName
 * @param {string[]} moduleCatalogActions
 * @param {boolean} checked
 */
export function toggleModuleDraft(draft, moduleName, moduleCatalogActions, checked) {
  const next = { ...draft };

  if (!checked) {
    delete next[moduleName];
    return next;
  }

  next[moduleName] = uniqueActions(moduleCatalogActions);
  return applyPermissionDependencies(next);
}

/**
 * @param {Record<string, string[]>} moduleActions
 * @param {string[]} catalogModules
 * @param {{ modules?: string[], actions?: string[], moduleActions?: Record<string, string[]> } | null} catalog
 */
export function countGrantedPermissions(moduleActions = {}, catalogModules = [], catalog = null) {
  let granted = 0;
  let total = 0;

  catalogModules.forEach((moduleName) => {
    const moduleCatalogActions = getModuleCatalogActions(catalog, moduleName);
    total += moduleCatalogActions.length;
    const grantedSet = new Set(uniqueActions(moduleActions[moduleName]));
    moduleCatalogActions.forEach((actionName) => {
      if (grantedSet.has(actionName)) {
        granted += 1;
      }
    });
  });

  return { granted, total };
}

/**
 * @param {Record<string, string[]>} left
 * @param {Record<string, string[]>} right
 */
export function permissionDraftsEqual(left = {}, right = {}) {
  const leftKeys = Object.keys(left).sort();
  const rightKeys = Object.keys(right).sort();
  if (leftKeys.length !== rightKeys.length) {
    return false;
  }

  return leftKeys.every((moduleName, index) => {
    if (moduleName !== rightKeys[index]) {
      return false;
    }
    const leftActions = uniqueActions(left[moduleName]).sort();
    const rightActions = uniqueActions(right[moduleName]).sort();
    return leftActions.length === rightActions.length
      && leftActions.every((action, actionIndex) => action === rightActions[actionIndex]);
  });
}

/**
 * @param {Record<string, string[]>} draft
 * @param {string} moduleName
 * @param {{ modules?: string[], actions?: string[], moduleActions?: Record<string, string[]> } | null} catalog
 */
export function getModuleAccessSummary(draft, moduleName, catalog) {
  const moduleCatalogActions = getModuleCatalogActions(catalog, moduleName);
  const granted = uniqueActions(draft[moduleName]);
  if (granted.length === 0) {
    return 'none';
  }
  if (granted.length === moduleCatalogActions.length) {
    return 'full';
  }
  return 'partial';
}

export default {
  getModuleCatalogActions,
  sanitizePermissionDraft,
  applyPermissionDependencies,
  togglePermissionDraft,
  toggleModuleDraft,
  countGrantedPermissions,
  permissionDraftsEqual,
  getModuleAccessSummary,
};
