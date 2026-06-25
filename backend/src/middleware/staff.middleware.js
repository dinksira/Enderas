import { ForbiddenError } from '../utils/error.util.js';

/**
 * Restricts route to active staff principals with a staff profile.
 */
export function requireStaff(req, res, next) {
  if (req.user?.isStaff && req.user?.staffId) {
    return next();
  }

  return next(new ForbiddenError('Staff access required', 'STAFF_REQUIRED'));
}

export const staffMiddleware = Object.freeze({
  requireStaff,
});

export default staffMiddleware;
