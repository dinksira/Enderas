/** Canonical storage format: +2519XXXXXXXX */
export const ETHIOPIAN_MOBILE_STORAGE_PATTERN = /^\+2519\d{8}$/;

function extractDigits(value) {
  return String(value || '').replace(/\D/g, '');
}

/**
 * Normalizes Ethiopian mobile numbers to +2519XXXXXXXX when recognizable.
 * @param {string} value
 */
export function normalizeMobileNumber(value) {
  const trimmed = String(value || '').trim();
  if (!trimmed) return '';

  if (ETHIOPIAN_MOBILE_STORAGE_PATTERN.test(trimmed)) {
    return trimmed;
  }

  const digits = extractDigits(trimmed);
  if (!digits) return trimmed;

  if (/^2519\d{8}$/.test(digits)) {
    return `+${digits}`;
  }

  if (/^09\d{8}$/.test(digits)) {
    return `+251${digits.slice(1)}`;
  }

  if (/^9\d{8}$/.test(digits)) {
    return `+251${digits}`;
  }

  if (digits.length === 10 && digits.startsWith('0')) {
    const local = digits.slice(1);
    if (/^9\d{8}$/.test(local)) {
      return `+251${local}`;
    }
  }

  return trimmed;
}

/**
 * @param {string} value
 */
export function isValidEthiopianMobile(value) {
  return ETHIOPIAN_MOBILE_STORAGE_PATTERN.test(normalizeMobileNumber(value));
}

/**
 * @param {string} value
 */
export function formatMobileNumber(value) {
  return normalizeMobileNumber(value);
}

export default {
  ETHIOPIAN_MOBILE_STORAGE_PATTERN,
  normalizeMobileNumber,
  isValidEthiopianMobile,
  formatMobileNumber,
};
