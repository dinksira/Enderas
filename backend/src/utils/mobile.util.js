/**
 * Normalizes Ethiopian mobile numbers for database lookup.
 * Accepts local (09XXXXXXXX) and international (+2519XXXXXXXX) formats.
 * @param {string} value
 */
export function normalizeMobileNumber(value) {
  const trimmed = String(value || '').trim();

  if (/^09\d{8}$/.test(trimmed)) {
    return `+251${trimmed.slice(1)}`;
  }

  if (/^\+2519\d{8}$/.test(trimmed)) {
    return trimmed;
  }

  if (/^2519\d{8}$/.test(trimmed)) {
    return `+${trimmed}`;
  }

  return trimmed;
}

/**
 * Builds all plausible stored-format variants for a submitted mobile number.
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

  return [...candidates].filter(Boolean);
}

export default {
  normalizeMobileNumber,
  getMobileLookupCandidates,
};
