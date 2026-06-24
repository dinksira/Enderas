import { AppError } from '../../utils/error.util.js';

/**
 * Validates login request body.
 * Accepts mobile_number or phoneNumber from the frontend contract.
 */
export function validateLoginBody(req, res, next) {
  const mobileNumber = req.body?.mobile_number ?? req.body?.phoneNumber;
  const password = req.body?.password;

  const errors = [];

  if (!mobileNumber || typeof mobileNumber !== 'string' || !mobileNumber.trim()) {
    errors.push('mobile_number is required');
  }

  if (!password || typeof password !== 'string' || !password.length) {
    errors.push('password is required');
  }

  if (errors.length > 0) {
    return next(new AppError(errors.join('; '), 400, 'VALIDATION_ERROR'));
  }

  req.body.mobile_number = mobileNumber.trim();
  req.body.password = password;

  return next();
}

export function validateRegistrationBody(req, res, next) {
  const {
    firstName,
    lastName,
    mobileNumber,
    phoneNumber,
    password,
    userType = 'individual',
    organizationName,
  } = req.body;

  const resolvedMobile = mobileNumber ?? phoneNumber;
  const errors = [];

  if (!resolvedMobile || typeof resolvedMobile !== 'string' || !resolvedMobile.trim()) {
    errors.push('mobileNumber is required');
  }

  if (!password || typeof password !== 'string' || password.length < 6) {
    errors.push('password must be at least 6 characters');
  }

  if (userType === 'individual' && !firstName) {
    errors.push('firstName is required for individual accounts');
  }

  if (userType === 'organization' && !organizationName) {
    errors.push('organizationName is required for organization accounts');
  }

  if (errors.length > 0) {
    return next(new AppError(errors.join('; '), 400, 'VALIDATION_ERROR'));
  }

  req.body.mobileNumber = resolvedMobile.trim();
  req.body.userType = userType;

  return next();
}

export function validateOTPBody(req, res, next) {
  const mobileNumber = req.body?.mobileNumber ?? req.body?.mobile_number ?? req.body?.phoneNumber;
  const { otp } = req.body;

  const errors = [];

  if (!mobileNumber || typeof mobileNumber !== 'string' || !mobileNumber.trim()) {
    errors.push('mobileNumber is required');
  }

  if (!otp || typeof otp !== 'string' || otp.length !== 6) {
    errors.push('valid 6-digit OTP is required');
  }

  if (errors.length > 0) {
    return next(new AppError(errors.join('; '), 400, 'VALIDATION_ERROR'));
  }

  req.body.mobileNumber = mobileNumber.trim();
  req.body.otp = otp;

  return next();
}

export default {
  validateLoginBody,
  validateRegistrationBody,
  validateOTPBody,
};
