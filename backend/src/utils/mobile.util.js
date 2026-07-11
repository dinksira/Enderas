import { AppError } from './error.util.js';

/** Canonical storage format: +251 followed by 8-9 national digits (mobile or landline). */
export const ETHIOPIAN_MOBILE_STORAGE_PATTERN = /^\+251\d{8,9}$/;

function extractDigits(value) {
  return String(value || '').replace(/\D/g, '');
}

/**
 * Normalizes Ethiopian phone numbers (mobile or landline) to +251XXXXXXXX.
 * Accepts +251..., 251..., 09/07..., 9/7..., 011... (landline) and similar.
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

  // Already includes the country code without the leading + (e.g. 251912345678).
  if (/^251\d{8,9}$/.test(digits)) {
    return `+${digits}`;
  }

  // Drop a single leading national trunk prefix (0) when present.
  const national = digits.startsWith('0') ? digits.slice(1) : digits;

  if (/^[79]\d{8}$/.test(national)) {
    return `+251${national}`;
  }

  if (/^[1-6]\d{7,8}$/.test(national)) {
    return `+251${national}`;
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
 * Normalizes and validates a phone number for persistence.
 * @param {string} value
 * @param {string} [fieldLabel]
 */
export function resolveMobileForStorage(value, fieldLabel = 'Mobile number') {
  const normalized = normalizeMobileNumber(value);

  if (!ETHIOPIAN_MOBILE_STORAGE_PATTERN.test(normalized)) {
    throw new AppError(
      `${fieldLabel} must be a valid Ethiopian phone number (e.g. 0912345678 or 0111234567)`,
      400,
      'INVALID_MOBILE_NUMBER',
    );
  }

  return normalized;
}

/**
 * Builds all plausible stored-format variants for a submitted phone number.
 * Keeps legacy 0... values searchable while new records use +251...
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

  if (trimmed.startsWith('0') && (trimmed.length === 10 || trimmed.length === 11)) {
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
