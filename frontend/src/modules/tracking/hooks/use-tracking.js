import { useState, useEffect, useCallback, useRef } from 'react';
import { trackingService } from '../services/tracking-service.js';

const POLL_INTERVAL_MS = 30000;

export function useTracking(token) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [authenticated, setAuthenticated] = useState(() => trackingService.isAuthenticated(token));
  const intervalRef = useRef(null);

  const fetchData = useCallback(async () => {
    if (!token) return;
    try {
      const result = await trackingService.getTrackingData(token);
      setData(result);
      setError(null);
      return result;
    } catch (err) {
      if (err.message === 'Session expired') {
        setAuthenticated(false);
        setError('Session expired. Please re-authenticate.');
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  }, [token]);

  const authenticate = useCallback(async (password) => {
    setLoading(true);
    setError(null);
    try {
      await trackingService.authenticate(token, password);
      setAuthenticated(true);
      await fetchData();
    } catch (err) {
      setError(err.message);
      setLoading(false);
      throw err;
    }
  }, [token, fetchData]);

  const logout = useCallback(() => {
    trackingService.logout(token);
    setAuthenticated(false);
    setData(null);
    setError(null);
  }, [token]);

  useEffect(() => {
    if (authenticated && token) {
      fetchData();

      intervalRef.current = setInterval(fetchData, POLL_INTERVAL_MS);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [authenticated, token, fetchData]);

  return {
    data,
    loading,
    error,
    authenticated,
    authenticate,
    logout,
    refetch: fetchData,
  };
}

export default useTracking;
