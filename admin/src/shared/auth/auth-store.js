import { create } from 'zustand';
import { canAccess } from '../utils/permissions.js';

export const AUTH_STATUS = Object.freeze({
  IDLE: 'idle',
  HYDRATING: 'hydrating',
  AUTHENTICATED: 'authenticated',
  UNAUTHENTICATED: 'unauthenticated',
});

const EMPTY_PERMISSIONS = Object.freeze({
  roleCode: null,
  wildcard: false,
  modules: [],
  actions: [],
  routes: [],
  moduleActions: {},
});

/**
 * Global authentication + RBAC state.
 * Access tokens remain in memory only — never localStorage.
 */
export const useAuthStore = create((set, get) => ({
  status: AUTH_STATUS.IDLE,
  accessToken: null,
  user: null,
  permissions: { ...EMPTY_PERMISSIONS },
  kycStatus: null,
  kycData: null,
  pendingOtpMobile: null,
  pendingRegistration: null,

  /**
   * UI authorization helper used by dashboards and action buttons.
   * @param {string} moduleName
   * @param {string} [actionName]
   */
  can(moduleName, actionName) {
    const { permissions } = get();
    return canAccess(permissions, moduleName, actionName);
  },

  /**
   * Hydrates session from a login/refresh API response.
   * @param {{ accessToken: string, identity?: object, authz?: object, user?: object, permissions?: object }} payload
   */
  setSession(payload) {
    const identity = payload.identity || payload.user || {};
    const authz = payload.authz || payload.permissions || {};
    const userPayload = payload.user || {};

    set({
      status: AUTH_STATUS.AUTHENTICATED,
      accessToken: payload.accessToken,
      user: {
        id: userPayload.id || identity.userId || identity.id,
        roleId: userPayload.roleId || authz.roleId,
        roleCode: userPayload.roleCode || authz.roleCode,
        userType: userPayload.userType || identity.userType,
        staffId: userPayload.staffId ?? identity.staffId ?? null,
        displayName: userPayload.displayName || identity.displayName,
        mobileNumber: userPayload.mobileNumber || identity.mobileNumber,
        email: userPayload.email || identity.email,
        isStaff: Boolean(userPayload.isStaff ?? identity.isStaff),
        employeeId: userPayload.employeeId ?? identity.employeeId ?? null,
        department: userPayload.department ?? identity.department ?? null,
        status: userPayload.status || identity.status,
        preferredLanguage: userPayload.preferredLanguage || identity.preferredLanguage || null,
      },
      permissions: {
        roleCode: authz.roleCode ?? userPayload.roleCode ?? authz.code ?? null,
        wildcard: Boolean(authz.wildcard ?? userPayload.permissions?.wildcard),
        modules: Array.isArray(authz.modules)
          ? authz.modules
          : (userPayload.permissions?.modules ?? []),
        actions: Array.isArray(authz.actions)
          ? authz.actions
          : (userPayload.permissions?.actions ?? []),
        routes: Array.isArray(authz.routes)
          ? authz.routes
          : (userPayload.permissions?.routes ?? []),
        moduleActions: authz.moduleActions && typeof authz.moduleActions === 'object'
          ? authz.moduleActions
          : (userPayload.permissions?.moduleActions ?? {}),
      },
    });
  },

  clearSession() {
    set({
      status: AUTH_STATUS.UNAUTHENTICATED,
      accessToken: null,
      user: null,
      permissions: { ...EMPTY_PERMISSIONS },
      kycStatus: null,
      kycData: null,
      pendingOtpMobile: null,
      pendingRegistration: null,
    });
  },

  /**
   * Stores mobile number while user completes OTP verification after signup.
   * @param {string} mobileNumber
   * @param {{ userType?: string, tinNumber?: string|null, otpExpiresIn?: number, otpExpiresAt?: string|null }} [metadata]
   */
  setPendingOtpVerification(mobileNumber, metadata = {}) {
    set({
      status: AUTH_STATUS.UNAUTHENTICATED,
      pendingOtpMobile: mobileNumber,
      pendingRegistration: metadata,
    });
  },

  clearPendingOtpVerification() {
    set({
      pendingOtpMobile: null,
      pendingRegistration: null,
    });
  },

  isOtpPending() {
    return Boolean(get().pendingOtpMobile);
  },

  setKYCStatus(status, kycData = null) {
    set({ kycStatus: status, kycData });
  },

  requiresKYC() {
    const { user } = get();
    if (!user) return false;
    if (user.isStaff) return false;

    const kycRequiredStatuses = ['pending', 'kyc_pending', 'kyc_under_review', 'kyc_rejected'];
    return kycRequiredStatuses.includes(user.status);
  },

  canParticipateInAuctions() {
    const { user } = get();
    if (!user) return false;
    if (user.isStaff) return true;
    return user.status === 'active';
  },

  setStatus(status) {
    set({ status });
  },
}));

export default useAuthStore;
