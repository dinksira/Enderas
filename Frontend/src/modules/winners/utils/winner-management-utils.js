import { formatDate } from '../../users/utils/user-management-utils.js';
import { formatEtbAmount } from '../../auctions/utils/auction-drawer-utils.js';

export const WINNER_PAGE_SIZE = 20;

export const WINNER_TAB_KEYS = Object.freeze([
  'all',
  'pending_confirmation',
  'confirmed',
  'declined',
  'replaced',
]);

export const WINNER_TABLE_COLUMNS = Object.freeze([
  'auction',
  'category',
  'winner',
  'mobile',
  'amount',
  'selectedAt',
  'status',
  'actions',
]);

const BID_AMOUNT_VIEWER_ROLES = Object.freeze(['super_admin', 'auction_manager']);

export function canViewBidAmounts(roleCode) {
  return BID_AMOUNT_VIEWER_ROLES.includes(String(roleCode || ''));
}

export function formatWinnerAmount(amount, roleCode, t) {
  if (canViewBidAmounts(roleCode) && amount != null) {
    return formatEtbAmount(amount);
  }
  return t('winners.management.amount.restricted');
}

export function getWinnerStatusVariant(status) {
  switch (status) {
    case 'confirmed':
      return 'active';
    case 'pending_confirmation':
      return 'pending';
    case 'declined':
      return 'rejected';
    case 'replaced':
      return 'under-review';
    default:
      return 'default';
  }
}

export { formatDate };
