import { router } from 'expo-router';

import { useAuthStore } from '@/lib/authStore';

/** Guard screens that require an active password-reset mobile number. */
export function ensurePasswordResetMobile(): boolean {
  const mobile = useAuthStore.getState().pendingPasswordResetMobile;
  if (!mobile) {
    router.replace('/(auth)/forgot-password');
    return false;
  }
  return true;
}

/** Guard the new-password step — requires a verified OTP. */
export function ensureVerifiedResetOtp(): boolean {
  const { pendingPasswordResetMobile, verifiedPasswordResetOtp } = useAuthStore.getState();

  if (!pendingPasswordResetMobile) {
    router.replace('/(auth)/forgot-password');
    return false;
  }

  if (!verifiedPasswordResetOtp) {
    router.replace('/(auth)/verify-reset-otp');
    return false;
  }

  return true;
}
