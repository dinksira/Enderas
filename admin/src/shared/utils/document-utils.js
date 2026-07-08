/**
 * @param {string} url
 */
export function isPdfUrl(url) {
  if (!url || typeof url !== 'string') return false;
  return url.startsWith('data:application/pdf') || /\.pdf($|\?|#)/i.test(url);
}

/**
 * @param {string} url
 */
export function isImageUrl(url) {
  if (!url || typeof url !== 'string') return false;
  if (url.startsWith('data:image/')) return true;
  return /\.(jpe?g|png|webp|gif|bmp|svg)($|\?|#)/i.test(url);
}

/**
 * @param {string} url
 */
export function getDocumentKind(url) {
  if (isImageUrl(url)) return 'image';
  if (isPdfUrl(url)) return 'pdf';
  return 'file';
}
