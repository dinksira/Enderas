import { Routes, Route, Navigate } from 'react-router-dom';
import { ROUTES } from '../config/routes.js';
import { MODULES, ACTIONS } from '../config/navigation.config.js';
import { AuthLayout } from '../layouts/AuthLayout.jsx';
import { ProtectedRoute, RoleLayout, PermissionGate } from '../core/auth/index.js';
import { LoginView } from '../modules/users/views/LoginView.jsx';
import { RegisterView } from '../modules/auth/views/RegisterView.jsx';
import { OTPVerificationView } from '../modules/auth/views/OTPVerificationView.jsx';
import { KYCVerificationView, KYCManagementView, KYCUnderReviewView, KYCRejectedView } from '../modules/kyc/index.js';
import { ModulePageView } from '../modules/dashboard/views/ModulePageView.jsx';
import { UserManagementView } from '../modules/users/views/UserManagementView.jsx';
import { UserProfileView } from '../modules/users/views/user-profile-view.jsx';
import { StaffManagementView } from '../modules/staff/views/StaffManagementView.jsx';
import { SettingsView } from '../modules/setting/views/SettingsView.jsx';
import { AuditTrailView } from '../modules/audit/views/AuditTrailView.jsx';
import { AccessDeniedView } from '../views/AccessDeniedView.jsx';
import { DashboardEntry } from '../modules/role-workspaces/DashboardEntry.jsx';
import { AssetRequestsView } from '../modules/assets/views/AssetRequestsView.jsx';
import { MyAssetsView } from '../modules/assets/views/MyAssetsView.jsx';
import { SuperAdminDashboardView } from '../modules/role-workspaces/super-admin/SuperAdminDashboardView.jsx';
import { BrowseAuctionsView } from '../modules/auctions/views/BrowseAuctionsView.jsx';
import { BidsRouteEntry } from '../modules/auctions/views/BidsRouteEntry.jsx';
import { EvaluationManagementView } from '../modules/evaluations/views/EvaluationManagementView.jsx';
import { PaymentManagementView } from '../modules/payments/views/PaymentManagementView.jsx';
import { MyPaymentsView } from '../modules/payments/views/MyPaymentsView.jsx';
import { CpoManagementView } from '../modules/cpo-management/views/CpoManagementView.jsx';
import { MyCpoView } from '../modules/cpo-management/views/MyCpoView.jsx';
import { MyBidsView } from '../modules/bid-management/views/MyBidsView.jsx';
import { WinnerManagementView } from '../modules/winners/views/WinnerManagementView.jsx';
import { NotificationCenterView } from '../modules/notifications/views/NotificationCenterView.jsx';
import { ReportsAnalyticsView } from '../modules/analytics-report/views/ReportsAnalyticsView.jsx';

function guard(module, action = ACTIONS.READ, element) {
  return (
    <ProtectedRoute module={module} action={action}>
      {element}
    </ProtectedRoute>
  );
}

export { ROUTES } from '../config/routes.js';

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<AuthLayout />}>
        <Route path={ROUTES.HOME} element={<LoginView />} />
        <Route path="/login" element={<Navigate to={ROUTES.HOME} replace />} />
        <Route path={ROUTES.REGISTER} element={<RegisterView />} />
        <Route path={ROUTES.OTP_VERIFICATION} element={<OTPVerificationView />} />
      </Route>

      <Route
        path={ROUTES.KYC_VERIFICATION}
        element={
          <ProtectedRoute>
            <KYCVerificationView />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.KYC_UNDER_REVIEW}
        element={
          <ProtectedRoute>
            <KYCUnderReviewView />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.KYC_REJECTED}
        element={
          <ProtectedRoute>
            <KYCRejectedView />
          </ProtectedRoute>
        }
      />

      <Route
        path="/app"
        element={
          <ProtectedRoute>
            <RoleLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/app/auctions" replace />} />
        <Route path="dashboard" element={<DashboardEntry />} />
        <Route path="access-denied" element={<AccessDeniedView />} />

        <Route path="users" element={guard(MODULES.USERS, ACTIONS.READ, <UserManagementView />)} />
        <Route path="staff" element={guard(MODULES.STAFF, ACTIONS.READ, <StaffManagementView />)} />
        <Route path="roles" element={guard(MODULES.ROLES, ACTIONS.READ, <AuditTrailView />)} />
        <Route path="settings" element={guard(MODULES.SETTINGS, ACTIONS.READ, <SettingsView />)} />
        <Route
          path="kyc"
          element={
            <ProtectedRoute module={MODULES.KYC} action={ACTIONS.READ}>
              <PermissionGate module={MODULES.KYC} action={ACTIONS.READ} fallback={<Navigate to="/app/access-denied" replace />}>
                <KYCManagementView />
              </PermissionGate>
            </ProtectedRoute>
          }
        />
        <Route path="assets" element={guard(MODULES.ASSETS, ACTIONS.READ, <AssetRequestsView />)} />
        <Route path="my-assets" element={guard(MODULES.ASSETS, ACTIONS.READ, <MyAssetsView />)} />
        <Route
          path="submit-asset"
          element={<Navigate to={`${ROUTES.APP_MY_ASSETS}?new=1`} replace />}
        />
        <Route path="evaluations" element={guard(MODULES.EVALUATIONS, ACTIONS.READ, <EvaluationManagementView />)} />
        <Route path="auctions" element={guard(MODULES.AUCTIONS, ACTIONS.READ, <SuperAdminDashboardView />)} />
        <Route path="browse-auctions" element={guard(MODULES.BIDS, ACTIONS.READ, <BrowseAuctionsView />)} />
        <Route path="documents" element={guard(MODULES.DOCUMENTS, ACTIONS.READ, <ModulePageView title="Documents" module={MODULES.DOCUMENTS} />)} />
        <Route path="bids" element={guard(MODULES.BIDS, ACTIONS.READ, <BidsRouteEntry />)} />
        <Route path="my-bids" element={guard(MODULES.BIDS, ACTIONS.READ, <MyBidsView />)} />
        <Route path="winners" element={guard(MODULES.WINNERS, ACTIONS.READ, <WinnerManagementView />)} />
        <Route path="payments" element={guard(MODULES.PAYMENTS, ACTIONS.READ, <PaymentManagementView />)} />
        <Route path="my-payments" element={guard(MODULES.PAYMENTS, ACTIONS.READ, <MyPaymentsView />)} />
        <Route path="cpo" element={guard(MODULES.CPO, ACTIONS.READ, <CpoManagementView />)} />
        <Route path="my-cpo" element={guard(MODULES.CPO, ACTIONS.READ, <MyCpoView />)} />
        <Route path="reports" element={guard(MODULES.DASHBOARD, ACTIONS.EXPORT, <ReportsAnalyticsView />)} />
        <Route path="notifications" element={guard(MODULES.NOTIFICATIONS, ACTIONS.READ, <NotificationCenterView />)} />
        <Route path="profile" element={guard(MODULES.USERS, ACTIONS.READ, <UserProfileView />)} />
      </Route>

      {/* Legacy redirects */}
      <Route path="/auctions" element={<Navigate to={ROUTES.APP_AUCTIONS} replace />} />
      <Route path="/asset-request" element={<Navigate to={`${ROUTES.APP_MY_ASSETS}?new=1`} replace />} />
      <Route path="/users" element={<Navigate to={ROUTES.APP_USERS} replace />} />
      <Route path="/staff-roles" element={<Navigate to={ROUTES.APP_ROLES} replace />} />
      <Route path="/payments" element={<Navigate to={ROUTES.APP_PAYMENTS} replace />} />
      <Route path="/cpo-management" element={<Navigate to={ROUTES.APP_CPO} replace />} />
      <Route path="/bid-management" element={<Navigate to={ROUTES.APP_MY_BIDS} replace />} />
      <Route path="/analytics-report" element={<Navigate to={ROUTES.APP_REPORTS} replace />} />
      <Route path="/setting" element={<Navigate to={ROUTES.APP_SETTINGS} replace />} />
      <Route path="/marketplace" element={<Navigate to={ROUTES.APP_BROWSE_AUCTIONS} replace />} />
      <Route path="/bidder-dashboard" element={<Navigate to={ROUTES.APP_MY_BIDS} replace />} />
      <Route path="/operational-panel" element={<Navigate to={ROUTES.APP_REPORTS} replace />} />
    </Routes>
  );
}

export default AppRoutes;
