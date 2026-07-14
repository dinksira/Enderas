import { useCallback, useEffect, useState } from 'react';

import { auctionApi } from '@/services/auctionApi';
import { normalizeBrowseAuctionApi } from '@/lib/normalizeBrowseAuction';
import type { BrowseAuctionApi } from '@/types/auctionApi';

export function useOwnedAuctions() {
  const [auctions, setAuctions] = useState<BrowseAuctionApi[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const response = await auctionApi.listOwnedAuctions();
      setAuctions((response.items ?? []).map(normalizeBrowseAuctionApi));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load owned auctions');
      setAuctions([]);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      try {
        await load();
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [load]);

  return {
    auctions,
    loading,
    error,
    refresh: load,
  };
}

export default useOwnedAuctions;
