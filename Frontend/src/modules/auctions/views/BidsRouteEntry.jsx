import { Navigate } from 'react-router-dom';
import { ROUTES } from '../../../config/routes.js';
import { usePermission } from '@enderass/shared/auth';

/**
 * Bidder browse redirect; staff bid management lives in the admin app.
 */
export function BidsRouteEntry() {
  const { roleCode } = usePermission();

  if (roleCode === 'bidder') {
    return <Navigate to={ROUTES.APP_BROWSE_AUCTIONS} replace />;
  }

  return <Navigate to="/app/access-denied" replace />;
}

export default BidsRouteEntry;
