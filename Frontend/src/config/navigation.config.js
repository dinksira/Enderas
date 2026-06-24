/**
 * Frontend permission evaluation — mirrors backend policy.engine.js
 */
import { canAccess, hasWildcardAccess } from '../utils/permissions.js';

export const MODULES = Object.freeze({
  USERS: 'users',
  KYC: 'kyc',
  ASSETS: 'assets',
  EVALUATIONS: 'evaluations',
  AUCTIONS: 'auctions',
  DOCUMENTS: 'documents',
  PAYMENTS: 'payments',
  CPO: 'cpo',
  BIDS: 'bids',
  WINNERS: 'winners',
  NOTIFICATIONS: 'notifications',
  DASHBOARD: 'dashboard',
  STAFF: 'staff',
  ROLES: 'roles',
  REPORTS: 'reports',
  SETTINGS: 'settings',
});

export const ACTIONS = Object.freeze({
  READ: 'read',
  CREATE: 'create',
  UPDATE: 'update',
  DELETE: 'delete',
  APPROVE: 'approve',
  REJECT: 'reject',
  PUBLISH: 'publish',
  CLOSE: 'close',
  EXPORT: 'export',
});

/**
 * Page registry aligned with backend PAGE_ACCESS_REGISTRY.
 */
export const PAGE_REGISTRY = Object.freeze([
  { id: 'kyc', label: 'KYC Verification', path: '/app/kyc', module: MODULES.KYC, action: ACTIONS.READ, group: 'operations' },
  { id: 'auctions', label: 'Auctions', path: '/app/auctions', module: MODULES.AUCTIONS, action: ACTIONS.READ, group: 'admin' },
  { id: 'assets', label: 'Asset Requests', path: '/app/assets', module: MODULES.ASSETS, action: ACTIONS.READ, group: 'admin' },
  { id: 'users', label: 'Users', path: '/app/users', module: MODULES.USERS, action: ACTIONS.READ, group: 'admin' },
  { id: 'staff', label: 'Staff & Roles', path: '/app/staff', module: MODULES.STAFF, action: ACTIONS.READ, group: 'admin' },
  { id: 'payments', label: 'Payments', path: '/app/payments', module: MODULES.PAYMENTS, action: ACTIONS.READ, group: 'admin' },
  { id: 'cpo', label: 'CPO Management', path: '/app/cpo', module: MODULES.CPO, action: ACTIONS.READ, group: 'admin' },
  { id: 'bids', label: 'Bid Management', path: '/app/bids', module: MODULES.BIDS, action: ACTIONS.READ, group: 'admin' },
  { id: 'reports', label: 'Reports & Analytics', path: '/app/reports', module: MODULES.DASHBOARD, action: ACTIONS.EXPORT, group: 'admin' },
  { id: 'settings', label: 'System Settings', path: '/app/settings', module: MODULES.SETTINGS, action: ACTIONS.READ, group: 'admin' },
  { id: 'roles', label: 'Audit Trail', path: '/app/roles', module: MODULES.ROLES, action: ACTIONS.READ, group: 'admin' },
]);

/**
 * Role → default landing route after login.
 */
export const ROLE_DEFAULT_ROUTES = Object.freeze({
  super_admin: '/app/auctions',
  auction_manager: '/app/auctions',
  evaluation_officer: '/app/auctions',
  finance_officer: '/app/auctions',
  customer_service_officer: '/app/auctions',
  bidder: '/app/browse-auctions',
  asset_owner: '/app/my-assets',
});

/**
 * @param {object} permissions
 * @param {string} moduleName
 * @param {string} [actionName]
 */
export function canAccessPage(permissions, moduleName, actionName = ACTIONS.READ) {
  return canAccess(permissions, moduleName, actionName);
}

/**
 * Filter navigation items by permission context.
 * @param {object} permissions
 * @param {Array} [registry]
 */
export function resolveNavigation(permissions, registry = PAGE_REGISTRY) {
  if (!permissions) {
    return [];
  }

  if (hasWildcardAccess(permissions)) {
    return [...registry];
  }

  return registry.filter((item) => canAccess(permissions, item.module, item.action));
}

/**
 * Resolve post-login redirect path from role code.
 * @param {string} roleCode
 */
export function resolveDefaultRoute(roleCode) {
  return ROLE_DEFAULT_ROUTES[roleCode] ?? '/app/dashboard';
}

export default {
  MODULES,
  ACTIONS,
  PAGE_REGISTRY,
  ROLE_DEFAULT_ROUTES,
  canAccessPage,
  resolveNavigation,
  resolveDefaultRoute,
};
