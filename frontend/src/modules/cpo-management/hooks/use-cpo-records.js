import { useCallback } from 'react';
import { usePaginatedResource } from '../../../hooks/use-paginated-resource.js';
import { cpoService } from '../services/cpo-service.js';
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
