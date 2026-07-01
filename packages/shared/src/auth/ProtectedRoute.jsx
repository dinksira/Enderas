import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from './auth-store.js';
import { canAccess } from '../utils/permissions.js';
import { ROUTES } from '../config/routes.js';

/**
 * @param {{
 *   children: import('react').ReactNode,
 *   module?: string,
 *   action?: string,
 *   redirectTo?: string,
 * }} props
 */
export function ProtectedRoute({
  children,
  module: moduleName,
  action = 'read',
  redirectTo = ROUTES.LOGIN,
}) {
  const location = useLocation();
  const status = useAuthStore((state) => state.status);
  const permissions = useAuthStore((state) => state.permissions);
  const user = useAuthStore((state) => state.user);

  if (status === 'idle' || status === 'hydrating') {
    return (
      <div className="protected-route protected-route--loading" role="status">
        Loading session...
      </div>
    );
  }

  if (status !== 'authenticated') {
    const returnPath = `${location.pathname}${location.search}`;
    return <Navigate to={redirectTo} replace state={{ from: returnPath }} />;
  }

  if (!user?.isStaff) {
    const userStatus = user?.status;

    const allowedRoutesByStatus = {
      pending: [ROUTES.KYC_VERIFICATION],
      kyc_pending: [ROUTES.KYC_VERIFICATION],
      kyc_under_review: [ROUTES.KYC_UNDER_REVIEW],
      kyc_rejected: [ROUTES.KYC_REJECTED, ROUTES.KYC_VERIFICATION],
      active: [],
    };

    const allowedRoutes = allowedRoutesByStatus[userStatus] || [];
    const currentPath = location.pathname;
    const isCurrentPathAllowed = allowedRoutes.includes(currentPath);

    if (userStatus === 'kyc_under_review') {
      if (!isCurrentPathAllowed) {
        return <Navigate to={ROUTES.KYC_UNDER_REVIEW} replace />;
      }
    } else if (userStatus === 'kyc_rejected') {
      if (!isCurrentPathAllowed) {
        return <Navigate to={ROUTES.KYC_REJECTED} replace />;
      }
    } else if (userStatus === 'pending' || userStatus === 'kyc_pending') {
      if (currentPath !== ROUTES.KYC_VERIFICATION && !currentPath.startsWith('/app')) {
        return <Navigate to={ROUTES.KYC_VERIFICATION} replace />;
      }
    }
  }

  if (moduleName && !canAccess(permissions, moduleName, action)) {
    return <Navigate to="/app/access-denied" replace />;
  }

  return children;
}

export default ProtectedRoute;
