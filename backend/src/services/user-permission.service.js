import { QueryTypes } from 'sequelize';
import { sequelize } from '../config/db.config.js';
import { env } from '../config/env.config.js';
import { normalizeRolePermissions } from '../schemas/permission.schema.js';
import { L1Cache } from '../utils/l1-cache.util.js';
import { withRedis } from '../utils/redis-safe.util.js';
import { UnauthorizedError, AppError, buildRoleCacheVersion } from '../utils/error.util.js';
import { resolvePublicUploadUrl } from '../utils/media-url.util.js';

const USER_PERMISSIONS_SQL = `
  SELECT
    u.id AS user_id,
    u.role_id AS user_role_id,
    u.user_type,
    u.mobile_number,
    u.email,
    u.first_name,
    u.last_name,
    u.organization_name,
    u.profile_picture,
    u.preferred_language,
    u.is_mobile_verified,
    u.is_email_verified,
    u.status AS user_status,
    s.id AS staff_id,
    s.employee_id,
    s.department,
    s.role_id AS staff_role_id,
    s.is_active AS staff_is_active,
    COALESCE(s.role_id, u.role_id) AS effective_role_id,
    r.id AS role_id,
    r.code AS role_code,
    r.name AS role_name,
    r.description AS role_description,
    r.is_active AS role_is_active,
    r.updated_at AS role_updated_at
  FROM users u
  LEFT JOIN staff s
    ON s.user_id = u.id
   AND s.deleted_at IS NULL
   AND s.is_active = 1
  INNER JOIN roles r
    ON r.id = COALESCE(s.role_id, u.role_id)
   AND r.is_active = 1
  WHERE u.id = :userId
    AND u.deleted_at IS NULL
  LIMIT 1
`;

const userPermissionL1 = new L1Cache(env.rbac.l1TtlMs);

function buildUserCacheKey(userId, version) {
  return `rbac:user:${userId}:${version}`;
}

function buildDisplayName(row) {
  if (row.user_type === 'organization' && row.organization_name) {
    return row.organization_name;
  }

  const fullName = [row.first_name, row.last_name].filter(Boolean).join(' ').trim();
  return fullName || row.mobile_number;
}

const NON_STAFF_LOGIN_STATUSES = Object.freeze([
  'active',
  'kyc_pending',
  'kyc_under_review',
  'kyc_rejected',
]);

const BLOCKED_ACCOUNT_STATUSES = Object.freeze(['suspended', 'deactivated']);

function normalizeUserStatus(status) {
  if (status == null) {
    return status;
  }

  if (Buffer.isBuffer(status)) {
    return status.toString();
  }

  return String(status);
}

function assertActiveAccount(row) {
  if (!row) {
    throw new UnauthorizedError('Account not found', 'ACCOUNT_NOT_FOUND');
  }

  const status = normalizeUserStatus(row.user_status);
  const isStaff = Boolean(row.staff_id);

  if (isStaff) {
    // Staff must always be active
    if (status !== 'active') {
      throw new UnauthorizedError(`Account is ${status}`, 'ACCOUNT_INACTIVE');
    }
  } else {
    // Only blocked statuses are forbidden for non-staff
    if (BLOCKED_ACCOUNT_STATUSES.includes(status)) {
      throw new UnauthorizedError(`Account is ${status}`, 'ACCOUNT_INACTIVE');
    }
    // Allow all other statuses (including KYC-related ones)
    // This ensures users with kyc_pending, kyc_under_review, kyc_rejected can log in
  }

  if (!row.role_is_active) {
    throw new UnauthorizedError('Assigned role is inactive', 'ROLE_INACTIVE');
  }
}

function mapUserPermissionRecord(row) {
  const role = {
    id: row.role_id,
    code: row.role_code,
    name: row.role_name,
    description: row.role_description,
    updated_at: row.role_updated_at,
    is_active: Boolean(row.role_is_active),
  };

  const canonical = normalizeRolePermissions(role);
  const version = buildRoleCacheVersion(row.role_updated_at, canonical.permissionVersion);
  const isStaff = Boolean(row.staff_id);

  return {
    userId: row.user_id,
    userStatus: row.user_status,
    userType: row.user_type,
    mobileNumber: row.mobile_number,
    email: row.email,
    firstName: row.first_name ?? null,
    lastName: row.last_name ?? null,
    organizationName: row.organization_name ?? null,
    profilePicture: resolvePublicUploadUrl(row.profile_picture) ?? null,
    displayName: buildDisplayName(row),
    preferredLanguage: row.preferred_language,
    isMobileVerified: Boolean(row.is_mobile_verified),
    isEmailVerified: Boolean(row.is_email_verified),
    isStaff,
    staffId: row.staff_id ?? null,
    employeeId: row.employee_id ?? null,
    department: row.department ?? null,
    userRoleId: row.user_role_id,
    staffRoleId: row.staff_role_id ?? null,
    effectiveRoleId: row.effective_role_id,
    role: {
      id: row.role_id,
      code: row.role_code,
      name: row.role_name,
    },
    summary: canonical.summary,
    wildcard: canonical.wildcard,
    modules: canonical.permissions.modules,
    actions: canonical.permissions.actions,
    routes: canonical.permissions.routes,
    moduleActions: canonical.permissions.moduleActions,
    permissionVersion: canonical.permissionVersion,
    checksum: canonical.checksum,
    version,
    resolvedAt: new Date().toISOString(),
  };
}

async function readUserPermissionCache(userId) {
  return withRedis(async (redis) => {
    const pointerKeys = await redis.keys(`rbac:user:${userId}:*`);
    if (pointerKeys.length === 0) {
      return null;
    }

    const cachedValues = await redis.mget(pointerKeys);
    const parsed = cachedValues
      .map((value) => {
        try {
          return value ? JSON.parse(value) : null;
        } catch {
          return null;
        }
      })
      .filter(Boolean)
      .sort((a, b) => String(b.version).localeCompare(String(a.version)));

    return parsed[0] ?? null;
  }, null);
}

async function writeUserPermissionCache(record) {
  await withRedis(async (redis) => {
    await redis.set(
      buildUserCacheKey(record.userId, record.version),
      JSON.stringify(record),
      'EX',
      env.rbac.userCacheTtlSeconds,
    );
  });
}

async function loadUserPermissionsFromDatabase(userId) {
  const rows = await sequelize.query(USER_PERMISSIONS_SQL, {
    replacements: { userId },
    type: QueryTypes.SELECT,
  });

  const row = rows[0];
  assertActiveAccount(row);

  const record = mapUserPermissionRecord(row);
  userPermissionL1.set(record.userId, record);
  await writeUserPermissionCache(record);

  return record;
}

/**
 * Resolves a user's effective RBAC matrix from users + staff + roles.
 * @param {string} userId
 * @param {{ bypassCache?: boolean }} [options]
 */
export async function getUserPermissions(userId, options = {}) {
  if (!userId || typeof userId !== 'string') {
    throw new AppError('userId is required', 400, 'USER_ID_REQUIRED');
  }

  try {
    if (!options.bypassCache) {
      const l1Hit = userPermissionL1.get(userId);
      if (l1Hit) {
        return l1Hit;
      }

      const l2Hit = await readUserPermissionCache(userId);
      if (l2Hit) {
        userPermissionL1.set(userId, l2Hit);
        return l2Hit;
      }
    }

    return await loadUserPermissionsFromDatabase(userId);
  } catch (error) {
    console.error('[getUserPermissions] failed for user:', userId, error);
    throw error;
  }
}

export async function clearUserPermissionCache(userId) {
  userPermissionL1.delete(userId);

  if (!userId) {
    return;
  }

  await withRedis(async (redis) => {
    const keys = await redis.keys(`rbac:user:${userId}:*`);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  });
}

export const userPermissionService = Object.freeze({
  getUserPermissions,
  clearUserPermissionCache,
});

export default userPermissionService;
