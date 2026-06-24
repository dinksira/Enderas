import { useCallback, useEffect, useState } from 'react';
import { useAuthStore } from '../../../stores/auth-store.js';
import { auctionService } from '../services/auction-service.js';

function normalizeAuctionList(data) {
  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.items)) {
    return data.items;
  }

  return [];
}

export function useAuctions({ enabled = true } = {}) {
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
      const data = await auctionService.getAll();
      setRecords(normalizeAuctionList(data));
    } catch (err) {
      setRecords([]);
      setError(null);
    } finally {
      setLoading(false);
    }
  }, [enabled, isAuthenticated, accessToken]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  return { records, loading, error, refetch: fetchRecords };
}

export default useAuctions;
