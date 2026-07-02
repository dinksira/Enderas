import { useCallback, useEffect, useState } from 'react';
import { useAuthStore } from '@enderass/shared/auth';
import { auctionService } from '@enderass/shared/services';
function normalizeAuctionList(data) {
  if (Array.isArray(data?.items)) {
    return data.items;
  }

  if (Array.isArray(data)) {
    return data;
  }

  return [];
}

export function useAuctions({ enabled = true, status, search } = {}) {
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
      const data = await auctionService.getAll({ status, search });
      setRecords(normalizeAuctionList(data));
    } catch (err) {
      setRecords([]);
      setError(err instanceof Error ? err.message : 'Failed to load auctions');
    } finally {
      setLoading(false);
    }
  }, [enabled, isAuthenticated, accessToken, status, search]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  return { records, loading, error, refetch: fetchRecords };
}

export default useAuctions;
