import { useCallback } from 'react';
import { usePaginatedResource } from '@enderass/shared/hooks';
import { evaluationService } from '@enderass/shared/services';
import { EVALUATION_PAGE_SIZE } from '../utils/evaluation-management-utils.js';

export function useEvaluations({ initialTab = 'all' } = {}) {
  const fetchFn = useCallback(async (params) => {
    const response = await evaluationService.listEvaluations(params);
    return {
      items: response?.items ?? [],
      pagination: response?.pagination,
      stats: response?.stats,
    };
  }, []);

  return usePaginatedResource({
    fetchFn,
    pageSize: EVALUATION_PAGE_SIZE,
    itemsKey: 'items',
    initialTab,
  });
}

export default useEvaluations;
