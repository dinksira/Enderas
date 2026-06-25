import { useCallback } from 'react';
import { usePaginatedResource } from '../../../hooks/use-paginated-resource.js';
import { bidService } from '../services/bid-service.js';
import { BID_PAGE_SIZE } from '../utils/bid-management-utils.js';

export function useBids(extraParams = {}) {
  const fetchFn = useCallback(
    async (params) => {
      const response = await bidService.listBids({ ...params, ...extraParams });
      return {
        items: response?.items ?? [],
        pagination: response?.pagination,
      };
    },
    [extraParams],
  );

  return usePaginatedResource({
    fetchFn,
    pageSize: BID_PAGE_SIZE,
    itemsKey: 'items',
    initialTab: 'all',
  });
}

export function useMyBids() {
  const fetchFn = useCallback(async (params) => {
    const response = await bidService.listMyBids(params);
    return {
      items: response?.items ?? [],
      pagination: response?.pagination,
    };
  }, []);

  return usePaginatedResource({
    fetchFn,
    pageSize: BID_PAGE_SIZE,
    itemsKey: 'items',
    initialTab: 'all',
  });
}

export default useBids;
