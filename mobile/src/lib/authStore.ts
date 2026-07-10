import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import * as SecureStore from 'expo-secure-store';

export const AUTH_STATUS = Object.freeze({
  IDLE: 'idle',
  HYDRATING: 'hydrating',
  AUTHENTICATED: 'authenticated',
  UNAUTHENTICATED: 'unauthenticated',
} as const);

export type AuthStatus = (typeof AUTH_STATUS)[keyof typeof AUTH_STATUS];

export interface AuthUser {
  id?: string;
  roleId?: string;
  roleCode?: string | null;
  userType?: string;
  staffId?: string | null;
  displayName?: string;
  firstName?: string | null;
  lastName?: string | null;
  organizationName?: string | null;
  mobileNumber?: string;
  email?: string;
  isStaff?: boolean;
  employeeId?: string | null;
  department?: string | null;
  status?: string;
  preferredLanguage?: string | null;
  profilePicture?: string | null;
}

interface SessionPayload {
  accessToken: string;
  identity?: Record<string, unknown>;
  authz?: Record<string, unknown>;
  user?: Record<string, unknown>;
  permissions?: Record<string, unknown>;
}

export type PasswordResetReturnTo = 'login' | 'settings';

interface AuthState {
  status: AuthStatus;
  accessToken: string | null;
  user: AuthUser | null;
  pendingOtpMobile: string | null;
  pendingPasswordResetMobile: string | null;
  verifiedPasswordResetOtp: string | null;
  passwordResetReturnTo: PasswordResetReturnTo | null;
  pendingRegistration: { userType?: string; tinNumber?: string | null } | null;
  hasHydrated: boolean;

  setHasHydrated: (value: boolean) => void;
  setSession: (payload: SessionPayload) => void;
  clearSession: () => void;
  setPendingOtpVerification: (
    mobileNumber: string,
    metadata?: { userType?: string; tinNumber?: string | null },
  ) => void;
  clearPendingOtpVerification: () => void;
  setPendingPasswordReset: (mobileNumber: string, returnTo?: PasswordResetReturnTo) => void;
  setVerifiedPasswordResetOtp: (otp: string) => void;
  clearPasswordResetFlow: () => void;
  updateUserFields: (fields: Partial<AuthUser>) => void;
  updateUserStatus: (status: string) => void;
  isAuthenticated: () => boolean;
}

function mapUser(payload: SessionPayload): AuthUser {
  const identity = (payload.identity || payload.user || {}) as Record<string, unknown>;
  const authz = (payload.authz || payload.permissions || {}) as Record<string, unknown>;
  const userPayload = (payload.user || {}) as Record<string, unknown>;

  return {
    id: String(userPayload.id || identity.userId || identity.id || ''),
    roleId: String(userPayload.roleId || authz.roleId || ''),
    roleCode: (userPayload.roleCode || authz.roleCode || authz.code || null) as string | null,
    userType: String(userPayload.userType || identity.userType || ''),
    staffId: (userPayload.staffId ?? identity.staffId ?? null) as string | null,
    displayName: String(userPayload.displayName || identity.displayName || ''),
    firstName: (userPayload.firstName ?? identity.firstName ?? null) as string | null,
    lastName: (userPayload.lastName ?? identity.lastName ?? null) as string | null,
    organizationName: (userPayload.organizationName ?? identity.organizationName ?? null) as string | null,
    mobileNumber: String(userPayload.mobileNumber || identity.mobileNumber || ''),
    email: String(userPayload.email || identity.email || ''),
    isStaff: Boolean(userPayload.isStaff ?? identity.isStaff),
    employeeId: (userPayload.employeeId ?? identity.employeeId ?? null) as string | null,
    department: (userPayload.department ?? identity.department ?? null) as string | null,
    status: String(userPayload.status || identity.status || ''),
    preferredLanguage: (userPayload.preferredLanguage ||
      identity.preferredLanguage ||
      null) as string | null,
    profilePicture: (userPayload.profilePicture ?? identity.profilePicture ?? null) as string | null,
  };
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      status: AUTH_STATUS.IDLE,
      accessToken: null,
      user: null,
      pendingOtpMobile: null,
      pendingPasswordResetMobile: null,
      verifiedPasswordResetOtp: null,
      passwordResetReturnTo: null,
      pendingRegistration: null,
      hasHydrated: false,

      setHasHydrated: (value) => set({ hasHydrated: value }),

      setSession: (payload) => {
        const user = mapUser(payload);
        set({
          status: AUTH_STATUS.AUTHENTICATED,
          accessToken: payload.accessToken,
          user,
          pendingOtpMobile: null,
          pendingPasswordResetMobile: null,
          verifiedPasswordResetOtp: null,
          passwordResetReturnTo: null,
          pendingRegistration: null,
        });
      },

      clearSession: () => {
        set({
          status: AUTH_STATUS.UNAUTHENTICATED,
          accessToken: null,
          user: null,
          pendingOtpMobile: null,
          pendingPasswordResetMobile: null,
          verifiedPasswordResetOtp: null,
          passwordResetReturnTo: null,
          pendingRegistration: null,
        });
      },

      setPendingOtpVerification: (mobileNumber, metadata = {}) => {
        set({
          status: AUTH_STATUS.UNAUTHENTICATED,
          accessToken: null,
          user: null,
          pendingOtpMobile: mobileNumber,
          pendingRegistration: metadata,
        });
      },

      clearPendingOtpVerification: () => {
        set({
          pendingOtpMobile: null,
          pendingRegistration: null,
        });
      },

      setPendingPasswordReset: (mobileNumber, returnTo = 'login') => {
        set({
          pendingPasswordResetMobile: mobileNumber,
          verifiedPasswordResetOtp: null,
          passwordResetReturnTo: returnTo,
        });
      },

      setVerifiedPasswordResetOtp: (otp) => {
        set({ verifiedPasswordResetOtp: otp });
      },

      clearPasswordResetFlow: () => {
        set({
          pendingPasswordResetMobile: null,
          verifiedPasswordResetOtp: null,
          passwordResetReturnTo: null,
        });
      },

      updateUserFields: (fields) => {
        const { user } = get();
        if (!user) return;
        set({ user: { ...user, ...fields } });
      },

      updateUserStatus: (status) => {
        const { user } = get();
        if (!user) return;
        set({ user: { ...user, status } });
      },

      isAuthenticated: () => {
        const { accessToken, user, status } = get();
        return Boolean(accessToken && user && status === AUTH_STATUS.AUTHENTICATED);
      },
    }),
    {
      name: 'enderas-auth-store',
      storage: createJSONStorage(() => ({
        getItem: (name: string) => SecureStore.getItemAsync(name),
        setItem: (name: string, value: string) => SecureStore.setItemAsync(name, value),
        removeItem: (name: string) => SecureStore.deleteItemAsync(name),
      })),
      partialize: (state) => ({
        status: state.status,
        accessToken: state.accessToken,
        user: state.user,
        pendingOtpMobile: state.pendingOtpMobile,
        pendingPasswordResetMobile: state.pendingPasswordResetMobile,
        pendingRegistration: state.pendingRegistration,
      }),
      onRehydrateStorage: () => (state) => {
        if (state?.accessToken && state.user) {
          useAuthStore.setState({
            status: AUTH_STATUS.AUTHENTICATED,
            hasHydrated: true,
          });
          return;
        }

        useAuthStore.setState({
          status: AUTH_STATUS.UNAUTHENTICATED,
          accessToken: null,
          user: null,
          hasHydrated: true,
        });
      },
    },
  ),
);

export function useIsAuthenticated(): boolean {
  const accessToken = useAuthStore((s) => s.accessToken);
  const user = useAuthStore((s) => s.user);
  const status = useAuthStore((s) => s.status);
  return Boolean(accessToken && user && status === AUTH_STATUS.AUTHENTICATED);
}

export default useAuthStore;
