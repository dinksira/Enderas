import { authenticate, authorize, authorizeFromRoute, attachDataScope } from './authorization.middleware.js';
import { policyEngine } from './policy.engine.js';
import { authorizationPermissionService } from './permission.service.js';
import { roleService } from './role.service.js';
import { permissionCache } from './permission-cache.js';
import {
  API_ACCESS_MAP,
  PAGE_ACCESS_REGISTRY,
  DATA_SCOPE_RULES,
  MODULES,
  ACTIONS,
  resolveApiAccess,
} from './access-map.js';

export {
  authenticate,
  authorize,
  authorizeFromRoute,
  attachDataScope,
  policyEngine,
  authorizationPermissionService,
  roleService,
  permissionCache,
  API_ACCESS_MAP,
  PAGE_ACCESS_REGISTRY,
  DATA_SCOPE_RULES,
  MODULES,
  ACTIONS,
  resolveApiAccess,
};

export default {
  authenticate,
  authorize,
  authorizeFromRoute,
  attachDataScope,
  policyEngine,
  authorizationPermissionService,
  roleService,
  permissionCache,
  API_ACCESS_MAP,
  PAGE_ACCESS_REGISTRY,
  DATA_SCOPE_RULES,
  MODULES,
  ACTIONS,
  resolveApiAccess,
};
