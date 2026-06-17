import { useCallback, useEffect, useState } from 'react';
import { auctionService } from '../services/auction-service.js';

export function useAuctions() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await auctionService.getAll();
      setRecords(Array.isArray(data) ? data : data?.items ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load records.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  return { records, loading, error, refetch: fetchRecords };
}

export default useAuctions;
