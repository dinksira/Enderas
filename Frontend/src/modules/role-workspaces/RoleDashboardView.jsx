import { usePermission } from '../../core/auth/usePermission.js';
import { normalizeEndUserRoleCode } from '../../constants/end-user-role.constants.js';
import { SuperAdminDashboardView } from './super-admin/SuperAdminDashboardView.jsx';
import { AuctionManagerDashboardView } from './auction-manager/AuctionManagerDashboardView.jsx';
import { EvaluationOfficerDashboardView } from './evaluation-officer/EvaluationOfficerDashboardView.jsx';
import { FinanceOfficerDashboardView } from './finance-officer/FinanceOfficerDashboardView.jsx';
import { CustomerServiceDashboardView } from './customer-service/CustomerServiceDashboardView.jsx';
import { BidderDashboardView } from './bidder/BidderDashboardView.jsx';

const ROLE_DASHBOARDS = Object.freeze({
  super_admin: SuperAdminDashboardView,
  auction_manager: AuctionManagerDashboardView,
  evaluation_officer: EvaluationOfficerDashboardView,
  finance_officer: FinanceOfficerDashboardView,
  customer_service_officer: CustomerServiceDashboardView,
  bidder: BidderDashboardView,
});

const BIDDER_METRIC_KEYS = Object.freeze(['bids', 'payments', 'cpo', 'assets']);

const ROLE_METRIC_KEYS = Object.freeze({
  evaluation_officer: ['assets', 'evaluations'],
  finance_officer: ['payments', 'cpo'],
  auction_manager: ['auctions', 'bids', 'winners', 'cpo'],
  customer_service_officer: ['users', 'kyc', 'assets', 'cpo'],
  bidder: BIDDER_METRIC_KEYS,
});

/**
 * @param {{ metrics?: object, metricsLoading?: boolean, metricsError?: string }} props
 */
export function RoleDashboardView({ metrics, metricsLoading, metricsError }) {
  const { roleCode } = usePermission();
  const normalizedRoleCode = normalizeEndUserRoleCode(roleCode);
  const View = ROLE_DASHBOARDS[normalizedRoleCode] ?? SuperAdminDashboardView;
  const metricKeys = ROLE_METRIC_KEYS[normalizedRoleCode] ?? [];

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
