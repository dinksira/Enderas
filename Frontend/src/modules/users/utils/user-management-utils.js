export const USER_TAB_KEYS = Object.freeze([
  'all',
  'active',
  'kyc_pending',
  'kyc_under_review',
  'kyc_rejected',
  'suspended',
  'deactivated',
]);

export const USER_TABLE_COLUMNS = Object.freeze([
  'display_name',
  'mobile_number',
  'user_type',
  'status',
  'registered_at',
  'actions',
]);

const PAGE_SIZE = 20;

export { PAGE_SIZE as USER_PAGE_SIZE };

/**
 * @param {string|null|undefined} status
 */
export function getUserStatusVariant(status) {
  switch (status) {
    case 'active':
      return 'active';
    case 'kyc_pending':
    case 'pending':
      return 'pending';
    case 'kyc_under_review':
      return 'under-review';
    case 'kyc_rejected':
      return 'rejected';
    case 'suspended':
      return 'suspended';
    case 'deactivated':
      return 'deactivated';
    default:
      return 'default';
  }
}

/**
 * @param {string|null|undefined} value
 * @param {string} [emptyLabel]
 */
export function formatDisplayValue(value, emptyLabel = '—') {
  if (value === null || value === undefined || value === '') {
    return emptyLabel;
  }
  return value;
}

/**
 * @param {string|null|undefined} value
 * @param {string} [locale]
 * @param {string} [emptyLabel]
 */
export function formatDate(value, locale = 'en', emptyLabel = '—') {
  if (!value) return emptyLabel;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return emptyLabel;
  return new Intl.DateTimeFormat(locale === 'am' ? 'am-ET' : 'en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

/**
 * @param {object|null|undefined} user
 */
export function getUserDisplayName(user) {
  if (!user) return '';
  return user.displayName || user.mobileNumber || user.mobile_number || '';
}
