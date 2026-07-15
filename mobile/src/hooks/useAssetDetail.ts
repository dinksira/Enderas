import { useCallback, useEffect, useState } from 'react';

import { getAssetById } from '@/services/assetApi';
import type { AssetRecord } from '@/types/asset';

interface UseAssetDetailResult {
  asset: AssetRecord | null;
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useAssetDetail(id: string | undefined): UseAssetDetailResult {
  const [asset, setAsset] = useState<AssetRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!id) {
      setAsset(null);
      setLoading(false);
      setError('Missing asset id');
      return;
    }

    setError(null);

    try {
      const data = await getAssetById(id);
      setAsset(data.asset ?? null);
      if (!data.asset) {
        setError('Asset not found');
      }
    } catch (err) {
      setAsset(null);
      setError(err instanceof Error ? err.message : 'Failed to load asset');
    } finally {
      setLoading(false);
    }
  }, [id]);

  // Pull-to-refresh entrypoint — flips `refreshing` instead of `loading`
  // so the screen keeps showing the current asset while the spinner spins,
  // rather than swapping back to the full-screen skeleton.
  const pullRefresh = useCallback(async () => {
    if (!id) return;
    setRefreshing(true);
    try {
      await refresh();
    } finally {
      setRefreshing(false);
    }
  }, [id, refresh]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void refresh();
    }, 0);

    return () => clearTimeout(timer);
  }, [refresh]);

  return { asset, loading, refreshing, error, refresh: pullRefresh };
}

export default useAssetDetail;
