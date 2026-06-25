/**
 * Central route ↔ module/action registry.
 * API paths use /api/v1 prefix to align with roles.description route grants.
 */

export const API_PREFIX = '/api/v1';

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
  FILES: 'files',
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
 * HTTP method + path → authorization requirement.
 * @type {Record<string, { module: string, action: string }>}
 */
export const API_ACCESS_MAP = Object.freeze({
  // Files
  'POST /api/v1/files': { module: MODULES.FILES, action: ACTIONS.CREATE },
  'POST /api/v1/files/multiple': { module: MODULES.FILES, action: ACTIONS.CREATE },
  'DELETE /api/v1/files/:filePath': { module: MODULES.FILES, action: ACTIONS.DELETE },

  // Users
  'GET /api/v1/users': { module: MODULES.USERS, action: ACTIONS.READ },
  'GET /api/v1/users/:id': { module: MODULES.USERS, action: ACTIONS.READ },
  'PUT /api/v1/users/:id': { module: MODULES.USERS, action: ACTIONS.UPDATE },
  'POST /api/v1/users': { module: MODULES.USERS, action: ACTIONS.CREATE },
  'POST /api/v1/users/:id/status': { module: MODULES.USERS, action: ACTIONS.UPDATE },
  'DELETE /api/v1/users/:id': { module: MODULES.USERS, action: ACTIONS.DELETE },

  // KYC
  'POST /api/v1/kyc': { module: MODULES.KYC, action: ACTIONS.CREATE },
  'GET /api/v1/kyc/my': { module: MODULES.KYC, action: ACTIONS.READ },
  'POST /api/v1/kyc/resubmit': { module: MODULES.KYC, action: ACTIONS.UPDATE },
  'GET /api/v1/kyc': { module: MODULES.KYC, action: ACTIONS.READ },
  'GET /api/v1/kyc/:id': { module: MODULES.KYC, action: ACTIONS.READ },
  'GET /api/v1/kyc/:id/audit': { module: MODULES.KYC, action: ACTIONS.READ },
  'POST /api/v1/kyc/:id/mark-under-review': { module: MODULES.KYC, action: ACTIONS.UPDATE },
  'POST /api/v1/kyc/:id/approve': { module: MODULES.KYC, action: ACTIONS.APPROVE },
  'POST /api/v1/kyc/:id/reject': { module: MODULES.KYC, action: ACTIONS.REJECT },

  // Assets
  'GET /api/v1/assets/my': { module: MODULES.ASSETS, action: ACTIONS.READ },
  'GET /api/v1/assets': { module: MODULES.ASSETS, action: ACTIONS.READ },
  'GET /api/v1/assets/:id': { module: MODULES.ASSETS, action: ACTIONS.READ },
  'POST /api/v1/assets': { module: MODULES.ASSETS, action: ACTIONS.CREATE },
  'PUT /api/v1/assets/:id': { module: MODULES.ASSETS, action: ACTIONS.UPDATE },
  'DELETE /api/v1/assets/:id': { module: MODULES.ASSETS, action: ACTIONS.DELETE },
  'POST /api/v1/assets/:id/approve': { module: MODULES.ASSETS, action: ACTIONS.APPROVE },
  'POST /api/v1/assets/:id/reject': { module: MODULES.ASSETS, action: ACTIONS.REJECT },

  // Evaluations
  'GET /api/v1/evaluations/eligible-assets': { module: MODULES.EVALUATIONS, action: ACTIONS.READ },
  'GET /api/v1/evaluations': { module: MODULES.EVALUATIONS, action: ACTIONS.READ },
  'GET /api/v1/evaluations/:id': { module: MODULES.EVALUATIONS, action: ACTIONS.READ },
  'POST /api/v1/evaluations': { module: MODULES.EVALUATIONS, action: ACTIONS.CREATE },
  'PUT /api/v1/evaluations/:id': { module: MODULES.EVALUATIONS, action: ACTIONS.UPDATE },
  'POST /api/v1/evaluations/:id/start': { module: MODULES.EVALUATIONS, action: ACTIONS.UPDATE },
  'POST /api/v1/evaluations/:id/complete': { module: MODULES.EVALUATIONS, action: ACTIONS.UPDATE },
  'POST /api/v1/evaluations/:id/approve': { module: MODULES.EVALUATIONS, action: ACTIONS.APPROVE },
  'POST /api/v1/evaluations/:id/reject': { module: MODULES.EVALUATIONS, action: ACTIONS.REJECT },
  'POST /api/v1/evaluations/:id/reschedule': { module: MODULES.EVALUATIONS, action: ACTIONS.UPDATE },

  // Auctions
  'GET /api/v1/auctions/browse': { module: MODULES.BIDS, action: ACTIONS.READ },
  'GET /api/v1/auctions/browse/:id/participation': { module: MODULES.BIDS, action: ACTIONS.READ },
  'GET /api/v1/auctions/browse/:id': { module: MODULES.BIDS, action: ACTIONS.READ },
  'GET /api/v1/auctions': { module: MODULES.AUCTIONS, action: ACTIONS.READ },
  'GET /api/v1/auctions/:id': { module: MODULES.AUCTIONS, action: ACTIONS.READ },
  'POST /api/v1/auctions': { module: MODULES.AUCTIONS, action: ACTIONS.CREATE },
  'PUT /api/v1/auctions/:id': { module: MODULES.AUCTIONS, action: ACTIONS.UPDATE },
  'POST /api/v1/auctions/:id/publish': { module: MODULES.AUCTIONS, action: ACTIONS.PUBLISH },
  'POST /api/v1/auctions/:id/suspend': { module: MODULES.AUCTIONS, action: ACTIONS.UPDATE },
  'POST /api/v1/auctions/:id/reactivate': { module: MODULES.AUCTIONS, action: ACTIONS.UPDATE },
  'POST /api/v1/auctions/:id/close': { module: MODULES.AUCTIONS, action: ACTIONS.CLOSE },
  'DELETE /api/v1/auctions/:id': { module: MODULES.AUCTIONS, action: ACTIONS.DELETE },

  // Documents
  'GET /api/v1/documents': { module: MODULES.DOCUMENTS, action: ACTIONS.READ },
  'POST /api/v1/documents': { module: MODULES.DOCUMENTS, action: ACTIONS.CREATE },

  // Payments
  'GET /api/v1/payments': { module: MODULES.PAYMENTS, action: ACTIONS.READ },
  'GET /api/v1/payments/:id': { module: MODULES.PAYMENTS, action: ACTIONS.READ },
  'POST /api/v1/payments': { module: MODULES.PAYMENTS, action: ACTIONS.CREATE },
  'POST /api/v1/payments/:id/approve': { module: MODULES.PAYMENTS, action: ACTIONS.APPROVE },
  'POST /api/v1/payments/:id/reject': { module: MODULES.PAYMENTS, action: ACTIONS.REJECT },

  // CPO
  'GET /api/v1/cpo': { module: MODULES.CPO, action: ACTIONS.READ },
  'GET /api/v1/cpo/:id': { module: MODULES.CPO, action: ACTIONS.READ },
  'POST /api/v1/cpo': { module: MODULES.CPO, action: ACTIONS.CREATE },
  'POST /api/v1/cpo/:id/approve': { module: MODULES.CPO, action: ACTIONS.APPROVE },
  'POST /api/v1/cpo/:id/reject': { module: MODULES.CPO, action: ACTIONS.REJECT },

  // Bids
  'GET /api/v1/bids': { module: MODULES.BIDS, action: ACTIONS.READ },
  'GET /api/v1/bids/my': { module: MODULES.BIDS, action: ACTIONS.READ },
  'GET /api/v1/bids/auction/:auctionId': { module: MODULES.BIDS, action: ACTIONS.READ },
  'GET /api/v1/bids/:id': { module: MODULES.BIDS, action: ACTIONS.READ },
  'POST /api/v1/bids': { module: MODULES.BIDS, action: ACTIONS.CREATE },

  // Winners
  'GET /api/v1/winners': { module: MODULES.WINNERS, action: ACTIONS.READ },
  'GET /api/v1/winners/:id': { module: MODULES.WINNERS, action: ACTIONS.READ },
  'POST /api/v1/winners': { module: MODULES.WINNERS, action: ACTIONS.CREATE },
  'POST /api/v1/winners/:id/confirm': { module: MODULES.WINNERS, action: ACTIONS.UPDATE },
  'POST /api/v1/winners/:id/decline': { module: MODULES.WINNERS, action: ACTIONS.UPDATE },

  // Notifications
  'GET /api/v1/notifications/unread-count': { module: MODULES.NOTIFICATIONS, action: ACTIONS.READ },
  'POST /api/v1/notifications/read-all': { module: MODULES.NOTIFICATIONS, action: ACTIONS.UPDATE },
  'GET /api/v1/notifications': { module: MODULES.NOTIFICATIONS, action: ACTIONS.READ },
  'GET /api/v1/notifications/:id': { module: MODULES.NOTIFICATIONS, action: ACTIONS.READ },
  'POST /api/v1/notifications/:id/read': { module: MODULES.NOTIFICATIONS, action: ACTIONS.UPDATE },

  // Dashboard & reports
  'GET /api/v1/dashboard': { module: MODULES.DASHBOARD, action: ACTIONS.READ },
  'GET /api/v1/dashboard/reports': { module: MODULES.DASHBOARD, action: ACTIONS.READ },
  'GET /api/v1/dashboard/reports/export': { module: MODULES.DASHBOARD, action: ACTIONS.EXPORT },

  // Staff & roles (super-admin operational)
  'GET /api/v1/staff': { module: MODULES.STAFF, action: ACTIONS.READ },
  'GET /api/v1/staff/assignable-roles': { module: MODULES.STAFF, action: ACTIONS.READ },
  'GET /api/v1/staff/:id': { module: MODULES.STAFF, action: ACTIONS.READ },
  'POST /api/v1/staff': { module: MODULES.STAFF, action: ACTIONS.CREATE },
  'PUT /api/v1/staff/:id': { module: MODULES.STAFF, action: ACTIONS.UPDATE },
  'POST /api/v1/staff/:id/deactivate': { module: MODULES.STAFF, action: ACTIONS.UPDATE },
  'DELETE /api/v1/staff/:id': { module: MODULES.STAFF, action: ACTIONS.DELETE },
  'GET /api/v1/roles': { module: MODULES.ROLES, action: ACTIONS.READ },
  'PUT /api/v1/roles/:id': { module: MODULES.ROLES, action: ACTIONS.UPDATE },
  'GET /api/v1/audit-logs': { module: MODULES.ROLES, action: ACTIONS.READ },
  'GET /api/v1/audit-logs/entity/:entityType/:entityId': { module: MODULES.ROLES, action: ACTIONS.READ },
  'GET /api/v1/audit-logs/:id': { module: MODULES.ROLES, action: ACTIONS.READ },

  // Settings
  'GET /api/v1/settings': { module: MODULES.SETTINGS, action: ACTIONS.READ },
  'PUT /api/v1/settings': { module: MODULES.SETTINGS, action: ACTIONS.UPDATE },

  // Auth session (authenticated, no module gate)
  'GET /api/v1/auth/me': { module: null, action: null },
});

/**
 * Frontend page registry — drives sidebar and route guards.
 * @type {Array<{ id: string, label: string, path: string, module: string, action: string, icon?: string, group?: string }>}
 */
export const PAGE_ACCESS_REGISTRY = Object.freeze([
  { id: 'dashboard', label: 'Dashboard', path: '/app/dashboard', module: MODULES.DASHBOARD, action: ACTIONS.READ, group: 'main' },

  { id: 'users', label: 'Users', path: '/app/users', module: MODULES.USERS, action: ACTIONS.READ, group: 'admin' },
  { id: 'staff', label: 'Staff', path: '/app/staff', module: MODULES.STAFF, action: ACTIONS.READ, group: 'admin' },
  { id: 'roles', label: 'Roles', path: '/app/roles', module: MODULES.ROLES, action: ACTIONS.READ, group: 'admin' },
  { id: 'settings', label: 'Settings', path: '/app/settings', module: MODULES.SETTINGS, action: ACTIONS.READ, group: 'admin' },

  { id: 'kyc', label: 'KYC', path: '/app/kyc', module: MODULES.KYC, action: ACTIONS.READ, group: 'operations' },
  { id: 'assets', label: 'Auction Requests', path: '/app/assets', module: MODULES.ASSETS, action: ACTIONS.READ, group: 'operations' },
  { id: 'my-assets', label: 'My Auction Requests', path: '/app/my-assets', module: MODULES.ASSETS, action: ACTIONS.READ, group: 'owner' },
  { id: 'evaluations', label: 'Evaluations', path: '/app/evaluations', module: MODULES.EVALUATIONS, action: ACTIONS.READ, group: 'operations' },

  { id: 'auctions', label: 'Auctions', path: '/app/auctions', module: MODULES.AUCTIONS, action: ACTIONS.READ, group: 'auction' },
  { id: 'browse-auctions', label: 'Browse Auctions', path: '/app/browse-auctions', module: MODULES.BIDS, action: ACTIONS.READ, group: 'bidder' },
  { id: 'auction-detail', label: 'Auction Details', path: '/app/auctions/:id', module: MODULES.BIDS, action: ACTIONS.READ, group: 'bidder' },
  { id: 'documents', label: 'Documents', path: '/app/documents', module: MODULES.DOCUMENTS, action: ACTIONS.READ, group: 'auction' },
  { id: 'bids', label: 'Bids', path: '/app/bids', module: MODULES.BIDS, action: ACTIONS.READ, group: 'auction' },
  { id: 'my-bids', label: 'My Bids', path: '/app/my-bids', module: MODULES.BIDS, action: ACTIONS.READ, group: 'bidder' },
  { id: 'winners', label: 'Winners', path: '/app/winners', module: MODULES.WINNERS, action: ACTIONS.READ, group: 'auction' },

  { id: 'payments', label: 'Payments', path: '/app/payments', module: MODULES.PAYMENTS, action: ACTIONS.READ, group: 'finance' },
  { id: 'cpo', label: 'CPO', path: '/app/cpo', module: MODULES.CPO, action: ACTIONS.READ, group: 'operations' },
  { id: 'reports', label: 'Reports', path: '/app/reports', module: MODULES.DASHBOARD, action: ACTIONS.EXPORT, group: 'finance' },
  { id: 'notifications', label: 'Notifications', path: '/app/notifications', module: MODULES.NOTIFICATIONS, action: ACTIONS.READ, group: 'bidder' },
  { id: 'profile', label: 'Profile', path: '/app/profile', module: MODULES.USERS, action: ACTIONS.READ, group: 'account' },
]);

/**
 * Data-scope rules per module for row-level filtering.
 */
export const DATA_SCOPE_RULES = Object.freeze({
  [MODULES.BIDS]: 'own_user',
  [MODULES.ASSETS]: 'own_asset_owner',
  [MODULES.PAYMENTS]: 'own_user_or_finance',
  [MODULES.CPO]: 'own_user_or_staff',
  [MODULES.NOTIFICATIONS]: 'staff_module',
  [MODULES.EVALUATIONS]: 'staff_module',
  [MODULES.AUCTIONS]: 'staff_module',
  [MODULES.WINNERS]: 'staff_module',
  [MODULES.KYC]: 'staff_module',
  [MODULES.USERS]: 'staff_module',
  [MODULES.STAFF]: 'staff_module',
  [MODULES.ROLES]: 'staff_module',
});

/**
 * Resolve API access requirement from method + normalized path.
 * @param {string} method
 * @param {string} path
 */
export function resolveApiAccess(method, path) {
  const signature = `${method.toUpperCase()} ${path}`;

  if (API_ACCESS_MAP[signature]) {
    return API_ACCESS_MAP[signature];
  }

  const entries = Object.entries(API_ACCESS_MAP);
  for (const [pattern, requirement] of entries) {
    const [patternMethod, patternPath] = pattern.split(' ');
    if (patternMethod !== method.toUpperCase()) {
      continue;
    }

    const regex = new RegExp(`^${patternPath.replace(/:[^/]+/g, '[^/]+')}$`);
    if (regex.test(path)) {
      return requirement;
    }
  }

  return null;
}

export default {
  API_PREFIX,
  MODULES,
  ACTIONS,
  API_ACCESS_MAP,
  PAGE_ACCESS_REGISTRY,
  DATA_SCOPE_RULES,
  resolveApiAccess,
};
