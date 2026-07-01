import { useCallback, useEffect, useState } from 'react';
import { useAuthStore } from '@enderass/shared/auth';
import { assetService } from '@enderass/shared/services';
function normalizeAssetList(data) {
  if (Array.isArray(data?.items)) {
    return { items: data.items, stats: data.stats ?? null };
  }
  if (Array.isArray(data)) {
    return { items: data, stats: null };
  }
  return { items: [], stats: null };
}

export function useAssets({ enabled = true, status, search, includeStats = false } = {}) {
  const accessToken = useAuthStore((state) => state.accessToken);
  const isAuthenticated = useAuthStore((state) => state.status === 'authenticated');
  const [records, setRecords] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchRecords = useCallback(async () => {
    if (!enabled || !isAuthenticated || !accessToken) {
      setRecords([]);
      setStats(null);
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await assetService.getAll({ status, search, includeStats });
      const normalized = normalizeAssetList(data);
      setRecords(normalized.items);
      setStats(normalized.stats);
    } catch (err) {
      setRecords([]);
      setStats(null);
      setError(err instanceof Error ? err.message : 'Failed to load assets');
    } finally {
      setLoading(false);
    }
  }, [enabled, isAuthenticated, accessToken, status, search, includeStats]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  return { records, stats, loading, error, refetch: fetchRecords };
}

export default useAssets;
