import { useCallback } from 'react';
import { usePaginatedResource } from '../../../hooks/use-paginated-resource.js';
import { userService } from '../services/user-service.js';
import { USER_PAGE_SIZE } from '../utils/user-management-utils.js';

export function useUsers() {
  const fetchFn = useCallback(async (params) => {
    const response = await userService.listUsers(params);
    return {
      items: response?.users ?? [],
      pagination: response?.pagination,
      stats: response?.stats,
    };
  }, []);

  return usePaginatedResource({
    fetchFn,
    pageSize: USER_PAGE_SIZE,
    itemsKey: 'items',
  });
}

export default useUsers;
