import { createHash } from 'node:crypto';

export class AppError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR') {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized', code = 'UNAUTHORIZED') {
    super(message, 401, code);
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden', code = 'FORBIDDEN') {
    super(message, 403, code);
    this.name = 'ForbiddenError';
  }
}

export class InvalidCredentialsError extends AppError {
  constructor(message = 'The credentials provided are incorrect.') {
    super(message, 401, 'INVALID_CREDENTIALS');
    this.name = 'InvalidCredentialsError';
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found', code = 'NOT_FOUND') {
    super(message, 404, code);
    this.name = 'NotFoundError';
  }
}

export function buildPermissionChecksum(canonical) {
  const payload = JSON.stringify({
    roleId: canonical.roleId,
    code: canonical.code,
    permissionVersion: canonical.permissionVersion,
    wildcard: canonical.wildcard,
    modules: canonical.permissions.modules,
    actions: canonical.permissions.actions,
    routes: canonical.permissions.routes,
    moduleActions: canonical.permissions.moduleActions,
  });

  return createHash('sha256').update(payload).digest('hex').slice(0, 16);
}

export function roleVersionFromTimestamp(updatedAt) {
  const timestamp = updatedAt instanceof Date
    ? updatedAt.getTime()
    : new Date(updatedAt).getTime();

  if (Number.isNaN(timestamp)) {
    throw new AppError('Invalid role updated_at timestamp', 500, 'ROLE_VERSION_ERROR');
  }

  return String(timestamp);
}

export function buildRoleCacheVersion(updatedAt, permissionVersion = 1) {
  const timestamp = roleVersionFromTimestamp(updatedAt);
  const version = Number.isFinite(Number(permissionVersion))
    ? Number(permissionVersion)
    : 1;

  return `${timestamp}-v${version}`;
}

export function buildRoleCacheKey(roleId, version) {
  return `rbac:role:${roleId}:v${version}`;
}

export function buildRoleVersionPointerKey(roleId) {
  return `rbac:role:${roleId}:current_version`;
}

export function buildRoleVersionPattern(roleId) {
  return `rbac:role:${roleId}:v*`;
}

export default {
  AppError,
  UnauthorizedError,
  ForbiddenError,
  InvalidCredentialsError,
  NotFoundError,
  buildPermissionChecksum,
  roleVersionFromTimestamp,
  buildRoleCacheVersion,
  buildRoleCacheKey,
  buildRoleVersionPointerKey,
  buildRoleVersionPattern,
};
