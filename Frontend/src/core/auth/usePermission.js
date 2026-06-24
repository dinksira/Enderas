import { useMemo } from 'react';
import { useAuthStore } from '../../stores/auth-store.js';
import { createPermissionApi } from './navigationResolver.js';
import { resolveNavigation } from '../../config/navigation.config.js';

export function usePermission() {
  const permissions = useAuthStore((state) => state.permissions);
  const roleCode = useAuthStore((state) => state.permissions?.roleCode);
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.status === 'authenticated');

  const api = useMemo(() => createPermissionApi(permissions), [permissions]);
  const navigation = useMemo(() => resolveNavigation(permissions), [permissions]);

  return {
    ...api,
    permissions,
    roleCode,
    user,
    isAuthenticated,
    navigation,
  };
}

export default usePermission;
