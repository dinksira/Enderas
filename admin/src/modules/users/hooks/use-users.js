import { useCallback } from 'react';
import { usePaginatedResource } from '@enderass/shared/hooks';
import { userService } from '@enderass/shared/services';
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
