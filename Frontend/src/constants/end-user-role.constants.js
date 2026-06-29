/** Canonical external (non-staff) role — bidders may also submit assets for auction. */
export const END_USER_ROLE_CODE = 'bidder';

export const END_USER_ROLE_CODES = Object.freeze([END_USER_ROLE_CODE]);

/** Legacy role code — normalized to bidder in navigation and dashboards. */
export const LEGACY_END_USER_ROLE_CODE = 'asset_owner';

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
