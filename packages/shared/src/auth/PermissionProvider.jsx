import { createContext, useContext, useMemo } from 'react';
import { useAuthStore } from './auth-store.js';
import { createPermissionApi } from './navigationResolver.js';
import { resolveNavigation } from '../config/navigation.config.js';

const PermissionContext = createContext(null);

export function PermissionProvider({ children }) {
  const permissions = useAuthStore((state) => state.permissions);
  const user = useAuthStore((state) => state.user);
  const status = useAuthStore((state) => state.status);

  const value = useMemo(() => ({
    permissions,
    user,
    status,
    isAuthenticated: status === 'authenticated',
    navigation: resolveNavigation(permissions),
    ...createPermissionApi(permissions),
  }), [permissions, user, status]);

  return (
    <PermissionContext.Provider value={value}>
      {children}
    </PermissionContext.Provider>
  );
}

export function usePermissionContext() {
  const context = useContext(PermissionContext);
  if (!context) {
    throw new Error('usePermissionContext must be used within PermissionProvider');
  }
  return context;
}

export default PermissionProvider;
