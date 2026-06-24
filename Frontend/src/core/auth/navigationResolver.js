import { canAccess } from '../../utils/permissions.js';
import { ACTIONS } from '../../config/navigation.config.js';

/**
 * @param {object} permissions
 */
export function createPermissionApi(permissions) {
  return {
    canAccess: (moduleName, actionName = ACTIONS.READ) =>
      canAccess(permissions, moduleName, actionName),
    canRead: (moduleName) => canAccess(permissions, moduleName, ACTIONS.READ),
    canCreate: (moduleName) => canAccess(permissions, moduleName, ACTIONS.CREATE),
    canUpdate: (moduleName) => canAccess(permissions, moduleName, ACTIONS.UPDATE),
    canDelete: (moduleName) => canAccess(permissions, moduleName, ACTIONS.DELETE),
    canApprove: (moduleName) => canAccess(permissions, moduleName, ACTIONS.APPROVE),
    canReject: (moduleName) => canAccess(permissions, moduleName, ACTIONS.REJECT),
    canPublish: (moduleName) => canAccess(permissions, moduleName, ACTIONS.PUBLISH),
    canClose: (moduleName) => canAccess(permissions, moduleName, ACTIONS.CLOSE),
    canExport: (moduleName) => canAccess(permissions, moduleName, ACTIONS.EXPORT),
  };
}

export default createPermissionApi;
