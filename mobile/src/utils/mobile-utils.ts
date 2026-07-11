/** Canonical storage format: +251 followed by 8-9 national digits (mobile or landline). */
export const ETHIOPIAN_MOBILE_STORAGE_PATTERN = /^\+251\d{8,9}$/;

function extractDigits(value: string): string {
  return String(value || '').replace(/\D/g, '');
}

/**
 * Normalizes Ethiopian phone numbers (mobile or landline) to +251XXXXXXXX.
 * Accepts +251..., 251..., 09/07..., 9/7..., 011... (landline) and similar.
 */
export function normalizeMobileNumber(value: string): string {
  const trimmed = String(value || '').trim();
  if (!trimmed) return '';

  if (ETHIOPIAN_MOBILE_STORAGE_PATTERN.test(trimmed)) {
    return trimmed;
  }

  const digits = extractDigits(trimmed);
  if (!digits) return trimmed;

  // Already includes country code without the leading + (e.g. 251912345678).
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

export function isValidEthiopianMobile(value: string): boolean {
  return ETHIOPIAN_MOBILE_STORAGE_PATTERN.test(normalizeMobileNumber(value));
}

/**
 * Validates a locally typed national number (without +251) for the auth forms.
 * Accepts mobile (09/9/07/7 + 8 digits) and landline (0 + area code + subscriber).
 */
export function isValidLocalPhone(value: string): boolean {
  const digits = extractDigits(value);

  if (/^0?[79]\d{8}$/.test(digits)) return true;
  if (/^0[1-6]\d{7,8}$/.test(digits)) return true;

  return false;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(value: string): boolean {
  return EMAIL_PATTERN.test(String(value || '').trim());
}

export function formatMobileNumber(value: string): string {
  return normalizeMobileNumber(value);
}

/**
 * Display-friendly mask for OTP screens (e.g. +251 91•• ••• 78).
 */
export function maskMobileNumber(value: string): string {
  const normalized = normalizeMobileNumber(value);
  if (!ETHIOPIAN_MOBILE_STORAGE_PATTERN.test(normalized)) {
    return value;
  }

  return `${normalized.slice(0, 7)}•••${normalized.slice(-2)}`;
}
