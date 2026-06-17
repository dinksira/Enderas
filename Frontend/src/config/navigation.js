import { ROUTES } from './routes.js';

export const NAVIGATION_LINKS = Object.freeze([
  { label: 'Marketplace', path: ROUTES.MARKETPLACE },
  { label: 'My Bids', path: ROUTES.BIDDER_DASHBOARD },
  { label: 'Operations', path: ROUTES.OPERATIONAL_PANEL },
]);

export const NAVIGATION_BRAND = Object.freeze({
  label: 'Enderas Auction Management',
  homePath: ROUTES.HOME,
});

export default NAVIGATION_LINKS;
