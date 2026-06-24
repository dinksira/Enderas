import { api } from '../../../services/api.js';

const AUTH_ENDPOINTS = Object.freeze({
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  VERIFY_OTP: '/auth/verify-otp',
  RESEND_OTP: '/auth/resend-otp',
});

/**
 * @param {{ phoneNumber: string, password: string }} credentials
 */
export async function login(credentials) {
  return api.post(AUTH_ENDPOINTS.LOGIN, credentials);
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
  const mobileNumber = payload.mobileNumber ?? payload.phoneNumber;

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
  const mobileNumber = payload.mobileNumber ?? payload.phoneNumber;

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
  const mobileNumber = payload.mobileNumber ?? payload.phoneNumber;

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
