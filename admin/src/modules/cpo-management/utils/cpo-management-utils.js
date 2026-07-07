import { formatDate } from '@enderass/shared/utils';
export const CPO_PAGE_SIZE = 20;

export const CPO_TAB_KEYS = Object.freeze(['all', 'pending', 'approved', 'rejected']);

export const CPO_TABLE_COLUMNS = Object.freeze([
  'bidder_name',
  'auction_title',
  'status',
  'deposit_amount',
  'refund_status',
  'expiry_date',
  'created_at',
  'actions',
]);

export function getCpoStatusVariant(status) {
  switch (status) {
    case 'approved':
      return 'active';
    case 'pending':
      return 'pending';
    case 'rejected':
      return 'rejected';
    default:
      return 'default';
  }
}

export function getRefundStatusVariant(refundStatus) {
  switch (refundStatus) {
    case 'paid':
      return 'active';
    case 'pending':
      return 'pending';
    case 'approved':
      return 'active';
    case 'none':
      return 'default';
    default:
      return 'default';
  }
}

export { formatDate };
