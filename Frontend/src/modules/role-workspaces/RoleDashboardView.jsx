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

const ROLE_METRIC_KEYS = Object.freeze({
  evaluation_officer: ['assets', 'evaluations'],
  finance_officer: ['payments', 'cpo'],
  auction_manager: ['auctions', 'bids', 'winners', 'cpo'],
  customer_service_officer: ['users', 'kyc', 'assets', 'cpo'],
  bidder: ['bids', 'payments', 'cpo'],
  asset_owner: ['assets', 'payments'],
});

/**
 * @param {{ metrics?: object, metricsLoading?: boolean, metricsError?: string }} props
 */
export function RoleDashboardView({ metrics, metricsLoading, metricsError }) {
  const { roleCode } = usePermission();
  const View = ROLE_DASHBOARDS[roleCode] ?? SuperAdminDashboardView;
  const metricKeys = ROLE_METRIC_KEYS[roleCode] ?? [];

  return (
    <View
      metrics={metrics}
      metricsLoading={metricsLoading}
      metricsError={metricsError}
      metricKeys={metricKeys}
    />
  );
}

export default RoleDashboardView;
