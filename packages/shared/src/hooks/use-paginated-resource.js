import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

const DEFAULT_PAGE_SIZE = 20;
const EMPTY_PARAMS = Object.freeze({});

/**
 * Generic hook for admin list pages: tab, page, search, load, and refetch.
 */
export function usePaginatedResource({
  fetchFn,
  pageSize = DEFAULT_PAGE_SIZE,
  initialTab = 'all',
  itemsKey = 'items',
  extraParams = EMPTY_PARAMS,
  loadFailedKey = 'admin.loadFailed',
}) {
  const { t } = useTranslation();

  const [activeTab, setActiveTab] = useState(initialTab);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: pageSize,
    total: 0,
    pages: 0,
  });
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetchFn({
        page,
        limit: pageSize,
        tab: activeTab === 'all' ? undefined : activeTab,
        search: search.trim() || undefined,
        includeStats: true,
        ...extraParams,
      });

      const nextItems = response?.[itemsKey] ?? response?.items ?? [];
      setItems(Array.isArray(nextItems) ? nextItems : []);
      setPagination(
        response?.pagination || { page: 1, limit: pageSize, total: 0, pages: 0 },
      );
      if (response?.stats) {
        setStats(response.stats);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t(loadFailedKey));
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [activeTab, extraParams, fetchFn, itemsKey, loadFailedKey, page, pageSize, search, t]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setPage(1);
  }, [activeTab, search]);

  const goToPrevPage = useCallback(() => {
    setPage((current) => Math.max(1, current - 1));
  }, []);

  const goToNextPage = useCallback(() => {
    setPage((current) => current + 1);
  }, []);

  return {
    activeTab,
    setActiveTab,
    page,
    setPage,
    search,
    setSearch,
    items,
    pagination,
    stats,
    loading,
    error,
    setError,
    load,
    refetch: load,
    goToPrevPage,
    goToNextPage,
  };
}

export default usePaginatedResource;
