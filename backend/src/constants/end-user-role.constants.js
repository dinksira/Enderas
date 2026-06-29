/** Canonical external (non-staff) role — bidders may also submit assets for auction. */
export const END_USER_ROLE_CODE = 'bidder';

export const END_USER_ROLE_CODES = Object.freeze([END_USER_ROLE_CODE]);

/** Legacy role code — kept for staff guards and backward-compatible lookups only. */
export const LEGACY_END_USER_ROLE_CODE = 'asset_owner';

/** Roles that must never be assigned to staff accounts. */
export const NON_STAFF_END_USER_ROLE_CODES = Object.freeze([
  END_USER_ROLE_CODE,
  LEGACY_END_USER_ROLE_CODE,
]);

/**
 * @param {string | null | undefined} roleCode
 * @returns {string | null | undefined}
 */
export function normalizeEndUserRoleCode(roleCode) {
  if (roleCode === LEGACY_END_USER_ROLE_CODE) {
    return END_USER_ROLE_CODE;
  }
  return roleCode;
}

/**
 * @param {string | null | undefined} roleCode
 */
export function isAssignableEndUserRoleCode(roleCode) {
  return roleCode === END_USER_ROLE_CODE;
}

/**
 * @param {string | null | undefined} roleCode
 */
export function isNonStaffEndUserRoleCode(roleCode) {
  return NON_STAFF_END_USER_ROLE_CODES.includes(roleCode);
}
