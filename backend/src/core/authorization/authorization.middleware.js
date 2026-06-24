import { authenticate as baseAuthenticate } from '../../middleware/auth.middleware.js';
import { UnauthorizedError } from '../../utils/error.util.js';
import { logAccessDenied } from '../../services/audit.service.js';
import { buildPermissionContext } from './permission.service.js';
import { policyEngine } from './policy.engine.js';
import { resolveApiAccess } from './access-map.js';

function buildAccessDeniedBody(res, moduleName, actionName) {
  return {
    success: false,
    code: 'ACCESS_DENIED',
    message: res.__('auth.access_denied'),
    error: {
      type: 'AUTHORIZATION_ERROR',
      module: moduleName ?? null,
      action: actionName ?? null,
    },
  };
}

function resolveRequestPrincipal(req) {
  if (req.user?.permissions || req.user?.roleCode) {
    return {
      roleCode: req.user.roleCode,
      roleId: req.user.roleId,
      wildcard: req.user.permissions?.wildcard,
      modules: req.user.permissions?.modules,
      actions: req.user.permissions?.actions,
      routes: req.user.permissions?.routes,
    };
  }

  if (req.auth?.permissions) {
    return {
      roleCode: req.auth.role?.code,
      roleId: req.auth.role?.id,
      wildcard: req.auth.permissions?.wildcard,
      modules: req.auth.permissions?.modules,
      actions: req.auth.permissions?.actions,
      routes: req.auth.permissions?.routes,
    };
  }

  return null;
}

export function authorize(requirement = {}) {
  return async (req, res, next) => {
    const principal = resolveRequestPrincipal(req);

    if (!req.user?.id && !req.auth?.userId) {
      return next(new UnauthorizedError('Authentication required', 'AUTHENTICATION_REQUIRED'));
    }

    const context = buildPermissionContext({
      role: { code: principal?.roleCode, id: principal?.roleId },
      wildcard: principal?.wildcard,
      modules: principal?.modules,
      actions: principal?.actions,
      routes: principal?.routes,
      effectiveRoleId: principal?.roleId,
    });

    const { module: moduleName, action: actionName, routeSignature } = requirement;

    if (!moduleName && !routeSignature) {
      return next();
    }

    let allowed = false;

    if (routeSignature) {
      allowed = policyEngine.canAccessRouteSignature(context, routeSignature);
    }

    if (!allowed && moduleName && actionName) {
      allowed = policyEngine.hasPermission(context, moduleName, actionName);
    } else if (!allowed && moduleName && !actionName) {
      allowed = policyEngine.canRead(context, moduleName);
    }

    if (allowed) {
      return next();
    }

    await logAccessDenied(req, { module: moduleName, action: actionName, routeSignature });

    return res.status(403).json(buildAccessDeniedBody(res, moduleName, actionName));
  };
}

export function authorizeFromRoute() {
  return async (req, res, next) => {
    const path = req.baseUrl + req.route.path;
    const normalizedPath = path.replace(/\/+/g, '/').replace(/\/$/, '') || '/';
    const requirement = resolveApiAccess(req.method, normalizedPath);

    if (!requirement || (!requirement.module && !requirement.action)) {
      return next();
    }

    return authorize(requirement)(req, res, next);
  };
}

export function attachDataScope(moduleName) {
  return (req, res, next) => {
    req.dataScope = {
      module: moduleName,
      userId: req.user?.id ?? req.auth?.userId,
      staffId: req.user?.staffId ?? req.auth?.staffId ?? null,
      isStaff: Boolean(req.user?.isStaff ?? req.auth?.isStaff),
      isWildcard: policyEngine.isWildcardPrincipal(resolveRequestPrincipal(req) ?? {}),
    };
    return next();
  };
}

export const authenticate = baseAuthenticate;

export const authorizationMiddleware = Object.freeze({
  authenticate,
  authorize,
  authorizeFromRoute,
  attachDataScope,
});

export default authorizationMiddleware;
