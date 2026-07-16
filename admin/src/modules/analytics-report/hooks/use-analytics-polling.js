import { useCallback, useEffect, useRef, useState } from 'react';
import { analyticsService } from '@enderass/shared/services';

const DEFAULT_INTERVAL = 30000;

function resolveMetricValue(metricGroup) {
  if (!metricGroup || typeof metricGroup !== 'object') return 0;
  if (typeof metricGroup.total === 'number') return metricGroup.total;
  if (typeof metricGroup.all === 'number') return metricGroup.all;
  if (typeof metricGroup.pending === 'number') return metricGroup.pending;
  const values = Object.values(metricGroup).filter((v) => typeof v === 'number');
  return values.reduce((s, v) => s + v, 0);
}

function computeDeltas(current, previous) {
  if (!previous) return {};
  const keys = Object.keys(current || {});
  const deltas = {};
  for (const key of keys) {
    const curr = resolveMetricValue(current[key]);
    const prev = resolveMetricValue(previous[key]);
    deltas[key] = prev > 0 ? ((curr - prev) / prev) * 100 : 0;
  }
  return deltas;
}

export function useAnalyticsPolling({ enabled = true, interval = DEFAULT_INTERVAL } = {}) {
  const [snapshot, setSnapshot] = useState(null);
  const [deltas, setDeltas] = useState({});
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const intervalRef = useRef(null);
  const snapshotRef = useRef(null);
  const fetchDataRef = useRef(null);

  const fetchData = useCallback(async () => {
    try {
      const response = await analyticsService.listReports();
      const newSnapshot = response?.dashboardSnapshot ?? null;
      const newReports = response?.reports ?? [];
      const prev = snapshotRef.current;

      if (newSnapshot && prev) {
        setDeltas(computeDeltas(newSnapshot, prev));
      }

      snapshotRef.current = newSnapshot;
      setSnapshot(newSnapshot);
      setReports(newReports);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  }, []);

  fetchDataRef.current = fetchData;

  useEffect(() => {
    if (!enabled) return;

    fetchDataRef.current();
    const id = setInterval(() => fetchDataRef.current(), interval);

    return () => {
      clearInterval(id);
      if (intervalRef.current === id) intervalRef.current = null;
    };
  }, [enabled, interval]);

  const refetch = useCallback(() => {
    snapshotRef.current = null;
    setLoading(true);
    fetchDataRef.current();
  }, []);

  return {
    snapshot,
    deltas,
    reports,
    loading,
    error,
    refetch,
  };
}

export default useAnalyticsPolling;
