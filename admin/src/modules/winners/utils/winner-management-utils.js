import { formatDate } from '@enderass/shared/utils';
import {
  canViewBidAmounts,
  formatWinnerAmount,
  getWinnerStatusVariant,
} from '@enderass/shared/utils';

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

export { canViewBidAmounts, formatWinnerAmount, getWinnerStatusVariant };

export { formatDate };
