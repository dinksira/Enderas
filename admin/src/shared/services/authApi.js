import { api } from '../api/api.js';
import { formatMobileNumber, isValidEthiopianMobile } from '../utils/mobile-utils.js';

const AUTH_ENDPOINTS = Object.freeze({
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  VERIFY_OTP: '/auth/verify-otp',
  RESEND_OTP: '/auth/resend-otp',
  FORGOT_PASSWORD: '/auth/forgot-password',
  VERIFY_RESET_OTP: '/auth/verify-reset-otp',
  RESET_PASSWORD: '/auth/reset-password',
});

function normalizeAuthMobile(value) {
  const normalized = formatMobileNumber(value);

  if (!isValidEthiopianMobile(normalized)) {
    const error = new Error('Enter a valid Ethiopian mobile number (e.g. 0912345678 or +251912345678).');
    error.code = 'INVALID_MOBILE_NUMBER';
    throw error;
  }

  return normalized;
}

export async function login(credentials) {
  const phoneNumber = normalizeAuthMobile(credentials.phoneNumber);

  return api.post(AUTH_ENDPOINTS.LOGIN, {
    phoneNumber,
    mobileNumber: phoneNumber,
    mobile_number: phoneNumber,
    password: credentials.password,
  });
}

export async function register(payload) {
  const mobileNumber = normalizeAuthMobile(payload.mobileNumber ?? payload.phoneNumber);

  return api.post(AUTH_ENDPOINTS.REGISTER, {
    userType: payload.userType ?? 'individual',
    firstName: payload.firstName,
    lastName: payload.lastName,
    organizationName: payload.organizationName,
    nationalIdNumber: payload.nationalIdNumber ?? payload.nationalId,
    nationalId: payload.nationalIdNumber ?? payload.nationalId,
    tinNumber: payload.tinNumber,
    mobileNumber,
    phoneNumber: mobileNumber,
    password: payload.password,
    email: payload.email,
  });
}

export async function verifyOtp(payload) {
  const mobileNumber = normalizeAuthMobile(payload.mobileNumber ?? payload.phoneNumber);

  return api.post(AUTH_ENDPOINTS.VERIFY_OTP, {
    mobileNumber,
    phoneNumber: mobileNumber,
    otp: payload.otp,
  });
}

export async function resendOtp(payload) {
  const mobileNumber = normalizeAuthMobile(payload.mobileNumber ?? payload.phoneNumber);

  return api.post(AUTH_ENDPOINTS.RESEND_OTP, {
    mobileNumber,
    phoneNumber: mobileNumber,
  });
}

export async function forgotPassword(payload) {
  const mobileNumber = normalizeAuthMobile(payload.mobileNumber ?? payload.phoneNumber);

  return api.post(AUTH_ENDPOINTS.FORGOT_PASSWORD, {
    mobileNumber,
    phoneNumber: mobileNumber,
  });
}

export async function verifyResetOtp(payload) {
  const mobileNumber = normalizeAuthMobile(payload.mobileNumber ?? payload.phoneNumber);

  return api.post(AUTH_ENDPOINTS.VERIFY_RESET_OTP, {
    mobileNumber,
    phoneNumber: mobileNumber,
    otp: payload.otp,
  });
}

export async function resetPassword(payload) {
  const mobileNumber = normalizeAuthMobile(payload.mobileNumber ?? payload.phoneNumber);

  return api.post(AUTH_ENDPOINTS.RESET_PASSWORD, {
    mobileNumber,
    phoneNumber: mobileNumber,
    otp: payload.otp,
    newPassword: payload.newPassword ?? payload.password,
  });
}

export const authApi = Object.freeze({
  login,
  register,
  verifyOtp,
  resendOtp,
  forgotPassword,
  verifyResetOtp,
  resetPassword,
});

export default authApi;
