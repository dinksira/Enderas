import { useCallback } from 'react';
import { usePaginatedResource } from '../../../hooks/use-paginated-resource.js';
import { evaluationService } from '../services/evaluation-service.js';
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
