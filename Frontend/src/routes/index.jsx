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
import { AccessDeniedView } from '../views/AccessDeniedView.jsx';
import { DashboardEntry } from '../modules/role-workspaces/DashboardEntry.jsx';
import { AssetRequestsView } from '../modules/assets/views/AssetRequestsView.jsx';
import { SuperAdminDashboardView } from '../modules/role-workspaces/super-admin/SuperAdminDashboardView.jsx';

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

        <Route path="users" element={guard(MODULES.USERS, ACTIONS.READ, <ModulePageView title="Users" module={MODULES.USERS} />)} />
        <Route path="staff" element={guard(MODULES.STAFF, ACTIONS.READ, <ModulePageView title="Staff" module={MODULES.STAFF} />)} />
        <Route path="roles" element={guard(MODULES.ROLES, ACTIONS.READ, <ModulePageView title="Roles" module={MODULES.ROLES} />)} />
        <Route path="settings" element={guard(MODULES.SETTINGS, ACTIONS.READ, <ModulePageView title="Settings" module={MODULES.SETTINGS} />)} />
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
        <Route path="my-assets" element={guard(MODULES.ASSETS, ACTIONS.READ, <ModulePageView title="My Assets" module={MODULES.ASSETS} />)} />
        <Route path="submit-asset" element={guard(MODULES.ASSETS, ACTIONS.CREATE, <ModulePageView title="Submit Asset" module={MODULES.ASSETS} />)} />
        <Route path="evaluations" element={guard(MODULES.EVALUATIONS, ACTIONS.READ, <ModulePageView title="Evaluations" module={MODULES.EVALUATIONS} />)} />
        <Route path="auctions" element={guard(MODULES.AUCTIONS, ACTIONS.READ, <SuperAdminDashboardView />)} />
        <Route path="browse-auctions" element={guard(MODULES.BIDS, ACTIONS.READ, <ModulePageView title="Browse Auctions" module={MODULES.BIDS} />)} />
        <Route path="documents" element={guard(MODULES.DOCUMENTS, ACTIONS.READ, <ModulePageView title="Documents" module={MODULES.DOCUMENTS} />)} />
        <Route path="bids" element={guard(MODULES.BIDS, ACTIONS.READ, <ModulePageView title="Bids" module={MODULES.BIDS} />)} />
        <Route path="my-bids" element={guard(MODULES.BIDS, ACTIONS.READ, <ModulePageView title="My Bids" module={MODULES.BIDS} />)} />
        <Route path="winners" element={guard(MODULES.WINNERS, ACTIONS.READ, <ModulePageView title="Winners" module={MODULES.WINNERS} />)} />
        <Route path="payments" element={guard(MODULES.PAYMENTS, ACTIONS.READ, <ModulePageView title="Payments" module={MODULES.PAYMENTS} />)} />
        <Route path="cpo" element={guard(MODULES.CPO, ACTIONS.READ, <ModulePageView title="CPO" module={MODULES.CPO} />)} />
        <Route path="reports" element={guard(MODULES.DASHBOARD, ACTIONS.EXPORT, <ModulePageView title="Reports" module={MODULES.DASHBOARD} />)} />
        <Route path="notifications" element={guard(MODULES.NOTIFICATIONS, ACTIONS.READ, <ModulePageView title="Notifications" module={MODULES.NOTIFICATIONS} />)} />
        <Route path="profile" element={guard(MODULES.USERS, ACTIONS.READ, <ModulePageView title="Profile" module={MODULES.USERS} />)} />
      </Route>

      {/* Legacy redirects */}
      <Route path="/auctions" element={<Navigate to={ROUTES.APP_AUCTIONS} replace />} />
      <Route path="/asset-request" element={<Navigate to={ROUTES.APP_SUBMIT_ASSET} replace />} />
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
