import { formatDate } from '@enderass/shared/utils';
export const PAYMENT_PAGE_SIZE = 20;

export const PAYMENT_TAB_KEYS = Object.freeze(['all', 'pending', 'approved', 'rejected']);

export const PAYMENT_TABLE_COLUMNS = Object.freeze([
  'payer_name',
  'auction_title',
  'amount',
  'payment_method',
  'status',
  'paid_at',
  'actions',
]);

export function getPaymentStatusVariant(status) {
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

export { formatDate };
