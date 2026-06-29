import { api } from '../../../services/api.js';
import { formatMobileNumber, isValidEthiopianMobile } from '../../../utils/mobile-utils.js';

const AUTH_ENDPOINTS = Object.freeze({
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  VERIFY_OTP: '/auth/verify-otp',
  RESEND_OTP: '/auth/resend-otp',
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

/**
 * @param {{ phoneNumber: string, password: string }} credentials
 */
export async function login(credentials) {
  const phoneNumber = normalizeAuthMobile(credentials.phoneNumber);

  return api.post(AUTH_ENDPOINTS.LOGIN, {
    phoneNumber,
    mobileNumber: phoneNumber,
    mobile_number: phoneNumber,
    password: credentials.password,
  });
}

/**
 * @param {{
 *   userType?: string,
 *   firstName?: string,
 *   lastName?: string,
 *   organizationName?: string,
 *   mobileNumber?: string,
 *   phoneNumber?: string,
 *   password: string,
 *   email?: string,
 * }} payload
 */
export async function register(payload) {
  const mobileNumber = normalizeAuthMobile(payload.mobileNumber ?? payload.phoneNumber);

  return api.post(AUTH_ENDPOINTS.REGISTER, {
    userType: payload.userType ?? 'individual',
    firstName: payload.firstName,
    lastName: payload.lastName,
    organizationName: payload.organizationName,
    mobileNumber,
    phoneNumber: mobileNumber,
    password: payload.password,
    email: payload.email,
  });
}

/**
 * @param {{ phoneNumber?: string, mobileNumber?: string, otp: string }} payload
 */
export async function verifyOtp(payload) {
  const mobileNumber = normalizeAuthMobile(payload.mobileNumber ?? payload.phoneNumber);

  return api.post(AUTH_ENDPOINTS.VERIFY_OTP, {
    mobileNumber,
    phoneNumber: mobileNumber,
    otp: payload.otp,
  });
}

/**
 * @param {{ phoneNumber?: string, mobileNumber?: string }} payload
 */
export async function resendOtp(payload) {
  const mobileNumber = normalizeAuthMobile(payload.mobileNumber ?? payload.phoneNumber);

  return api.post(AUTH_ENDPOINTS.RESEND_OTP, {
    mobileNumber,
    phoneNumber: mobileNumber,
  });
}

export const authApi = Object.freeze({
  login,
  register,
  verifyOtp,
  resendOtp,
});

export default authApi;
