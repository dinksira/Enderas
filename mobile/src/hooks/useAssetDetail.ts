import { useCallback, useEffect, useState } from 'react';

import { getAssetById } from '@/services/assetApi';
import type { AssetRecord } from '@/types/asset';

interface UseAssetDetailResult {
  asset: AssetRecord | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useAssetDetail(id: string | undefined): UseAssetDetailResult {
  const [asset, setAsset] = useState<AssetRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!id) {
      setAsset(null);
      setLoading(false);
      setError('Missing asset id');
      return;
    }

    setLoading(true);
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

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { asset, loading, error, refresh };
}

export default useAssetDetail;
