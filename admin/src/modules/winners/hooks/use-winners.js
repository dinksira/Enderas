import { useCallback } from 'react';
import { usePaginatedResource } from '@enderass/shared/hooks';
import { winnerService } from '@enderass/shared/services';
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
