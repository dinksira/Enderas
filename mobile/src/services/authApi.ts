import { ENV } from '@/lib/env';
import { api } from '@/services/api';
import { formatMobileNumber, isValidEthiopianMobile } from '@/utils/mobile-utils';

const AUTH_ENDPOINTS = Object.freeze({
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  VERIFY_OTP: '/auth/verify-otp',
  RESEND_OTP: '/auth/resend-otp',
  FORGOT_PASSWORD: '/auth/forgot-password',
  VERIFY_RESET_OTP: '/auth/verify-reset-otp',
  RESET_PASSWORD: '/auth/reset-password',
  ME: `${ENV.apiV1Prefix}/auth/me`,
});

function normalizeAuthMobile(value: string): string {
  const normalized = formatMobileNumber(value);

  if (!isValidEthiopianMobile(normalized)) {
    const error = new Error(
      'Enter a valid Ethiopian mobile number (e.g. 0912345678 or +251912345678).',
    ) as Error & { code?: string };
    error.code = 'INVALID_MOBILE_NUMBER';
    throw error;
  }

  return normalized;
}

export interface AuthMeIdentity {
  displayName: string;
  mobileNumber: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  organizationName?: string | null;
  preferredLanguage?: string | null;
  isStaff: boolean;
}

export interface AuthMeResponse {
  id: string;
  roleId: string;
  roleCode: string;
  userType: string;
  staffId: string | null;
  status: string;
  identity: AuthMeIdentity;
}

export interface UpdateProfilePayload {
  email?: string;
  firstName?: string;
  lastName?: string;
  organizationName?: string;
  preferredLanguage?: 'en' | 'am';
}

export interface PasswordResetRequestResponse {
  success?: boolean;
  otpExpiresIn?: number;
  otpExpiresAt?: string;
  devOtp?: string;
}

export async function login(credentials: { phoneNumber: string; password: string }) {
  const phoneNumber = normalizeAuthMobile(credentials.phoneNumber);

  return api.post(AUTH_ENDPOINTS.LOGIN, {
    phoneNumber,
    mobileNumber: phoneNumber,
    mobile_number: phoneNumber,
    password: credentials.password,
  });
}

export async function register(payload: {
  userType?: string;
  firstName?: string;
  lastName?: string;
  organizationName?: string;
  mobileNumber?: string;
  phoneNumber?: string;
  password: string;
  email?: string;
  tinNumber?: string;
  nationalIdNumber?: string;
}) {
  const mobileNumber = normalizeAuthMobile(payload.mobileNumber ?? payload.phoneNumber ?? '');

  return api.post(AUTH_ENDPOINTS.REGISTER, {
    userType: payload.userType ?? 'individual',
    firstName: payload.firstName,
    lastName: payload.lastName,
    organizationName: payload.organizationName,
    mobileNumber,
    phoneNumber: mobileNumber,
    password: payload.password,
    email: payload.email,
    tinNumber: payload.tinNumber,
    nationalIdNumber: payload.nationalIdNumber,
  });
}

export async function verifyOtp(payload: {
  phoneNumber?: string;
  mobileNumber?: string;
  otp: string;
}) {
  const mobileNumber = normalizeAuthMobile(payload.mobileNumber ?? payload.phoneNumber ?? '');

  return api.post(AUTH_ENDPOINTS.VERIFY_OTP, {
    mobileNumber,
    phoneNumber: mobileNumber,
    otp: payload.otp,
  });
}

export async function resendOtp(payload: { phoneNumber?: string; mobileNumber?: string }) {
  const mobileNumber = normalizeAuthMobile(payload.mobileNumber ?? payload.phoneNumber ?? '');

  return api.post(AUTH_ENDPOINTS.RESEND_OTP, {
    mobileNumber,
    phoneNumber: mobileNumber,
  });
}

export async function forgotPassword(payload: {
  phoneNumber?: string;
  mobileNumber?: string;
}): Promise<PasswordResetRequestResponse> {
  const mobileNumber = normalizeAuthMobile(payload.mobileNumber ?? payload.phoneNumber ?? '');

  return api.post(AUTH_ENDPOINTS.FORGOT_PASSWORD, {
    mobileNumber,
    phoneNumber: mobileNumber,
  });
}

export async function verifyResetOtp(payload: {
  phoneNumber?: string;
  mobileNumber?: string;
  otp: string;
}): Promise<{ valid: boolean }> {
  const mobileNumber = normalizeAuthMobile(payload.mobileNumber ?? payload.phoneNumber ?? '');

  return api.post(AUTH_ENDPOINTS.VERIFY_RESET_OTP, {
    mobileNumber,
    phoneNumber: mobileNumber,
    otp: payload.otp,
  });
}

export async function resetPassword(payload: {
  phoneNumber?: string;
  mobileNumber?: string;
  otp: string;
  newPassword: string;
}) {
  const mobileNumber = normalizeAuthMobile(payload.mobileNumber ?? payload.phoneNumber ?? '');

  return api.post(AUTH_ENDPOINTS.RESET_PASSWORD, {
    mobileNumber,
    phoneNumber: mobileNumber,
    otp: payload.otp,
    newPassword: payload.newPassword,
  });
}

export async function getMe(): Promise<AuthMeResponse> {
  return api.get<AuthMeResponse>(AUTH_ENDPOINTS.ME);
}

export async function updateMyProfile(payload: UpdateProfilePayload): Promise<AuthMeResponse> {
  return api.patch<AuthMeResponse>(AUTH_ENDPOINTS.ME, payload);
}

export const authApi = Object.freeze({
  login,
  register,
  verifyOtp,
  resendOtp,
  forgotPassword,
  verifyResetOtp,
  resetPassword,
  getMe,
  updateMyProfile,
});

export default authApi;
