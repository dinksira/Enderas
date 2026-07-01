const DOCUMENT_URL_FIELDS = [
  'document_front_url',
  'document_back_url',
  'trade_license_url',
  'tin_certificate_url',
  'business_registration_url',
];

/**
 * @param {object|null|undefined} kyc
 */
export function getApplicantName(kyc) {
  const kycUser = kyc?.user;
  if (!kycUser) return '';
  const fullName = [kycUser.first_name, kycUser.last_name].filter(Boolean).join(' ');
  return fullName || kycUser.organization_name || kycUser.mobile_number || '';
}

/**
 * @param {object|null|undefined} kyc
 */
export function countDocuments(kyc) {
  if (!kyc) return 0;
  return DOCUMENT_URL_FIELDS.filter((field) => Boolean(kyc[field])).length;
}

/**
 * @param {object|null|undefined} kyc
 * @returns {'pending'|'under_review'|'approved'|'rejected'}
 */
export function getDisplayStatus(kyc) {
  if (!kyc) return 'pending';
  if (kyc.status === 'approved') return 'approved';
  if (kyc.status === 'rejected') return 'rejected';
  if (kyc.under_review_at) return 'under_review';
  return 'pending';
}

/**
 * @param {object|null|undefined} kyc
 */
export function getStatusPillClass(kyc) {
  const status = getDisplayStatus(kyc);
  return `kyc-status-pill kyc-status-pill--${status.replace('_', '-')}`;
}

/**
 * @param {string|null|undefined} value
 * @param {string} [locale]
 */
export function formatDate(value, locale = 'en') {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat(locale === 'am' ? 'am-ET' : 'en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

/**
 * @param {object|null|undefined} staff
 */
export function getStaffDisplayName(staff) {
  if (!staff) return '';
  const user = staff.user;
  if (user) {
    const fullName = [user.first_name, user.last_name].filter(Boolean).join(' ');
    if (fullName) return fullName;
  }
  return staff.employee_id || '';
}

/**
 * @param {object|null|undefined} kyc
 * @returns {Array<{ key: string, labelKey: string, url: string }>}
 */
export function getDocumentEntries(kyc) {
  if (!kyc) return [];

  const entries = [];
  const map = {
    document_front_url: 'kyc.nationalIdFront',
    document_back_url: 'kyc.nationalIdBack',
    trade_license_url: 'kyc.tradeLicense',
    tin_certificate_url: 'kyc.tinCertificate',
    business_registration_url: 'kyc.businessRegistration',
  };

  Object.entries(map).forEach(([field, labelKey]) => {
    if (kyc[field]) {
      entries.push({ key: field, labelKey, url: kyc[field] });
    }
  });

  return entries;
}

/**
 * @param {string} url
 */
export function isPdfUrl(url) {
  return url.startsWith('data:application/pdf') || /\.pdf($|\?)/i.test(url);
}

export const KYC_MANAGEMENT_ROLES = Object.freeze([
  'super_admin',
  'auction_manager',
  'customer_service_officer',
]);

export const KYC_TAB_KEYS = Object.freeze([
  'all',
  'pending',
  'under_review',
  'approved',
  'rejected',
]);

export const STAT_CARD_KEYS = Object.freeze([
  'all',
  'pending',
  'under_review',
  'approved',
  'rejected',
]);
