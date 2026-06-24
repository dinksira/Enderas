import { Navigate } from 'react-router-dom';
import { ROUTES } from '../../../config/routes.js';
import { MODULES } from '../../../config/navigation.config.js';
import { usePermission } from '../../../core/auth/usePermission.js';
import { ModulePageView } from '../../dashboard/views/ModulePageView.jsx';

/**
 * Staff bid management vs bidder redirect.
 */
export function BidsRouteEntry() {
  const { roleCode } = usePermission();

  if (roleCode === 'bidder') {
    return <Navigate to={ROUTES.APP_BROWSE_AUCTIONS} replace />;
  }

  return <ModulePageView title="Bids" module={MODULES.BIDS} />;
}

export default BidsRouteEntry;
