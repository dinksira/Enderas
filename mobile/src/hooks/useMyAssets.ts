import { useCallback, useEffect, useState } from 'react';

import { getMyAssets } from '@/services/assetApi';
import type { AssetRecord } from '@/types/asset';

interface UseMyAssetsResult {
  assets: AssetRecord[];
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useMyAssets(): UseMyAssetsResult {
  const [assets, setAssets] = useState<AssetRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async (isPull = false) => {
    if (isPull) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const data = await getMyAssets();
      setAssets(Array.isArray(data.items) ? data.items : []);
    } catch (err) {
      setAssets([]);
      setError(err instanceof Error ? err.message : 'Failed to load assets');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      void refresh();
    }, 0);

    return () => clearTimeout(timer);
  }, [refresh]);

  const pullRefresh = useCallback(() => refresh(true), [refresh]);

  return { assets, loading, refreshing, error, refresh: pullRefresh };
}

export default useMyAssets;
