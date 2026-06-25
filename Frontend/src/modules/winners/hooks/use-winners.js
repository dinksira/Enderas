import { useCallback } from 'react';
import { usePaginatedResource } from '../../../hooks/use-paginated-resource.js';
import { winnerService } from '../services/winner-service.js';
import { WINNER_PAGE_SIZE } from '../utils/winner-management-utils.js';

export function useWinners() {
  const fetchFn = useCallback(async (params) => {
    const response = await winnerService.listWinners(params);
    return {
      items: response?.items ?? [],
      pagination: response?.pagination,
      stats: response?.stats,
    };
  }, []);

  return usePaginatedResource({
    fetchFn,
    pageSize: WINNER_PAGE_SIZE,
    itemsKey: 'items',
  });
}

export default useWinners;
