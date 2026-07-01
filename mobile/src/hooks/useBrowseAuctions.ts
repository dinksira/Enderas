import { useCallback, useMemo, useState } from 'react';

import { MOCK_BROWSE_AUCTIONS } from '@/data/mockAuctions';
import { resolveAuctionCategoryFilter } from '@/lib/auctionUtils';
import type { AuctionStatusFilter, BrowseAuction } from '@/types/auction';

interface UseBrowseAuctionsOptions {
  status?: AuctionStatusFilter;
  category?: string;
  search?: string;
}

interface UseBrowseAuctionsResult {
  records: BrowseAuction[];
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

/**
 * Browse auctions with client-side filtering.
 * Swaps to the API once mobile auth is wired — same shape as Frontend's hook.
 */
export function useBrowseAuctions({
  status = '',
  category = '',
  search = '',
}: UseBrowseAuctionsOptions = {}): UseBrowseAuctionsResult {
  const [refreshKey, setRefreshKey] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const records = useMemo(() => {
    let items = [...MOCK_BROWSE_AUCTIONS];

    if (status) {
      items = items.filter((item) => item.status === status);
    }

    if (category) {
      const auctionCategory = resolveAuctionCategoryFilter(category);
      items = items.filter(
        (item) => item.category === auctionCategory || item.category === category,
      );
    }

    const term = search.trim().toLowerCase();
    if (term) {
      items = items.filter(
        (item) =>
          item.title.toLowerCase().includes(term) || item.id.toLowerCase().includes(term),
      );
    }

    return items.sort(
      (a, b) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime(),
    );
    // refreshKey forces a re-read of mock data on pull-to-refresh.
  }, [status, category, search, refreshKey]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 350));
      setRefreshKey((current) => current + 1);
    } finally {
      setRefreshing(false);
    }
  }, []);

  return { records, loading: false, refreshing, error: null, refresh };
}
