export const ORG_PAGE_SIZE = 20;

export const ORG_TAB_KEYS = Object.freeze(['all', 'active', 'kyc_pending', 'suspended']);

export const ORG_TABLE_COLUMNS = Object.freeze([
  'organization_name',
  'tin_number',
  'mobile_number',
  'email',
  'status',
  'created_at',
  'actions',
]);

export function formatDate(dateString, locale, emptyLabel) {
  if (!dateString) return emptyLabel;
  try {
    return new Date(dateString).toLocaleDateString(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return emptyLabel;
  }
}

export function formatDisplayValue(value, emptyLabel) {
  if (value === null || value === undefined || value === '') return emptyLabel;
  return String(value);
}

export function getOrgDisplayName(org) {
  if (!org) return '';
  return org.organizationName || '';
}

export function getOrgStatusVariant(status) {
  switch (status) {
    case 'active':
      return 'active';
    case 'kyc_pending':
    case 'kyc_under_review':
      return 'pending';
    case 'kyc_rejected':
      return 'rejected';
    case 'suspended':
      return 'inactive';
    case 'pending':
      return 'pending';
    default:
      return 'inactive';
  }
}
