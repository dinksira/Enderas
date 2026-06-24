import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../stores/auth-store.js';
import { canAccess } from '../../utils/permissions.js';
import { ROUTES } from '../../config/routes.js';

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
  redirectTo = ROUTES.HOME,
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
    return <Navigate to={redirectTo} replace state={{ from: location.pathname }} />;
  }

  // KYC status check: only skip KYC checks if user is staff
  if (!user?.isStaff) {
    const userStatus = user?.status;
    
    // Define allowed routes for each KYC status
    const allowedRoutesByStatus = {
      pending: [ROUTES.KYC_VERIFICATION],
      kyc_pending: [ROUTES.KYC_VERIFICATION],
      kyc_under_review: [ROUTES.KYC_UNDER_REVIEW],
      kyc_rejected: [ROUTES.KYC_REJECTED, ROUTES.KYC_VERIFICATION],
      active: [], // active users can go anywhere
    };
    
    const allowedRoutes = allowedRoutesByStatus[userStatus] || [];
    const currentPath = location.pathname;
    const isCurrentPathAllowed = allowedRoutes.includes(currentPath);
    const isAppRoute = currentPath.startsWith('/app');
    
    // Handle routing based on KYC status
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
        // Only redirect away from non-KYC, non-app routes
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
