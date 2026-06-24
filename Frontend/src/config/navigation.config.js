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
  { id: 'auctions', label: 'Auctions', path: '/app/auctions', module: MODULES.AUCTIONS, action: ACTIONS.READ, group: 'auction' },
  { id: 'browse-auctions', label: 'Browse Auctions', path: '/app/browse-auctions', module: MODULES.BIDS, action: ACTIONS.READ, group: 'bidder' },
  { id: 'my-bids', label: 'My Bids', path: '/app/my-bids', module: MODULES.BIDS, action: ACTIONS.READ, group: 'bidder' },
  { id: 'assets', label: 'Asset Requests', path: '/app/assets', module: MODULES.ASSETS, action: ACTIONS.READ, group: 'operations' },
  { id: 'my-assets', label: 'My Requests', path: '/app/my-assets', module: MODULES.ASSETS, action: ACTIONS.READ, group: 'owner' },
  { id: 'submit-asset', label: 'Request Auction', path: '/app/submit-asset', module: MODULES.ASSETS, action: ACTIONS.CREATE, group: 'owner' },
  { id: 'users', label: 'Users', path: '/app/users', module: MODULES.USERS, action: ACTIONS.READ, group: 'admin' },
  { id: 'staff', label: 'Staff & Roles', path: '/app/staff', module: MODULES.STAFF, action: ACTIONS.READ, group: 'admin' },
  { id: 'payments', label: 'Payments', path: '/app/payments', module: MODULES.PAYMENTS, action: ACTIONS.READ, group: 'finance' },
  { id: 'cpo', label: 'CPO Management', path: '/app/cpo', module: MODULES.CPO, action: ACTIONS.READ, group: 'operations' },
  { id: 'bids', label: 'Bid Management', path: '/app/bids', module: MODULES.BIDS, action: ACTIONS.READ, group: 'auction' },
  { id: 'reports', label: 'Reports & Analytics', path: '/app/reports', module: MODULES.DASHBOARD, action: ACTIONS.EXPORT, group: 'finance' },
  { id: 'settings', label: 'System Settings', path: '/app/settings', module: MODULES.SETTINGS, action: ACTIONS.READ, group: 'admin' },
  { id: 'roles', label: 'Audit Trail', path: '/app/roles', module: MODULES.ROLES, action: ACTIONS.READ, group: 'admin' },
  { id: 'notifications', label: 'Notifications', path: '/app/notifications', module: MODULES.NOTIFICATIONS, action: ACTIONS.READ, group: 'bidder' },
]);

/** Nav groups shown per end-user role (staff roles use STAFF_NAV_GROUPS). */
export const ROLE_NAV_GROUPS = Object.freeze({
  bidder: ['bidder', 'owner', 'finance', 'operations', 'account'],
  asset_owner: ['owner', 'operations', 'account'],
});

export const STAFF_NAV_GROUPS = Object.freeze([
  'admin',
  'auction',
  'operations',
  'finance',
  'main',
  'account',
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

  let items = hasWildcardAccess(permissions)
    ? [...registry]
    : registry.filter((item) => canAccess(permissions, item.module, item.action));

  if (!hasWildcardAccess(permissions)) {
    const roleCode = permissions.roleCode;
    const allowedGroups = ROLE_NAV_GROUPS[roleCode] ?? STAFF_NAV_GROUPS;
    items = items.filter((item) => !item.group || allowedGroups.includes(item.group));
  }

  return items;
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
  ROLE_NAV_GROUPS,
  STAFF_NAV_GROUPS,
  ROLE_DEFAULT_ROUTES,
  canAccessPage,
  resolveNavigation,
  resolveDefaultRoute,
};
