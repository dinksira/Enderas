/**
 * Frontend permission evaluation — mirrors backend policy.engine.js
 */
import { canAccess, hasWildcardAccess } from '../utils/permissions.js';
import { normalizeEndUserRoleCode } from './constants/end-user-role.constants.js';

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

const DEFAULT_PAGE_META = Object.freeze({
  titleKey: 'dashboard.page.fallbackTitle',
  subtitleKey: 'dashboard.page.fallbackSubtitle',
  searchPlaceholderKey: 'admin.searchPlaceholder',
  searchEnabled: false,
});

export const PAGE_REGISTRY = Object.freeze([
  {
    id: 'auctions',
    label: 'Auctions',
    path: '/app/auctions',
    module: MODULES.AUCTIONS,
    action: ACTIONS.READ,
    group: 'auction',
    titleKey: 'auctions.management.pageTitle',
    subtitleKey: 'auctions.management.subtitle',
    searchPlaceholderKey: 'auctions.management.searchPlaceholder',
    searchEnabled: true,
  },
  {
    id: 'kyc',
    label: 'KYC Verification',
    path: '/app/kyc',
    module: MODULES.KYC,
    action: ACTIONS.READ,
    group: 'operations',
    titleKey: 'kyc.management.pageTitle',
    subtitleKey: 'kyc.managementSubtitle',
    searchPlaceholderKey: 'kyc.management.searchPlaceholder',
    searchEnabled: true,
  },
  {
    id: 'users',
    label: 'Users',
    path: '/app/users',
    module: MODULES.USERS,
    action: ACTIONS.READ,
    group: 'admin',
    titleKey: 'users.management.pageTitle',
    subtitleKey: 'users.management.subtitle',
    searchPlaceholderKey: 'users.management.searchPlaceholder',
    searchEnabled: true,
  },
  {
    id: 'staff',
    label: 'Staff Management',
    path: '/app/staff',
    module: MODULES.STAFF,
    action: ACTIONS.READ,
    group: 'admin',
    titleKey: 'staff.management.pageTitle',
    subtitleKey: 'staff.management.subtitle',
    searchPlaceholderKey: 'staff.management.searchPlaceholder',
    searchEnabled: true,
  },
  {
    id: 'assets',
    label: 'Asset Requests',
    path: '/app/assets',
    module: MODULES.ASSETS,
    action: ACTIONS.READ,
    group: 'operations',
    titleKey: 'assets.management.pageTitle',
    subtitleKey: 'assets.management.subtitle',
    searchPlaceholderKey: 'assets.review.searchPlaceholder',
    searchEnabled: true,
  },
  {
    id: 'evaluations',
    label: 'Evaluations',
    path: '/app/evaluations',
    module: MODULES.EVALUATIONS,
    action: ACTIONS.READ,
    group: 'operations',
    titleKey: 'evaluations.management.pageTitle',
    subtitleKey: 'evaluations.management.subtitle',
    searchPlaceholderKey: 'evaluations.management.searchPlaceholder',
    searchEnabled: true,
  },
  {
    id: 'payments',
    label: 'Payments',
    path: '/app/payments',
    module: MODULES.PAYMENTS,
    action: ACTIONS.READ,
    group: 'finance',
    titleKey: 'payments.management.pageTitle',
    subtitleKey: 'payments.management.subtitle',
    searchPlaceholderKey: 'payments.management.searchPlaceholder',
    searchEnabled: true,
  },
  {
    id: 'cpo',
    label: 'CPO Management',
    path: '/app/cpo',
    module: MODULES.CPO,
    action: ACTIONS.READ,
    group: 'operations',
    titleKey: 'cpo.management.pageTitle',
    subtitleKey: 'cpo.management.subtitle',
    searchPlaceholderKey: 'cpo.management.searchPlaceholder',
    searchEnabled: true,
  },
  {
    id: 'bids',
    label: 'Bid Management',
    path: '/app/bids',
    module: MODULES.BIDS,
    action: ACTIONS.READ,
    group: 'auction',
    titleKey: 'bids.management.pageTitle',
    subtitleKey: 'bids.management.subtitle',
    searchPlaceholderKey: 'bids.management.searchPlaceholder',
    searchEnabled: true,
  },
  {
    id: 'winners',
    label: 'Winners',
    path: '/app/winners',
    module: MODULES.WINNERS,
    action: ACTIONS.READ,
    group: 'auction',
    titleKey: 'winners.management.pageTitle',
    subtitleKey: 'winners.management.subtitle',
    searchPlaceholderKey: 'winners.management.searchPlaceholder',
    searchEnabled: true,
  },
  {
    id: 'reports',
    label: 'Reports & Analytics',
    path: '/app/reports',
    module: MODULES.DASHBOARD,
    action: ACTIONS.EXPORT,
    group: 'finance',
    titleKey: 'reports.pageTitle',
    subtitleKey: 'reports.subtitle',
    searchPlaceholderKey: 'admin.searchPlaceholder',
    searchEnabled: false,
  },
  {
    id: 'roles',
    label: 'Audit Trail',
    path: '/app/roles',
    module: MODULES.ROLES,
    action: ACTIONS.READ,
    group: 'admin',
    titleKey: 'audit.trail.pageTitle',
    subtitleKey: 'audit.trail.subtitle',
    searchPlaceholderKey: 'audit.trail.searchPlaceholder',
    searchEnabled: true,
  },
  {
    id: 'settings',
    label: 'System Settings',
    path: '/app/settings',
    module: MODULES.SETTINGS,
    action: ACTIONS.READ,
    group: 'admin',
    titleKey: 'settings.pageTitle',
    subtitleKey: 'settings.subtitle',
    searchPlaceholderKey: 'admin.searchPlaceholder',
    searchEnabled: false,
  },
  {
    id: 'profile',
    label: 'Profile',
    path: '/app/profile',
    module: MODULES.USERS,
    action: ACTIONS.READ,
    group: 'account',
    titleKey: 'users.profile.pageTitle',
    subtitleKey: 'users.profile.subtitle',
    searchPlaceholderKey: 'users.profile.searchPlaceholder',
    searchEnabled: true,
  },
  {
    id: 'browse-auctions',
    label: 'Browse Auctions',
    path: '/app/browse-auctions',
    module: MODULES.BIDS,
    action: ACTIONS.READ,
    group: 'bidder',
    titleKey: 'bidder.browse.title',
    subtitleKey: 'bidder.browse.subtitle',
    searchPlaceholderKey: 'bidder.browse.searchPlaceholder',
    searchEnabled: true,
  },
  {
    id: 'my-bids',
    label: 'My Bids',
    path: '/app/my-bids',
    module: MODULES.BIDS,
    action: ACTIONS.READ,
    group: 'bidder',
    titleKey: 'bids.myBids.pageTitle',
    subtitleKey: 'bids.myBids.subtitle',
    searchPlaceholderKey: 'bids.myBids.searchPlaceholder',
    searchEnabled: true,
  },
  {
    id: 'my-payments',
    label: 'My Payments',
    path: '/app/my-payments',
    module: MODULES.PAYMENTS,
    action: ACTIONS.READ,
    group: 'bidder',
    titleKey: 'payments.my.pageTitle',
    subtitleKey: 'payments.my.subtitle',
    searchPlaceholderKey: 'payments.my.searchPlaceholder',
    searchEnabled: true,
  },
  {
    id: 'my-cpo',
    label: 'My CPO',
    path: '/app/my-cpo',
    module: MODULES.CPO,
    action: ACTIONS.READ,
    group: 'bidder',
    titleKey: 'cpo.my.pageTitle',
    subtitleKey: 'cpo.my.subtitle',
    searchPlaceholderKey: 'cpo.my.searchPlaceholder',
    searchEnabled: true,
  },
  {
    id: 'my-assets',
    label: 'My Asset Requests',
    path: '/app/my-assets',
    module: MODULES.ASSETS,
    action: ACTIONS.READ,
    group: 'owner',
    titleKey: 'assets.my.title',
    subtitleKey: 'assets.my.subtitle',
    searchPlaceholderKey: 'assets.my.searchPlaceholder',
    searchEnabled: true,
  },
]);

export const EXTRA_PAGE_REGISTRY = Object.freeze([
  {
    id: 'notifications',
    path: '/app/notifications',
    titleKey: 'notifications.center.pageTitle',
    subtitleKey: 'notifications.center.subtitle',
    searchPlaceholderKey: 'notifications.center.searchPlaceholder',
    searchEnabled: true,
  },
  {
    id: 'documents',
    path: '/app/documents',
    titleKey: 'documents.management.pageTitle',
    subtitleKey: 'documents.management.subtitle',
    searchPlaceholderKey: 'admin.searchPlaceholder',
    searchEnabled: false,
  },
  {
    id: 'dashboard',
    path: '/app/dashboard',
    titleKey: 'dashboard.page.fallbackTitle',
    subtitleKey: 'dashboard.page.fallbackSubtitle',
    searchPlaceholderKey: 'admin.searchPlaceholder',
    searchEnabled: false,
  },
  {
    id: 'access-denied',
    path: '/app/access-denied',
    titleKey: 'accessDenied.pageTitle',
    subtitleKey: 'accessDenied.subtitle',
    searchPlaceholderKey: 'admin.searchPlaceholder',
    searchEnabled: false,
  },
]);

export const ROLE_NAV_GROUPS = Object.freeze({
  bidder: ['bidder', 'owner', 'account'],
});

export const STAFF_NAV_GROUPS = Object.freeze([
  'admin',
  'auction',
  'operations',
  'finance',
  'main',
  'account',
]);

export const ROLE_DEFAULT_ROUTES = Object.freeze({
  super_admin: '/app/auctions',
  auction_manager: '/app/auctions',
  evaluation_officer: '/app/evaluations',
  finance_officer: '/app/auctions',
  customer_service_officer: '/app/auctions',
  bidder: '/app/browse-auctions',
});

export function canAccessPage(permissions, moduleName, actionName = ACTIONS.READ) {
  return canAccess(permissions, moduleName, actionName);
}

export function resolveNavigation(permissions, registry = PAGE_REGISTRY) {
  if (!permissions) {
    return [];
  }

  let items = hasWildcardAccess(permissions)
    ? [...registry]
    : registry.filter((item) => canAccess(permissions, item.module, item.action));

  const roleCode = normalizeEndUserRoleCode(permissions.roleCode);
  const allowedGroups = ROLE_NAV_GROUPS[roleCode] ?? STAFF_NAV_GROUPS;
  items = items.filter((item) => !item.group || allowedGroups.includes(item.group));

  return items;
}

export function resolveDefaultRoute(roleCode) {
  const normalizedRoleCode = normalizeEndUserRoleCode(roleCode);
  return ROLE_DEFAULT_ROUTES[normalizedRoleCode] ?? '/app/dashboard';
}

const PAGE_META_ENTRIES = [...PAGE_REGISTRY, ...EXTRA_PAGE_REGISTRY].sort(
  (a, b) => b.path.length - a.path.length,
);

export function resolvePageMeta(pathname) {
  const normalizedPath = String(pathname || '').replace(/\/+$/, '') || '/';
  const match = PAGE_META_ENTRIES.find(
    (entry) => normalizedPath === entry.path || normalizedPath.startsWith(`${entry.path}/`),
  );

  if (!match) {
    return { ...DEFAULT_PAGE_META };
  }

  return {
    titleKey: match.titleKey ?? DEFAULT_PAGE_META.titleKey,
    subtitleKey: match.subtitleKey ?? DEFAULT_PAGE_META.subtitleKey,
    searchPlaceholderKey: match.searchPlaceholderKey ?? DEFAULT_PAGE_META.searchPlaceholderKey,
    searchEnabled: match.searchEnabled ?? DEFAULT_PAGE_META.searchEnabled,
  };
}

export default {
  MODULES,
  ACTIONS,
  PAGE_REGISTRY,
  EXTRA_PAGE_REGISTRY,
  ROLE_NAV_GROUPS,
  STAFF_NAV_GROUPS,
  ROLE_DEFAULT_ROUTES,
  canAccessPage,
  resolveNavigation,
  resolveDefaultRoute,
  resolvePageMeta,
};
