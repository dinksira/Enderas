import { Routes, Route, Navigate } from 'react-router-dom';
import { ROUTES } from '../config/routes.js';
import { AuthLayout } from '../layouts/AuthLayout.jsx';
import { BaseLayout } from '../layouts/BaseLayout.jsx';
import { LoginView } from '../modules/users/views/LoginView.jsx';
import { AuctionCatalogView } from '../modules/auctions/views/auction-catalog-view.jsx';
import { AssetRequestView } from '../modules/asset-request/views/asset-request-view.jsx';
import { UserProfileView } from '../modules/users/views/user-profile-view.jsx';
import { StaffRolesView } from '../modules/staff-roles/views/staff-roles-view.jsx';
import { PaymentsView } from '../modules/payments/views/payments-view.jsx';
import { CpoManagementView } from '../modules/cpo-management/views/cpo-management-view.jsx';
import { BidManagementView } from '../modules/bid-management/views/bid-management-view.jsx';
import { AnalyticsReportView } from '../modules/analytics-report/views/analytics-report-view.jsx';
import { SettingView } from '../modules/setting/views/setting-view.jsx';

export { ROUTES } from '../config/routes.js';

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<AuthLayout />}>
        <Route path={ROUTES.HOME} element={<LoginView />} />
        <Route path="/login" element={<Navigate to={ROUTES.HOME} replace />} />
      </Route>

      <Route element={<BaseLayout />}>
        <Route path={ROUTES.AUCTIONS} element={<AuctionCatalogView />} />
        <Route path={ROUTES.ASSET_REQUEST} element={<AssetRequestView />} />
        <Route path={ROUTES.USERS} element={<UserProfileView />} />
        <Route path={ROUTES.STAFF_ROLES} element={<StaffRolesView />} />
        <Route path={ROUTES.PAYMENTS} element={<PaymentsView />} />
        <Route path={ROUTES.CPO_MANAGEMENT} element={<CpoManagementView />} />
        <Route path={ROUTES.BID_MANAGEMENT} element={<BidManagementView />} />
        <Route path={ROUTES.ANALYTICS_REPORT} element={<AnalyticsReportView />} />
        <Route path={ROUTES.SETTING} element={<SettingView />} />

        <Route path="/marketplace" element={<Navigate to={ROUTES.AUCTIONS} replace />} />
        <Route path="/bidder-dashboard" element={<Navigate to={ROUTES.BID_MANAGEMENT} replace />} />
        <Route path="/operational-panel" element={<Navigate to={ROUTES.ANALYTICS_REPORT} replace />} />
      </Route>
    </Routes>
  );
}

export default AppRoutes;
