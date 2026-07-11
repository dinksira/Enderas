import { useCallback } from 'react';
import { usePaginatedResource } from '@enderass/shared/hooks';
import { organizationService } from '@enderass/shared/services';
import { ORG_PAGE_SIZE } from '../utils/organization-utils.js';

export function useOrganizations() {
  const fetchFn = useCallback(async (params) => {
    const { tab, ...rest } = params;
    let status;

    if (tab === 'kyc_pending') {
      status = 'kyc_pending';
    } else if (tab === 'active') {
      status = 'active';
    } else if (tab === 'suspended') {
      status = 'suspended';
    }

    const response = await organizationService.listOrganizations({
      ...rest,
      status,
    });

    return {
      items: response?.organizations ?? [],
      pagination: response?.pagination,
      stats: response?.stats,
    };
  }, []);

  return usePaginatedResource({
    fetchFn,
    pageSize: ORG_PAGE_SIZE,
    itemsKey: 'items',
    loadFailedKey: 'organizations.management.loadFailed',
  });
}

export default useOrganizations;
