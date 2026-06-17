import { Routes, Route, Navigate } from 'react-router-dom';
import { BaseLayout } from './layouts/BaseLayout.jsx';
import { ROUTES } from './routes/index.js';
import {
  HomeView,
  AuctionCatalogView,
  AssetRequestView,
  UserProfileView,
  LoginView,
  StaffRolesView,
  PaymentsView,
  CpoManagementView,
  BidManagementView,
  AnalyticsReportView,
  SettingView,
} from './views/index.js';

export function App() {
  return (
    <BaseLayout>
      <Routes>
        <Route path={ROUTES.HOME} element={<HomeView />} />
        <Route path={ROUTES.AUCTIONS} element={<AuctionCatalogView />} />
        <Route path={ROUTES.ASSET_REQUEST} element={<AssetRequestView />} />
        <Route path={ROUTES.USERS} element={<UserProfileView />} />
        <Route path={ROUTES.LOGIN} element={<LoginView />} />
        <Route path={ROUTES.STAFF_ROLES} element={<StaffRolesView />} />
        <Route path={ROUTES.PAYMENTS} element={<PaymentsView />} />
        <Route path={ROUTES.CPO_MANAGEMENT} element={<CpoManagementView />} />
        <Route path={ROUTES.BID_MANAGEMENT} element={<BidManagementView />} />
        <Route path={ROUTES.ANALYTICS_REPORT} element={<AnalyticsReportView />} />
        <Route path={ROUTES.SETTING} element={<SettingView />} />

        {/* Legacy route aliases */}
        <Route path="/marketplace" element={<Navigate to={ROUTES.AUCTIONS} replace />} />
        <Route path="/bidder-dashboard" element={<Navigate to={ROUTES.BID_MANAGEMENT} replace />} />
        <Route path="/operational-panel" element={<Navigate to={ROUTES.ANALYTICS_REPORT} replace />} />
      </Routes>
    </BaseLayout>
  );
}

export default App;
