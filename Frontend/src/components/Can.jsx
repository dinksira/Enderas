import { useAuth } from '../../hooks/use-auth.js';

/**
 * Conditionally renders children when the current user has module/action access.
 * @param {{ module: string, action?: string, children: import('react').ReactNode, fallback?: import('react').ReactNode }} props
 */
export function Can({ module: moduleName, action, children, fallback = null }) {
  const { can, isHydrating } = useAuth();

  if (isHydrating) {
    return null;
  }

  if (!can(moduleName, action)) {
    return fallback;
  }

  return children;
}

export default Can;
