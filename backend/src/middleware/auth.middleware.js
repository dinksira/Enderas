import { getRedisClient } from '../config/redis.config.js';
import { env } from '../config/env.config.js';
import { permissionService } from '../services/permission.service.js';
import { verifyAccessToken, signAccessToken } from '../utils/jwt.util.js';
import { generateUuid } from '../utils/crypto.util.js';
import {
  UnauthorizedError,
  buildRoleVersionPointerKey,
  buildRoleVersionPattern,
} from '../utils/error.util.js';

/**
 * Stateless access-token emitter.
 * Maximum lifetime is enforced via JWT_ACCESS_EXPIRES_IN (default 15m).
 */
export function createAccessToken({ identity, authz, sessionId }) {
  return signAccessToken({
    sub: identity.userId,
    sid: sessionId || generateUuid(),
    jti: generateUuid(),
    identity: {
      userId: identity.userId,
      staffId: identity.staffId ?? null,
      employeeId: identity.employeeId ?? null,
      department: identity.department ?? null,
      isStaff: Boolean(identity.isStaff),
      userType: identity.userType ?? 'individual',
      mobileNumber: identity.mobileNumber ?? null,
      email: identity.email ?? null,
      displayName: identity.displayName ?? null,
      preferredLanguage: identity.preferredLanguage ?? 'en',
      isMobileVerified: Boolean(identity.isMobileVerified),
      status: identity.status ?? null,
    },
    authz: {
      roleId: authz.roleId,
      roleCode: authz.roleCode,
      roleName: authz.roleName ?? null,
      permVersion: authz.permVersion,
      permissionVersion: authz.permissionVersion ?? 1,
      permChecksum: authz.permChecksum ?? null,
      wildcard: Boolean(authz.wildcard),
      modules: Array.isArray(authz.modules) ? authz.modules : [],
      actions: Array.isArray(authz.actions) ? authz.actions : [],
      routes: Array.isArray(authz.routes) ? authz.routes : [],
    },
  });
}

/**
 * Invalidate RBAC caches after administrative role mutations.
 * - Bumps version pointer
 * - Deletes all versioned role cache keys
 * - Publishes cross-instance L1 invalidation event
 * @param {string} roleId
 */
export async function invalidateRolePermissionCache(roleId) {
  if (!roleId) {
    throw new Error('roleId is required for permission cache invalidation');
  }

  const redis = getRedisClient();
  const pointerKey = buildRoleVersionPointerKey(roleId);
  const versionPattern = buildRoleVersionPattern(roleId);

  const versionKeys = await redis.keys(versionPattern);

  const pipeline = redis.multi().incr(pointerKey);

  if (versionKeys.length > 0) {
    pipeline.del(...versionKeys);
  }

  await pipeline.exec();

  permissionService.clearL1RoleCache(roleId);

  await redis.publish(
    env.redis.rbacInvalidateChannel,
    JSON.stringify({
      roleId,
      invalidatedAt: new Date().toISOString(),
    }),
  );
}

/**
 * Authenticate bearer access tokens and attach req.auth for downstream authorization.
 */
export function authenticate(req, res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return next(new UnauthorizedError('Missing or invalid authorization header', 'AUTH_HEADER_INVALID'));
  }

  try {
    const decoded = verifyAccessToken(token);

    req.auth = {
      userId: decoded.identity?.userId || decoded.sub,
      staffId: decoded.identity?.staffId ?? null,
      sessionId: decoded.sid,
      tokenId: decoded.jti,
      identity: decoded.identity,
      role: {
        id: decoded.authz?.roleId,
        code: decoded.authz?.roleCode,
      },
      permissions: {
        wildcard: Boolean(decoded.authz?.wildcard),
        modules: decoded.authz?.modules || [],
        actions: decoded.authz?.actions || [],
        routes: decoded.authz?.routes || [],
        version: decoded.authz?.permVersion,
        checksum: decoded.authz?.permChecksum,
      },
      isStaff: Boolean(decoded.identity?.isStaff),
    };

    req.user = {
      id: req.auth.userId,
      userId: req.auth.userId,
      staffId: req.auth.staffId,
      roleCode: req.auth.role.code,
      roleId: req.auth.role.id,
      isStaff: req.auth.isStaff,
      status: decoded.identity?.status ?? null,
      identity: req.auth.identity,
      permissions: req.auth.permissions,
    };

    return next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return next(new UnauthorizedError('Access token expired', 'ACCESS_TOKEN_EXPIRED'));
    }

    return next(new UnauthorizedError('Invalid access token', 'ACCESS_TOKEN_INVALID'));
  }
}

export const authMiddleware = Object.freeze({
  authenticate,
  createAccessToken,
  invalidateRolePermissionCache,
});

export default authMiddleware;
