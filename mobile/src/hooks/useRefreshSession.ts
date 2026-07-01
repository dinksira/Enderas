import { useCallback, useState } from 'react';

import { useAuthStore } from '@/lib/authStore';
import { getMe } from '@/services/authApi';

interface UseRefreshSessionResult {
  refreshing: boolean;
  refresh: () => Promise<void>;
}

/** Pull-to-refresh helper that re-fetches `/auth/me` and updates the stored user. */
export function useRefreshSession(): UseRefreshSessionResult {
  const accessToken = useAuthStore((s) => s.accessToken);
  const setSession = useAuthStore((s) => s.setSession);
  const [refreshing, setRefreshing] = useState(false);

  const refresh = useCallback(async () => {
    if (!accessToken) return;

    setRefreshing(true);
    try {
      const me = await getMe();
      setSession({
        accessToken,
        user: {
          id: me.id,
          roleId: me.roleId,
          roleCode: me.roleCode,
          userType: me.userType,
          staffId: me.staffId,
          displayName: me.identity.displayName,
          mobileNumber: me.identity.mobileNumber,
          email: me.identity.email,
          isStaff: me.identity.isStaff,
          status: me.status,
        },
      });
    } catch {
      // Keep cached session on transient failures.
    } finally {
      setRefreshing(false);
    }
  }, [accessToken, setSession]);

  return { refreshing, refresh };
}

export default useRefreshSession;
