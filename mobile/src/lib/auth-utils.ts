import type { AuthUser } from '@/lib/authStore';

/** Canonical external (non-staff) roles allowed in the mobile app. */
export const END_USER_ROLE_CODES = Object.freeze(['bidder', 'asset_owner']);

/**
 * Returns true when the signed-in account is an auction participant,
 * not staff or admin.
 */
export function isMobileAllowedUser(user: AuthUser | null): boolean {
  if (!user) return false;
  if (user.isStaff) return false;
  if (user.staffId) return false;
  if (user.employeeId) return false;

  const roleCode = user.roleCode;
  if (!roleCode) return true;

  const normalized = roleCode === 'asset_owner' ? 'bidder' : roleCode;
  return END_USER_ROLE_CODES.includes(normalized);
}

export type KycProfileStatus = 'approved' | 'not_submitted' | 'under_review' | 'rejected';

/** True when the user may submit assets (KYC approved or staff). */
export function isKycVerified(user: AuthUser | null): boolean {
  if (!user) return false;
  return user.status === 'active' || Boolean(user.isStaff);
}

/** Returns the KYC status shown on the profile screen, or null for staff accounts. */
export function getKycProfileStatus(user: AuthUser | null): KycProfileStatus | null {
  if (!user || user.isStaff) return null;

  switch (user.status) {
    case 'active':
      return 'approved';
    case 'kyc_under_review':
      return 'under_review';
    case 'kyc_rejected':
      return 'rejected';
    case 'pending':
    case 'kyc_pending':
    default:
      return 'not_submitted';
  }
}

export type AuctionParticipationBannerVariant = 'login' | 'submit' | 'pending' | 'rejected';

export interface AuctionParticipationBannerState {
  variant: AuctionParticipationBannerVariant;
}

/** Returns banner state for auction participation, or null when no banner is needed. */
export function getAuctionParticipationBannerState(
  isAuthenticated: boolean,
  user: AuthUser | null,
): AuctionParticipationBannerState | null {
  if (!isAuthenticated || !user) {
    return { variant: 'login' };
  }

  if (user.isStaff || user.status === 'active') {
    return null;
  }

  switch (user.status) {
    case 'pending':
    case 'kyc_pending':
      return { variant: 'submit' };
    case 'kyc_under_review':
      return { variant: 'pending' };
    case 'kyc_rejected':
      return { variant: 'rejected' };
    default:
      return null;
  }
}
