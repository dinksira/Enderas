import { useCallback, useEffect, useState } from 'react';
import { staffRoleService } from '@enderass/shared/services';

export function useStaffRoles() {
  const [records, setRecords] = useState([]);
  const [permissionCatalog, setPermissionCatalog] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await staffRoleService.getAll();
      setRecords(Array.isArray(data?.items) ? data.items : []);
      setPermissionCatalog(data?.permissionCatalog ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load records.');
      setRecords([]);
      setPermissionCatalog(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  return { records, permissionCatalog, loading, error, refetch: fetchRecords };
}

export default useStaffRoles;
