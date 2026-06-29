import { AppError } from './error.util.js';

/** Canonical storage format: +2519XXXXXXXX */
export const ETHIOPIAN_MOBILE_STORAGE_PATTERN = /^\+2519\d{8}$/;

function extractDigits(value) {
  return String(value || '').replace(/\D/g, '');
}

/**
 * Normalizes Ethiopian mobile numbers to +2519XXXXXXXX when recognizable.
 * Falls back to trimmed input for legacy/unknown formats (lookup helpers only).
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
 * Normalizes and validates a mobile number for persistence.
 * @param {string} value
 * @param {string} [fieldLabel]
 */
export function resolveMobileForStorage(value, fieldLabel = 'Mobile number') {
  const normalized = normalizeMobileNumber(value);

  if (!ETHIOPIAN_MOBILE_STORAGE_PATTERN.test(normalized)) {
    throw new AppError(
      `${fieldLabel} must be a valid Ethiopian mobile number (e.g. 0912345678 or +251912345678)`,
      400,
      'INVALID_MOBILE_NUMBER',
    );
  }

  return normalized;
}

/**
 * Builds all plausible stored-format variants for a submitted mobile number.
 * Keeps legacy 09... values searchable while new records use +251...
 * @param {string} value
 * @returns {string[]}
 */
export function getMobileLookupCandidates(value) {
  const trimmed = String(value || '').trim();
  const international = normalizeMobileNumber(trimmed);
  const candidates = new Set([trimmed, international]);

  if (international.startsWith('+251')) {
    candidates.add(`0${international.slice(4)}`);
    candidates.add(international.slice(1));
  }

  if (trimmed.startsWith('0') && trimmed.length === 10) {
    candidates.add(trimmed);
  }

  return [...candidates].filter(Boolean);
}

export default {
  ETHIOPIAN_MOBILE_STORAGE_PATTERN,
  normalizeMobileNumber,
  isValidEthiopianMobile,
  resolveMobileForStorage,
  getMobileLookupCandidates,
};
