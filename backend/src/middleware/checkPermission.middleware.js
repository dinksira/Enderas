import { canAccess, canAccessRoute } from '../utils/permission-eval.util.js';
import { UnauthorizedError } from '../utils/error.util.js';

function buildForbiddenBody(res, moduleName, actionName) {
  return {
    success: false,
    code: 'FORBIDDEN',
    message: res.__('auth.access_denied'),
    error: {
      type: 'AUTHORIZATION_ERROR',
      module: moduleName,
      action: actionName,
    },
  };
}

function resolveRequestUser(req) {
  if (req.user?.permissions || req.user?.roleCode) {
    return req.user;
  }

  if (!req.auth) {
    return null;
  }

  return {
    id: req.auth.userId,
    userId: req.auth.userId,
    staffId: req.auth.staffId ?? null,
    roleCode: req.auth.role?.code ?? null,
    roleId: req.auth.role?.id ?? null,
    isStaff: Boolean(req.auth.isStaff),
    permissions: {
      wildcard: Boolean(req.auth.permissions?.wildcard),
      modules: req.auth.permissions?.modules ?? [],
      actions: req.auth.permissions?.actions ?? [],
      routes: req.auth.permissions?.routes ?? [],
    },
  };
}

export function checkPermission(moduleName, actionName) {
  return (req, res, next) => {
    const user = resolveRequestUser(req);

    if (!user?.userId && !user?.id) {
      return next(new UnauthorizedError('Authentication required', 'AUTHENTICATION_REQUIRED'));
    }

    const permissionContext = {
      roleCode: user.roleCode,
      wildcard: user.permissions?.wildcard,
      modules: user.permissions?.modules,
      actions: user.permissions?.actions,
      routes: user.permissions?.routes,
    };

    if (canAccess(permissionContext, moduleName, actionName)) {
      return next();
    }

    return res.status(403).json(buildForbiddenBody(res, moduleName, actionName));
  };
}

export function checkRoutePermission(routeSignature) {
  return (req, res, next) => {
    const user = resolveRequestUser(req);

    if (!user?.userId && !user?.id) {
      return next(new UnauthorizedError('Authentication required', 'AUTHENTICATION_REQUIRED'));
    }

    const permissionContext = {
      roleCode: user.roleCode,
      wildcard: user.permissions?.wildcard,
      modules: user.permissions?.modules,
      actions: user.permissions?.actions,
      routes: user.permissions?.routes,
    };

    if (canAccessRoute(permissionContext, routeSignature)) {
      return next();
    }

    return res.status(403).json({
      success: false,
      code: 'FORBIDDEN',
      message: res.__('auth.access_denied'),
      error: {
        type: 'ROUTE_AUTHORIZATION_ERROR',
        route: routeSignature,
      },
    });
  };
}

export default {
  checkPermission,
  checkRoutePermission,
};
