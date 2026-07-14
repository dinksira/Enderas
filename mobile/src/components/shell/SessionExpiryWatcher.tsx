import { useEffect } from 'react';
import { router, usePathname } from 'expo-router';

import { useAuthStore } from '@/lib/authStore';

// Auth-flow routes (group segment omitted by expo-router). If the user is
// already here, we don't need to redirect — their own error handling applies.
const AUTH_PATHS = new Set([
  '/login',
  '/register',
  '/verify-otp',
  '/forgot-password',
  '/verify-reset-otp',
  '/reset-password',
  '/reset-success',
]);

/**
 * Watches for involuntary logouts (token refresh failed) and routes the user
 * to the login screen with a localized "session expired" notice, preserving
 * the current path as `returnTo` so they land back where they were.
 *
 * Renders nothing; must live inside the navigator so router hooks resolve.
 */
export function SessionExpiryWatcher() {
  const sessionExpired = useAuthStore((s) => s.sessionExpired);
  const acknowledge = useAuthStore((s) => s.acknowledgeSessionExpiry);
  const pathname = usePathname();

  useEffect(() => {
    if (!sessionExpired) return;

    acknowledge();

    if (AUTH_PATHS.has(pathname)) return;

    const params = new URLSearchParams({ reason: 'session_expired' });
    if (pathname && pathname !== '/') {
      params.set('returnTo', pathname);
    }

    router.replace(`/(auth)/login?${params.toString()}` as never);
  }, [sessionExpired, pathname, acknowledge]);

  return null;
}

export default SessionExpiryWatcher;
