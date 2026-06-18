import { api } from '../../../services/api.js';

const AUTH_ENDPOINTS = Object.freeze({
  LOGIN: '/auth/login',
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
 * @param {{ phoneNumber: string, otp: string, sessionId?: string }} payload
 */
export async function verifyOtp(payload) {
  return api.post(AUTH_ENDPOINTS.VERIFY_OTP, payload);
}

/**
 * @param {{ phoneNumber: string, sessionId?: string }} payload
 */
export async function resendOtp(payload) {
  return api.post(AUTH_ENDPOINTS.RESEND_OTP, payload);
}

export const authApi = Object.freeze({
  login,
  verifyOtp,
  resendOtp,
});

export default authApi;
