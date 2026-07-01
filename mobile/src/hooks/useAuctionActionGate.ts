import { useCallback, useMemo } from 'react';
import { router } from 'expo-router';

import { isKycVerified } from '@/lib/auth-utils';
import { useAuthStore, useIsAuthenticated } from '@/lib/authStore';

export type AuctionGateReason = 'login' | 'kyc' | null;

export function useAuctionActionGate() {
  const isAuthenticated = useIsAuthenticated();
  const user = useAuthStore((s) => s.user);
  const kycVerified = isKycVerified(user);

  const gateReason: AuctionGateReason = useMemo(() => {
    if (!isAuthenticated) return 'login';
    if (!kycVerified) return 'kyc';
    return null;
  }, [isAuthenticated, kycVerified]);

  const requireParticipationAccess = useCallback(
    (returnTo: string, onAllowed: () => void) => {
      if (!isAuthenticated) {
        router.push(`/(auth)/login?returnTo=${encodeURIComponent(returnTo)}` as any);
        return false;
      }
      if (!kycVerified) {
        return false;
      }
      onAllowed();
      return true;
    },
    [isAuthenticated, kycVerified],
  );

  return {
    isAuthenticated,
    kycVerified,
    gateReason,
    requireParticipationAccess,
  };
}

export default useAuctionActionGate;
