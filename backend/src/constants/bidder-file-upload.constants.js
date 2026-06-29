/**
 * Folders bidders may upload to via POST /api/v1/files.
 * Staff with full FILES permissions are not restricted by this list.
 */
export const BIDDER_ALLOWED_UPLOAD_FOLDER_PREFIXES = Object.freeze([
  'kyc',
  'payments/receipts',
  'cpo/documents',
  'assets/ownership',
  'assets/documents',
  'assets/images',
  'assets/photos',
]);

/**
 * @param {string} folder
 */
export function isBidderUploadFolderAllowed(folder) {
  const normalized = String(folder || '').trim().replace(/^\/+|\/+$/g, '');

  if (!normalized || normalized.includes('..')) {
    return false;
  }

  return BIDDER_ALLOWED_UPLOAD_FOLDER_PREFIXES.some(
    (prefix) => normalized === prefix || normalized.startsWith(`${prefix}/`),
  );
}

export default {
  BIDDER_ALLOWED_UPLOAD_FOLDER_PREFIXES,
  isBidderUploadFolderAllowed,
};
