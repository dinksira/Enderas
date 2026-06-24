import { env } from '../../config/env.config.js';
import { L1Cache } from '../../utils/l1-cache.util.js';
import { withRedis } from '../../utils/redis-safe.util.js';
import { getUserPermissions } from '../../services/user-permission.service.js';
import { getRolePermissions } from '../../services/permission.service.js';

const principalL1 = new L1Cache(env.rbac.l1TtlMs);

function buildPrincipalCacheKey(userId) {
  return `principal:${userId}`;
}

/**
 * L1 cache facade over existing user + role permission caches.
 */
export async function getCachedPrincipal(userId, options = {}) {
  if (!userId) {
    return null;
  }

  if (!options.bypassCache) {
    const l1Hit = principalL1.get(buildPrincipalCacheKey(userId));
    if (l1Hit) {
      return l1Hit;
    }
  }

  const permissions = await getUserPermissions(userId, options);
  principalL1.set(buildPrincipalCacheKey(userId), permissions);
  return permissions;
}

export async function getCachedRolePermissions(roleId) {
  return getRolePermissions(roleId);
}

export function clearPrincipalCache(userId) {
  if (userId) {
    principalL1.delete(buildPrincipalCacheKey(userId));
    return;
  }
  principalL1.clear();
}

export async function warmPrincipalCache(userId) {
  return getCachedPrincipal(userId, { bypassCache: true });
}

export const permissionCache = Object.freeze({
  getCachedPrincipal,
  getCachedRolePermissions,
  clearPrincipalCache,
  warmPrincipalCache,
});

export default permissionCache;
