import { useCallback } from 'react';
import { usePaginatedResource } from '@enderass/shared/hooks';
import { staffService } from '@enderass/shared/services';

const PAGE_SIZE = 20;

export const STAFF_TAB_KEYS = Object.freeze(['all', 'active', 'inactive']);

export const STAFF_TABLE_COLUMNS = Object.freeze([
  'display_name',
  'role',
  'status',
  'created_at',
  'actions',
]);

export function useStaff() {
  const fetchFn = useCallback(async (params) => {
    const { tab, ...rest } = params;
    let isActive;

    if (tab === 'active') {
      isActive = true;
    } else if (tab === 'inactive') {
      isActive = false;
    }

    const response = await staffService.listStaff({
      ...rest,
      isActive,
    });

    return {
      items: response?.staff ?? [],
      pagination: response?.pagination,
      stats: response?.stats,
    };
  }, []);

  return usePaginatedResource({
    fetchFn,
    pageSize: PAGE_SIZE,
    initialTab: 'all',
    itemsKey: 'items',
    loadFailedKey: 'staff.management.loadFailed',
  });
}

export default useStaff;
