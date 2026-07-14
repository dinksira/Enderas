import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { ROUTES } from '../config/routes.js';
import { MODULES, ACTIONS } from '../config/navigation.config.js';
import { AuthLayout } from '../layouts/AuthLayout.jsx';
import { ProtectedRoute, RoleLayout, PermissionGate } from '../core/auth/index.js';

import { LoginView } from '../modules/users/views/LoginView.jsx';
import { KYCManagementView } from '../modules/kyc/views/KYCManagementView.jsx';
import { ModulePageView } from '../modules/dashboard/views/ModulePageView.jsx';
import { UserManagementView } from '../modules/users/views/UserManagementView.jsx';
import { UserProfileView } from '../modules/users/views/user-profile-view.jsx';
import { StaffManagementView } from '../modules/staff/views/StaffManagementView.jsx';
import { OrganizationManagementView } from '../modules/organizations/views/OrganizationManagementView.jsx';
import { SettingsView } from '../modules/setting/views/SettingsView.jsx';

import { AboutView } from '../modules/about/views/AboutView.jsx';
import { AuditTrailView } from '../modules/audit/views/AuditTrailView.jsx';
import { AccessDeniedView } from '../views/AccessDeniedView.jsx';
import { DashboardEntry } from '../modules/role-workspaces/DashboardEntry.jsx';
import { AssetRequestsView } from '../modules/assets/views/AssetRequestsView.jsx';
import { SuperAdminDashboardView } from '../modules/role-workspaces/super-admin/SuperAdminDashboardView.jsx';
import { ShareLinkManagementView } from '../modules/share-links/views/ShareLinkManagementView.jsx';
import { BidManagementView } from '../modules/bid-management/views/BidManagementView.jsx';
import { EvaluationManagementView } from '../modules/evaluations/views/EvaluationManagementView.jsx';
import { PaymentManagementView } from '../modules/payments/views/PaymentManagementView.jsx';
import { CpoManagementView } from '../modules/cpo-management/views/CpoManagementView.jsx';
import { WinnerManagementView } from '../modules/winners/views/WinnerManagementView.jsx';
import { NotificationCenterView } from '../modules/notifications/views/NotificationCenterView.jsx';
import { ReportsAnalyticsView } from '../modules/analytics-report/views/ReportsAnalyticsView.jsx';
import { CreateAuctionView } from '../modules/auctions/views/CreateAuctionView.jsx';


function AdminBrowseAuctionsRoute() {

  return <Navigate to="/login" replace />;

}

function CreateAuctionRoute() {
  const navigate = useNavigate();
  return (
    <CreateAuctionView
      open
      onClose={() => navigate('/app/auctions')}
      onSuccess={() => navigate('/app/auctions')}
    />
  );
}

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
      <Route path="/" element={<Navigate to={ROUTES.LOGIN} replace />} />

      <Route element={<AuthLayout />}>
        <Route path={ROUTES.LOGIN} element={<LoginView />} />
      </Route>

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
        <Route path="organizations" element={guard(MODULES.ORGANIZATIONS, ACTIONS.READ, <OrganizationManagementView />)} />
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
        <Route path="evaluations" element={guard(MODULES.EVALUATIONS, ACTIONS.READ, <EvaluationManagementView />)} />
        <Route path="auctions" element={guard(MODULES.AUCTIONS, ACTIONS.READ, <SuperAdminDashboardView />)} />
        <Route path="share-links" element={guard(MODULES.AUCTIONS, ACTIONS.READ, <ShareLinkManagementView />)} />
        <Route path="browse-auctions" element={<AdminBrowseAuctionsRoute />} />
        <Route path="my-bids" element={<Navigate to="/app/access-denied" replace />} />
        <Route path="my-payments" element={<Navigate to="/app/access-denied" replace />} />
        <Route path="my-cpo" element={<Navigate to="/app/access-denied" replace />} />
        <Route path="my-assets" element={<Navigate to="/app/access-denied" replace />} />
        <Route path="documents" element={guard(MODULES.DOCUMENTS, ACTIONS.READ, <ModulePageView title="Documents" module={MODULES.DOCUMENTS} />)} />
        <Route path="bids" element={guard(MODULES.BIDS, ACTIONS.READ, <BidManagementView />)} />
        <Route path="winners" element={guard(MODULES.WINNERS, ACTIONS.READ, <WinnerManagementView />)} />
        <Route path="payments" element={guard(MODULES.PAYMENTS, ACTIONS.READ, <PaymentManagementView />)} />
        <Route path="create-auction" element={guard(MODULES.AUCTIONS, ACTIONS.CREATE, <CreateAuctionRoute />)} />
        <Route path="auctions/create" element={guard(MODULES.AUCTIONS, ACTIONS.CREATE, <CreateAuctionRoute />)} />
        <Route path="cpo" element={guard(MODULES.CPO, ACTIONS.READ, <CpoManagementView />)} />
        <Route path="reports" element={guard(MODULES.DASHBOARD, ACTIONS.EXPORT, <ReportsAnalyticsView />)} />
        <Route path="notifications" element={guard(MODULES.NOTIFICATIONS, ACTIONS.READ, <NotificationCenterView />)} />
        <Route path="profile" element={guard(MODULES.USERS, ACTIONS.READ, <UserProfileView />)} />
        <Route path="about" element={guard(MODULES.USERS, ACTIONS.READ, <AboutView />)} />
      </Route>

      <Route path="/auctions" element={<Navigate to={ROUTES.APP_AUCTIONS} replace />} />
      <Route path="/users" element={<Navigate to={ROUTES.APP_USERS} replace />} />
      <Route path="/staff-roles" element={<Navigate to={ROUTES.APP_ROLES} replace />} />
      <Route path="/payments" element={<Navigate to={ROUTES.APP_PAYMENTS} replace />} />
      <Route path="/cpo-management" element={<Navigate to={ROUTES.APP_CPO} replace />} />
      <Route path="/analytics-report" element={<Navigate to={ROUTES.APP_REPORTS} replace />} />
      <Route path="/setting" element={<Navigate to={ROUTES.APP_SETTINGS} replace />} />
      <Route path="/operational-panel" element={<Navigate to={ROUTES.APP_REPORTS} replace />} />
      <Route path="*" element={<Navigate to={ROUTES.LOGIN} replace />} />
    </Routes>
  );
}

export default AppRoutes;
