import { AppError } from '../../utils/error.util.js';
import { isValidEthiopianMobile, normalizeMobileNumber } from '../../utils/mobile.util.js';

function assignNormalizedMobile(req, sourceValue, targetKeys) {
  const normalized = normalizeMobileNumber(sourceValue);

  if (!isValidEthiopianMobile(normalized)) {
    throw new AppError(
      'Enter a valid Ethiopian mobile number (e.g. 0912345678 or +251912345678)',
      400,
      'INVALID_MOBILE_NUMBER',
    );
  }

  targetKeys.forEach((key) => {
    req.body[key] = normalized;
  });

  return normalized;
}

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

  try {
    assignNormalizedMobile(req, mobileNumber, ['mobile_number', 'phoneNumber', 'mobileNumber']);
  } catch (error) {
    return next(error);
  }

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
    nationalIdNumber,
    nationalId,
    tinNumber,
  } = req.body;

  const resolvedMobile = mobileNumber ?? phoneNumber;
  const resolvedNationalId = (nationalIdNumber ?? nationalId ?? '').trim();
  const resolvedTin = (tinNumber ?? '').trim();
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

  if (userType === 'individual' && !resolvedNationalId) {
    errors.push('nationalIdNumber is required for individual accounts');
  }

  if (userType === 'organization' && !organizationName) {
    errors.push('organizationName is required for organization accounts');
  }

  if (userType === 'organization' && !resolvedTin) {
    errors.push('tinNumber is required for organization accounts');
  }

  if (errors.length > 0) {
    return next(new AppError(errors.join('; '), 400, 'VALIDATION_ERROR'));
  }

  try {
    assignNormalizedMobile(req, resolvedMobile, ['mobileNumber', 'phoneNumber', 'mobile_number']);
  } catch (error) {
    return next(error);
  }

  req.body.userType = userType;
  req.body.nationalIdNumber = resolvedNationalId || null;
  req.body.tinNumber = resolvedTin || null;

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

  try {
    assignNormalizedMobile(req, mobileNumber, ['mobileNumber', 'phoneNumber', 'mobile_number']);
  } catch (error) {
    return next(error);
  }

  req.body.otp = otp;

  return next();
}

export function validateResendOTPBody(req, res, next) {
  const mobileNumber = req.body?.mobileNumber ?? req.body?.mobile_number ?? req.body?.phoneNumber;

  if (!mobileNumber || typeof mobileNumber !== 'string' || !mobileNumber.trim()) {
    return next(new AppError('mobileNumber is required', 400, 'VALIDATION_ERROR'));
  }

  try {
    assignNormalizedMobile(req, mobileNumber, ['mobileNumber', 'phoneNumber', 'mobile_number']);
  } catch (error) {
    return next(error);
  }

  return next();
}

export function validateForgotPasswordBody(req, res, next) {
  return validateResendOTPBody(req, res, next);
}

export function validateVerifyResetOtpBody(req, res, next) {
  return validateOTPBody(req, res, next);
}

export function validateResetPasswordBody(req, res, next) {
  const mobileNumber = req.body?.mobileNumber ?? req.body?.mobile_number ?? req.body?.phoneNumber;
  const { otp, newPassword, password } = req.body;
  const resolvedPassword = newPassword ?? password;

  const errors = [];

  if (!mobileNumber || typeof mobileNumber !== 'string' || !mobileNumber.trim()) {
    errors.push('mobileNumber is required');
  }

  if (!otp || typeof otp !== 'string' || otp.length !== 6) {
    errors.push('valid 6-digit OTP is required');
  }

  if (!resolvedPassword || typeof resolvedPassword !== 'string' || resolvedPassword.length < 6) {
    errors.push('password must be at least 6 characters');
  }

  if (errors.length > 0) {
    return next(new AppError(errors.join('; '), 400, 'VALIDATION_ERROR'));
  }

  try {
    assignNormalizedMobile(req, mobileNumber, ['mobileNumber', 'phoneNumber', 'mobile_number']);
  } catch (error) {
    return next(error);
  }

  req.body.otp = otp;
  req.body.newPassword = resolvedPassword;

  return next();
}

export function validateUpdateProfileBody(req, res, next) {
  const {
    email,
    firstName,
    lastName,
    organizationName,
    preferredLanguage,
    profilePicture,
  } = req.body ?? {};

  const errors = [];

  if (email !== undefined && email !== null && email !== '') {
    if (typeof email !== 'string' || !email.includes('@')) {
      errors.push('email must be a valid email address');
    }
  }

  if (firstName !== undefined && firstName !== null && firstName !== '') {
    if (typeof firstName !== 'string' || !firstName.trim()) {
      errors.push('firstName must be a non-empty string');
    }
  }

  if (lastName !== undefined && lastName !== null && lastName !== '') {
    if (typeof lastName !== 'string') {
      errors.push('lastName must be a string');
    }
  }

  if (organizationName !== undefined && organizationName !== null && organizationName !== '') {
    if (typeof organizationName !== 'string' || !organizationName.trim()) {
      errors.push('organizationName must be a non-empty string');
    }
  }

  if (preferredLanguage !== undefined && preferredLanguage !== null && preferredLanguage !== '') {
    if (!['en', 'am'].includes(preferredLanguage)) {
      errors.push('preferredLanguage must be en or am');
    }
  }

  if (profilePicture !== undefined && profilePicture !== null && profilePicture !== '') {
    if (typeof profilePicture !== 'string') {
      errors.push('profilePicture must be a string URL');
    }
  }

  if (errors.length > 0) {
    return next(new AppError(errors.join('; '), 400, 'VALIDATION_ERROR'));
  }

  return next();
}

export default {
  validateLoginBody,
  validateRegistrationBody,
  validateOTPBody,
  validateResendOTPBody,
  validateForgotPasswordBody,
  validateVerifyResetOtpBody,
  validateResetPasswordBody,
  validateUpdateProfileBody,
};
