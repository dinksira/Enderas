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
