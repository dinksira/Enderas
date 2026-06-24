import { AppError, buildPermissionChecksum } from '../utils/error.util.js';

const WILDCARD = '*';
export const SUPER_ADMIN_CODE = 'super_admin';

const EMPTY_PERMISSIONS_BLOCK = Object.freeze({
  modules: [],
  actions: [],
  routes: [],
});

function uniqueStrings(values) {
  if (!Array.isArray(values)) {
    return [];
  }

  return [...new Set(values.filter((value) => typeof value === 'string' && value.length > 0))];
}

function hasWildcardToken(values) {
  return Array.isArray(values) && values.includes(WILDCARD);
}

function detectWildcard(roleCode, permissionsBlock) {
  if (roleCode === SUPER_ADMIN_CODE) {
    return true;
  }

  if (!permissionsBlock || typeof permissionsBlock !== 'object') {
    return false;
  }

  return (
    permissionsBlock.wildcard === true
    || hasWildcardToken(permissionsBlock.modules)
    || hasWildcardToken(permissionsBlock.actions)
    || hasWildcardToken(permissionsBlock.routes)
  );
}

/**
 * Safely parses roles.description without crashing the auth pipeline.
 * Returns a default permissions envelope when description is null or malformed.
 * @param {string|object|null|undefined} description
 */
export function safeParseRoleDescription(description) {
  if (!description) {
    return {
      summary: '',
      permissions: { ...EMPTY_PERMISSIONS_BLOCK },
      permissionVersion: 1,
      parseWarning: 'ROLE_DESCRIPTION_EMPTY',
    };
  }

  let parsed = description;

  if (typeof description === 'string') {
    try {
      parsed = JSON.parse(description);
    } catch (error) {
      console.warn('[permission.schema] invalid roles.description JSON:', error.message);
      return {
        summary: '',
        permissions: { ...EMPTY_PERMISSIONS_BLOCK },
        permissionVersion: 1,
        parseWarning: 'ROLE_DESCRIPTION_INVALID_JSON',
      };
    }
  }

  if (!parsed || typeof parsed !== 'object') {
    return {
      summary: '',
      permissions: { ...EMPTY_PERMISSIONS_BLOCK },
      permissionVersion: 1,
      parseWarning: 'ROLE_DESCRIPTION_NOT_OBJECT',
    };
  }

  const permissionsBlock = parsed.permissions && typeof parsed.permissions === 'object'
    ? parsed.permissions
    : { ...EMPTY_PERMISSIONS_BLOCK };

  return {
    summary: typeof parsed.summary === 'string' ? parsed.summary : '',
    permissions: {
      modules: uniqueStrings(permissionsBlock.modules),
      actions: uniqueStrings(permissionsBlock.actions),
      routes: uniqueStrings(permissionsBlock.routes),
    },
    permissionVersion: Number.isFinite(Number(parsed.permissionVersion))
      && Number(parsed.permissionVersion) > 0
      ? Number(parsed.permissionVersion)
      : 1,
    parseWarning: null,
  };
}

function resolvePermissionVersion(parsed) {
  const version = Number(parsed.permissionVersion);
  return Number.isFinite(version) && version > 0 ? version : 1;
}

/**
 * Normalize roles.description into a canonical permission matrix.
 * @param {{ id: string, code: string, description?: string|object|null, updated_at?: Date|string, is_active?: boolean }} role
 */
export function normalizeRolePermissions(role) {
  if (role.is_active === false) {
    throw new AppError('Role is inactive', 403, 'ROLE_INACTIVE');
  }

  const parsed = safeParseRoleDescription(role.description);
  const permissionsBlock = parsed.permissions;
  const wildcard = detectWildcard(role.code, permissionsBlock);
  const permissionVersion = resolvePermissionVersion(parsed);

  const canonical = {
    roleId: role.id,
    code: role.code,
    version: null,
    permissionVersion,
    summary: parsed.summary,
    wildcard,
    permissions: {
      modules: wildcard ? [WILDCARD] : uniqueStrings(permissionsBlock.modules),
      actions: wildcard ? [WILDCARD] : uniqueStrings(permissionsBlock.actions),
      routes: wildcard ? [WILDCARD] : uniqueStrings(permissionsBlock.routes),
    },
    parsedAt: new Date().toISOString(),
    checksum: null,
    parseWarning: parsed.parseWarning,
  };

  canonical.checksum = buildPermissionChecksum(canonical);
  return canonical;
}

export default {
  normalizeRolePermissions,
  safeParseRoleDescription,
  WILDCARD,
  SUPER_ADMIN_CODE,
};
