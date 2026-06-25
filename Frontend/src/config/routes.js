export const ROUTES = Object.freeze({
  HOME: '/',
  LOGIN: '/',
  REGISTER: '/register',
  OTP_VERIFICATION: '/verify-otp',
  KYC_VERIFICATION: '/complete-profile',
  KYC_UNDER_REVIEW: '/kyc-under-review',
  KYC_REJECTED: '/kyc-rejected',

  // Legacy aliases
  MARKETPLACE: '/app/browse-auctions',
  BIDDER_DASHBOARD: '/app/my-bids',
  OPERATIONAL_PANEL: '/app/reports',

  // App shell (RBAC-protected)
  APP_DASHBOARD: '/app/dashboard',
  APP_USERS: '/app/users',
  APP_STAFF: '/app/staff',
  APP_ROLES: '/app/roles',
  APP_SETTINGS: '/app/settings',
  APP_KYC: '/app/kyc',
  APP_ASSETS: '/app/assets',
  APP_MY_ASSETS: '/app/my-assets',
  APP_SUBMIT_ASSET: '/app/submit-asset',
  APP_EVALUATIONS: '/app/evaluations',
  APP_AUCTIONS: '/app/auctions',
  APP_BROWSE_AUCTIONS: '/app/browse-auctions',
  APP_DOCUMENTS: '/app/documents',
  APP_BIDS: '/app/bids',
  APP_MY_BIDS: '/app/my-bids',
  APP_WINNERS: '/app/winners',
  APP_PAYMENTS: '/app/payments',
  APP_MY_PAYMENTS: '/app/my-payments',
  APP_CPO: '/app/cpo',
  APP_MY_CPO: '/app/my-cpo',
  APP_REPORTS: '/app/reports',
  APP_NOTIFICATIONS: '/app/notifications',
  APP_PROFILE: '/app/profile',
  APP_ACCESS_DENIED: '/app/access-denied',

  // Deprecated standalone routes (redirect targets)
  AUCTIONS: '/app/auctions',
  ASSET_REQUEST: '/app/submit-asset',
  USERS: '/app/users',
  STAFF_ROLES: '/app/roles',
  PAYMENTS: '/app/payments',
  CPO_MANAGEMENT: '/app/cpo',
  BID_MANAGEMENT: '/app/my-bids',
  ANALYTICS_REPORT: '/app/reports',
  SETTING: '/app/settings',
});

export default ROUTES;
