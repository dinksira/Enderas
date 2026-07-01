import { useCallback } from 'react';
import { usePaginatedResource } from '@enderass/shared/hooks';
import { paymentService } from '@enderass/shared/services';
import { PAYMENT_PAGE_SIZE } from '../utils/payment-management-utils.js';

export function usePayments() {
  const fetchFn = useCallback(async (params) => {
    const response = await paymentService.listPayments(params);
    return {
      items: response?.items ?? [],
      pagination: response?.pagination,
      stats: response?.stats,
    };
  }, []);

  return usePaginatedResource({
    fetchFn,
    pageSize: PAYMENT_PAGE_SIZE,
    itemsKey: 'items',
  });
}

export default usePayments;
