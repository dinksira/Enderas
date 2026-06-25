import { BidManagementView } from '../../bid-management/views/BidManagementView.jsx';
import { Navigate } from 'react-router-dom';
import { ROUTES } from '../../../config/routes.js';
import { usePermission } from '../../../core/auth/usePermission.js';

/**
 * Staff bid management vs bidder redirect.
 */
export function BidsRouteEntry() {
  const { roleCode } = usePermission();

  if (roleCode === 'bidder') {
    return <Navigate to={ROUTES.APP_BROWSE_AUCTIONS} replace />;
  }

  return <BidManagementView />;
}

export default BidsRouteEntry;
