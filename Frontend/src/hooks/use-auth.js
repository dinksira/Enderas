import { useAuthStore } from '../stores/auth-store.js';

/**
 * Thin selector hook for RBAC-aware components.
 */
export function useAuth() {
  const status = useAuthStore((state) => state.status);
  const user = useAuthStore((state) => state.user);
  const permissions = useAuthStore((state) => state.permissions);
  const can = useAuthStore((state) => state.can);
  const setSession = useAuthStore((state) => state.setSession);
  const clearSession = useAuthStore((state) => state.clearSession);
  const setStatus = useAuthStore((state) => state.setStatus);

  return {
    status,
    user,
    permissions,
    can,
    setSession,
    clearSession,
    setStatus,
    isAuthenticated: status === 'authenticated',
    isHydrating: status === 'hydrating' || status === 'idle',
  };
}

export default useAuth;
