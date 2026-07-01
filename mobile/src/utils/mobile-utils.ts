/** Canonical storage format: +2519XXXXXXXX */
export const ETHIOPIAN_MOBILE_STORAGE_PATTERN = /^\+2519\d{8}$/;

function extractDigits(value: string): string {
  return String(value || '').replace(/\D/g, '');
}

/**
 * Normalizes Ethiopian mobile numbers to +2519XXXXXXXX when recognizable.
 */
export function normalizeMobileNumber(value: string): string {
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

export function isValidEthiopianMobile(value: string): boolean {
  return ETHIOPIAN_MOBILE_STORAGE_PATTERN.test(normalizeMobileNumber(value));
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
