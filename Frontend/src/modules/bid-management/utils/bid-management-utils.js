import { formatDate } from '../../users/utils/user-management-utils.js';

export const BID_PAGE_SIZE = 20;

export const BID_TABLE_COLUMNS = Object.freeze([
  'bidder_name',
  'auction_title',
  'amount',
  'status',
  'submitted_at',
  'actions',
]);

export const MY_BID_TABLE_COLUMNS = Object.freeze([
  'auction_title',
  'amount',
  'status',
  'submitted_at',
  'actions',
]);

export function getBidStatusVariant(status) {
  switch (status) {
    case 'submitted':
      return 'pending';
    case 'winning':
      return 'active';
    case 'lost':
      return 'default';
    case 'invalid':
      return 'rejected';
    default:
      return 'default';
  }
}

export { formatDate };
