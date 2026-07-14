import { Routes, Route, Navigate } from 'react-router-dom';
import { ROUTES } from '../config/routes.js';
import { MODULES, ACTIONS } from '../config/navigation.config.js';
import { AuthLayout } from '../layouts/AuthLayout.jsx';
import { PublicLayout } from '../layouts/PublicLayout.jsx';
import { ProtectedRoute, RoleLayout } from '../core/auth/index.js';
import { LandingPageView } from '../modules/public/views/LandingPageView.jsx';
import { PublicAuthView } from '../modules/public/views/PublicAuthView.jsx';
import { LoginView } from '../modules/users/views/LoginView.jsx';
import { RegisterView } from '../modules/auth/views/RegisterView.jsx';
import { OTPVerificationView } from '../modules/auth/views/OTPVerificationView.jsx';
import { KYCVerificationView, KYCUnderReviewView, KYCRejectedView } from '../modules/kyc/index.js';
import { ModulePageView } from '../modules/dashboard/views/ModulePageView.jsx';
import { UserProfileView } from '../modules/users/views/user-profile-view.jsx';
import { AccessDeniedView } from '../views/AccessDeniedView.jsx';
import { MyAssetsView } from '../modules/assets/views/MyAssetsView.jsx';
import { BrowseAuctionsView } from '../modules/auctions/views/BrowseAuctionsView.jsx';
import { BidsRouteEntry } from '../modules/auctions/views/BidsRouteEntry.jsx';
import { MyBidsView } from '../modules/bid-management/views/MyBidsView.jsx';
import { NotificationCenterView } from '../modules/notifications/views/NotificationCenterView.jsx';
import { OrganizationPortalView } from '../modules/organization-portal/views/OrganizationPortalView.jsx';
import TrackingLayout from '../layouts/TrackingLayout.jsx';
import TrackingAuthPage from '../modules/tracking/views/TrackingAuthPage.jsx';
import TrackingDashboardPage from '../modules/tracking/views/TrackingDashboardPage.jsx';
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
      <Route element={<PublicLayout />}>
        <Route path={ROUTES.LANDING} element={<LandingPageView />} />
        <Route path={ROUTES.LOGIN} element={<PublicAuthView />} />
      </Route>

      <Route element={<AuthLayout />}>
        <Route path="/login-legacy" element={<LoginView />} />
        <Route path={ROUTES.REGISTER} element={<Navigate to={`${ROUTES.LOGIN}?tab=register`} replace />} />
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
        <Route index element={<Navigate to="/app/browse-auctions" replace />} />
        <Route path="dashboard" element={<Navigate to="/app/access-denied" replace />} />
        <Route path="access-denied" element={<AccessDeniedView />} />

        <Route path="users" element={<Navigate to="/app/access-denied" replace />} />
        <Route path="staff" element={<Navigate to="/app/access-denied" replace />} />
        <Route path="roles" element={<Navigate to="/app/access-denied" replace />} />
        <Route path="settings" element={<Navigate to="/app/access-denied" replace />} />
        <Route path="kyc" element={<Navigate to="/app/access-denied" replace />} />
        <Route path="assets" element={<Navigate to="/app/access-denied" replace />} />
        <Route path="my-assets" element={guard(MODULES.ASSETS, ACTIONS.READ, <MyAssetsView />)} />
        <Route
          path="submit-asset"
          element={<Navigate to={`${ROUTES.APP_MY_ASSETS}?new=1`} replace />}
        />
        <Route path="evaluations" element={<Navigate to="/app/access-denied" replace />} />
        <Route
          path="auctions"
          element={guard(MODULES.AUCTIONS, ACTIONS.READ, <ModulePageView title="Auctions" module={MODULES.AUCTIONS} />)}
        />
        <Route path="browse-auctions" element={guard(MODULES.BIDS, ACTIONS.READ, <BrowseAuctionsView />)} />
        <Route path="documents" element={guard(MODULES.DOCUMENTS, ACTIONS.READ, <ModulePageView title="Documents" module={MODULES.DOCUMENTS} />)} />
        <Route path="bids" element={guard(MODULES.BIDS, ACTIONS.READ, <BidsRouteEntry />)} />
        <Route path="my-bids" element={guard(MODULES.BIDS, ACTIONS.READ, <MyBidsView />)} />
        <Route path="winners" element={<Navigate to="/app/access-denied" replace />} />
        <Route path="payments" element={<Navigate to="/app/access-denied" replace />} />
        <Route path="my-payments" element={<Navigate to={ROUTES.APP_NOTIFICATIONS} replace />} />
        <Route path="cpo" element={<Navigate to="/app/access-denied" replace />} />
        <Route path="my-cpo" element={<Navigate to={ROUTES.APP_NOTIFICATIONS} replace />} />
        <Route path="reports" element={<Navigate to="/app/access-denied" replace />} />
        <Route path="notifications" element={guard(MODULES.NOTIFICATIONS, ACTIONS.READ, <NotificationCenterView />)} />
        <Route path="org-portal" element={<OrganizationPortalView />} />
        <Route path="profile" element={
          <ProtectedRoute>
            <UserProfileView />
          </ProtectedRoute>
        } />
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

      {/* Public auction tracking pages */}
      <Route path="/track" element={<TrackingLayout />}>
        <Route path=":token" element={<TrackingAuthPage />} />
        <Route path=":token/dashboard" element={<TrackingDashboardPage />} />
      </Route>
    </Routes>
  );
}

export default AppRoutes;
