import { usePermission } from '../../core/auth/usePermission.js';
import { SuperAdminDashboardView } from './super-admin/SuperAdminDashboardView.jsx';
import { AuctionManagerDashboardView } from './auction-manager/AuctionManagerDashboardView.jsx';
import { EvaluationOfficerDashboardView } from './evaluation-officer/EvaluationOfficerDashboardView.jsx';
import { FinanceOfficerDashboardView } from './finance-officer/FinanceOfficerDashboardView.jsx';
import { CustomerServiceDashboardView } from './customer-service/CustomerServiceDashboardView.jsx';
import { BidderDashboardView } from './bidder/BidderDashboardView.jsx';
import { AssetOwnerDashboardView } from './asset-owner/AssetOwnerDashboardView.jsx';

const ROLE_DASHBOARDS = Object.freeze({
  super_admin: SuperAdminDashboardView,
  auction_manager: AuctionManagerDashboardView,
  evaluation_officer: EvaluationOfficerDashboardView,
  finance_officer: FinanceOfficerDashboardView,
  customer_service_officer: CustomerServiceDashboardView,
  bidder: BidderDashboardView,
  asset_owner: AssetOwnerDashboardView,
});

export function RoleDashboardView() {
  const { roleCode } = usePermission();
  const View = ROLE_DASHBOARDS[roleCode] ?? SuperAdminDashboardView;
  return <View />;
}

export default RoleDashboardView;
