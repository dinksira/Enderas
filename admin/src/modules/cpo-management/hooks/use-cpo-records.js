import { useCallback } from 'react';
import { usePaginatedResource } from '@enderass/shared/hooks';
import { cpoService } from '@enderass/shared/services';
import { CPO_PAGE_SIZE } from '../utils/cpo-management-utils.js';

export function useCpoRecords() {
  const fetchFn = useCallback(async (params) => {
    const response = await cpoService.listCpos(params);
    return {
      items: response?.items ?? [],
      pagination: response?.pagination,
      stats: response?.stats,
    };
  }, []);

  return usePaginatedResource({
    fetchFn,
    pageSize: CPO_PAGE_SIZE,
    itemsKey: 'items',
  });
}

export default useCpoRecords;
