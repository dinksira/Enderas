export const ROUTES = Object.freeze({
  HOME: '/',
  LOGIN: '/',

  // Legacy aliases (mapped to domain modules)
  MARKETPLACE: '/auctions',
  BIDDER_DASHBOARD: '/bid-management',
  OPERATIONAL_PANEL: '/analytics-report',

  // Domain module routes
  AUCTIONS: '/auctions',
  ASSET_REQUEST: '/asset-request',
  USERS: '/users',
  STAFF_ROLES: '/staff-roles',
  PAYMENTS: '/payments',
  CPO_MANAGEMENT: '/cpo-management',
  BID_MANAGEMENT: '/bid-management',
  ANALYTICS_REPORT: '/analytics-report',
  SETTING: '/setting',
});

export default ROUTES;
