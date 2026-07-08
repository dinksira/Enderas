import { useCallback, useEffect, useState } from 'react';
import { useAuthStore } from '@enderass/shared/auth';
import { assetService } from '../services/asset-service.js';

function normalizeAssetList(data) {
  if (Array.isArray(data?.items)) {
    return data.items;
  }
  if (Array.isArray(data)) {
    return data;
  }
  return [];
}

export function useMyAssets({ enabled = true } = {}) {
  const accessToken = useAuthStore((state) => state.accessToken);
  const isAuthenticated = useAuthStore((state) => state.status === 'authenticated');
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchRecords = useCallback(async () => {
    if (!enabled || !isAuthenticated || !accessToken) {
      setRecords([]);
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await assetService.getMy();
      setRecords(normalizeAssetList(data));
    } catch (err) {
      setRecords([]);
      setError(err instanceof Error ? err.message : 'Failed to load assets');
    } finally {
      setLoading(false);
    }
  }, [enabled, isAuthenticated, accessToken]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  return { records, loading, error, refetch: fetchRecords };
}

export default useMyAssets;
