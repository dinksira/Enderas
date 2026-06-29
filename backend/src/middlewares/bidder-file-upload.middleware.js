import { isBidderUploadFolderAllowed } from '../constants/bidder-file-upload.constants.js';
import { ForbiddenError } from '../utils/error.util.js';

function resolveRoleCode(req) {
  return req.user?.roleCode ?? req.auth?.role?.code ?? null;
}

function resolveIsStaff(req) {
  return Boolean(req.user?.isStaff ?? req.auth?.isStaff);
}

/**
 * Restricts end-user bidders to approved upload folders after multer parses `folder`.
 */
export function enforceBidderUploadFolderScope(req, res, next) {
  if (resolveIsStaff(req)) {
    return next();
  }

  if (resolveRoleCode(req) !== 'bidder') {
    return next();
  }

  const folder = req.body?.folder;
  if (!isBidderUploadFolderAllowed(folder)) {
    return next(
      new ForbiddenError(
        'Upload not allowed for this folder',
        'UPLOAD_FOLDER_FORBIDDEN',
      ),
    );
  }

  return next();
}

export default enforceBidderUploadFolderScope;
