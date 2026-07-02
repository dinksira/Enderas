import { useCallback, useEffect, useState } from 'react';

import { getMyBids } from '@/services/bidApi';
import type { BidRecord } from '@/types/bid';

interface UseMyBidsResult {
  bids: BidRecord[];
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

const PAGE_LIMIT = 50;

export function useMyBids(): UseMyBidsResult {
  const [bids, setBids] = useState<BidRecord[]>([]);
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
      const data = await getMyBids({ page: 1, limit: PAGE_LIMIT });
      setBids(Array.isArray(data.items) ? data.items : []);
    } catch (err) {
      setBids([]);
      setError(err instanceof Error ? err.message : 'Failed to load bids');
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

  return {
    bids,
    loading,
    refreshing,
    error,
    refresh: pullRefresh,
  };
}

export default useMyBids;
