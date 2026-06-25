import { formatDate } from '../../users/utils/user-management-utils.js';

export const WINNER_PAGE_SIZE = 20;

export const WINNER_TAB_KEYS = Object.freeze([
  'all',
  'pending_confirmation',
  'confirmed',
  'declined',
]);

export const WINNER_TABLE_COLUMNS = Object.freeze([
  'auction_title',
  'winner_name',
  'status',
  'selected_at',
  'selected_by',
  'actions',
]);

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
