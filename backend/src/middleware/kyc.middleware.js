import { ForbiddenError } from '../utils/error.util.js';
import { USER_STATUSES } from '../services/kyc.service.js';

/**
 * Blocks non-active external users from auction-participation features.
 */
export function requireKYCVerified(req, res, next) {
  if (req.user?.isStaff || req.auth?.isStaff) {
    return next();
  }

  const userStatus = req.user?.status
    ?? req.auth?.identity?.status
    ?? null;

  if (userStatus === USER_STATUSES.ACTIVE) {
    return next();
  }

  let message = 'KYC verification required to access this feature';
  let code = 'KYC_VERIFICATION_REQUIRED';

  if (userStatus === USER_STATUSES.KYC_PENDING || userStatus === USER_STATUSES.PENDING) {
    message = 'Please complete your KYC verification to access this feature';
    code = 'KYC_PENDING';
  } else if (userStatus === USER_STATUSES.KYC_UNDER_REVIEW) {
    message = 'Your KYC is under review. Please wait for approval.';
    code = 'KYC_UNDER_REVIEW';
  } else if (userStatus === USER_STATUSES.KYC_REJECTED) {
    message = 'Your KYC was rejected. Please resubmit your documents.';
    code = 'KYC_REJECTED';
  }

  return next(new ForbiddenError(message, code));
}

export const kycMiddleware = Object.freeze({
  requireKYCVerified,
});

export default kycMiddleware;
