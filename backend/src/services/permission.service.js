import { getRedisSubscriber } from '../config/redis.config.js';
import { env } from '../config/env.config.js';
import { Role } from '../models/role.model.js';
import { normalizeRolePermissions } from '../schemas/permission.schema.js';
import { L1Cache } from '../utils/l1-cache.util.js';
import { withRedis } from '../utils/redis-safe.util.js';
import {
  AppError,
  buildRoleCacheKey,
  buildRoleVersionPointerKey,
  buildRoleCacheVersion,
} from '../utils/error.util.js';

const l1Cache = new L1Cache(env.rbac.l1TtlMs);
let invalidationListenerReady = false;

function buildL1Key(roleId, version) {
  return `${roleId}:${version}`;
}

function attachVersion(canonical, roleUpdatedAt) {
  const version = buildRoleCacheVersion(roleUpdatedAt, canonical.permissionVersion);
  return {
    ...canonical,
    version,
  };
}

async function readRoleFromDatabase(roleId) {
  const role = await Role.findByPk(roleId, {
    attributes: ['id', 'code', 'description', 'updated_at', 'is_active'],
  });

  if (!role || !role.is_active) {
    throw new AppError('Role not found or inactive', 404, 'ROLE_NOT_FOUND');
  }

  return role.get({ plain: true });
}

async function writeRoleCache(roleId, version, canonical) {
  await withRedis(async (redis) => {
    const cacheKey = buildRoleCacheKey(roleId, version);
    const pointerKey = buildRoleVersionPointerKey(roleId);

    await redis
      .multi()
      .set(cacheKey, JSON.stringify(canonical), 'EX', env.redis.roleCacheTtlSeconds)
      .set(pointerKey, version)
      .exec();
  });
}

async function readRoleCache(roleId) {
  return withRedis(async (redis) => {
    const pointerKey = buildRoleVersionPointerKey(roleId);
    const version = await redis.get(pointerKey);

    if (!version) {
      return null;
    }

    const cacheKey = buildRoleCacheKey(roleId, version);
    const cachedValue = await redis.get(cacheKey);

    if (!cachedValue) {
      return null;
    }

    try {
      return JSON.parse(cachedValue);
    } catch {
      return null;
    }
  }, null);
}

async function loadFromColdSource(roleId) {
  const role = await readRoleFromDatabase(roleId);
  const canonical = attachVersion(normalizeRolePermissions(role), role.updated_at);
  await writeRoleCache(roleId, canonical.version, canonical);
  l1Cache.set(buildL1Key(roleId, canonical.version), canonical);
  return canonical;
}

export function clearL1RoleCache(roleId) {
  if (!roleId) {
    l1Cache.clear();
    return;
  }

  l1Cache.deleteByPrefix(`${roleId}:`);
}

async function ensureInvalidationListener() {
  if (invalidationListenerReady) {
    return;
  }

  try {
    const subscriber = getRedisSubscriber();

    if (subscriber.status === 'wait') {
      await subscriber.connect();
    }

    await subscriber.subscribe(env.redis.rbacInvalidateChannel);

    subscriber.on('message', (channel, message) => {
      if (channel !== env.redis.rbacInvalidateChannel) {
        return;
      }

      try {
        const payload = JSON.parse(message);
        clearL1RoleCache(payload.roleId || null);
      } catch {
        clearL1RoleCache(null);
      }
    });

    invalidationListenerReady = true;
  } catch (error) {
    console.warn('[permission.service] redis pub/sub listener disabled:', error.message);
  }
}

export async function getRolePermissions(roleId) {
  if (!roleId) {
    throw new AppError('roleId is required', 400, 'ROLE_ID_REQUIRED');
  }

  try {
    await ensureInvalidationListener();

    const currentVersion = await withRedis(async (redis) => {
      const pointerKey = buildRoleVersionPointerKey(roleId);
      return redis.get(pointerKey);
    }, null);

    if (currentVersion) {
      const l1Hit = l1Cache.get(buildL1Key(roleId, currentVersion));
      if (l1Hit) {
        return l1Hit;
      }
    }

    const l2Hit = await readRoleCache(roleId);
    if (l2Hit) {
      l1Cache.set(buildL1Key(roleId, l2Hit.version), l2Hit);
      return l2Hit;
    }

    return await loadFromColdSource(roleId);
  } catch (error) {
    console.error('[getRolePermissions] failed for role:', roleId, error);
    throw error;
  }
}

export const permissionService = Object.freeze({
  getRolePermissions,
  clearL1RoleCache,
});

export default permissionService;
