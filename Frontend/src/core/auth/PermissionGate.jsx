import { usePermission } from './usePermission.js';

/**
 * @param {{
 *   module: string,
 *   action?: string,
 *   children: import('react').ReactNode,
 *   fallback?: import('react').ReactNode,
 * }} props
 */
export function PermissionGate({
  module: moduleName,
  action = 'read',
  children,
  fallback = null,
}) {
  const { canAccess, isAuthenticated } = usePermission();

  if (!isAuthenticated) {
    return fallback;
  }

  if (!canAccess(moduleName, action)) {
    return fallback;
  }

  return children;
}

export default PermissionGate;
