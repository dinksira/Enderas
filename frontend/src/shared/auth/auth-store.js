import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
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

const SESSION_STORAGE_KEY = 'enderas_auth_session';

function sessionStorage() {
  return createJSONStorage(() => localStorage);
}

/**
 * Global authentication + RBAC state with localStorage persistence.
 */
export const useAuthStore = create(
  persist(
    (set, get) => ({
      status: AUTH_STATUS.IDLE,
      accessToken: null,
      refreshToken: null,
      refreshTokenExpiresAt: null,
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
       * @param {{ accessToken: string, refreshToken?: string, refreshTokenExpiresAt?: string, identity?: object, authz?: object, user?: object, permissions?: object }} payload
       */
      setSession(payload) {
        const identity = payload.identity || payload.user || {};
        const authz = payload.authz || payload.permissions || {};
        const userPayload = payload.user || {};

        set({
          status: AUTH_STATUS.AUTHENTICATED,
          accessToken: payload.accessToken,
          refreshToken: payload.refreshToken !== undefined ? payload.refreshToken : get().refreshToken,
          refreshTokenExpiresAt: payload.refreshTokenExpiresAt !== undefined ? payload.refreshTokenExpiresAt : get().refreshTokenExpiresAt,
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
            avatarUrl: userPayload.avatarUrl || identity.avatarUrl || null,
            profilePicture: userPayload.profilePicture || identity.profilePicture || null,
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
          refreshToken: null,
          refreshTokenExpiresAt: null,
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
}),
{
  name: SESSION_STORAGE_KEY,
  storage: sessionStorage(),
  partialize: (state) => ({
    accessToken: state.accessToken,
    refreshToken: state.refreshToken,
    refreshTokenExpiresAt: state.refreshTokenExpiresAt,
    user: state.user,
    permissions: state.permissions,
    kycStatus: state.kycStatus,
    kycData: state.kycData,
    pendingOtpMobile: state.pendingOtpMobile,
    pendingRegistration: state.pendingRegistration,
  }),
  onRehydrateStorage: () => (state) => {
    if (state?.accessToken && state?.user) {
      useAuthStore.setState({ status: AUTH_STATUS.AUTHENTICATED });
    } else {
      useAuthStore.setState({
        status: AUTH_STATUS.UNAUTHENTICATED,
        accessToken: null,
        refreshToken: null,
        refreshTokenExpiresAt: null,
        user: null,
      });
    }
  },
},
));

export default useAuthStore;
