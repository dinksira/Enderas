import { useCallback, useEffect, useState } from 'react';

import { auctionApi } from '@/services/auctionApi';
import { normalizeBrowseAuctionApi } from '@/lib/normalizeBrowseAuction';
import { resolveAuctionCategoryFilter } from '@/lib/auctionUtils';
import { useAuthStore } from '@/lib/authStore';
import type { BrowseAuctionApi } from '@/types/auctionApi';
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

function mapBrowseAuction(item: BrowseAuctionApi): BrowseAuction {
  const normalized = normalizeBrowseAuctionApi(item);
  return {
    id: normalized.id,
    title: normalized.title,
    description: normalized.description ?? '',
    category: normalized.category,
    status: (normalized.status?.toUpperCase() as BrowseAuction['status']) || 'ACTIVE',
    imageUrls: normalized.imageUrls,
    reservePrice: Number(normalized.reservePrice ?? 0),
    bidCount: Number(normalized.bidCount ?? 0),
    endingDate: normalized.endingDate ?? normalized.endDate ?? '',
    endDate: normalized.endDate ?? normalized.endingDate ?? '',
    documentFee: Number(normalized.documentFee ?? 0),
    cpoPercentage: Number(normalized.cpoPercentage ?? 0),
    myParticipationStatus: normalized.myParticipation?.participationStatus,
  };
}

export function useBrowseAuctions({
  status = '',
  category = '',
  search = '',
}: UseBrowseAuctionsOptions = {}): UseBrowseAuctionsResult {
  const accessToken = useAuthStore((s) => s.accessToken);
  const [records, setRecords] = useState<BrowseAuction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRecords = useCallback(async () => {
    setError(null);
    try {
      const data = await auctionApi.browseAuctions({
        status: status || undefined,
        search: search.trim() || undefined,
      });

      let items = (data.items ?? []).map(mapBrowseAuction);

      if (category) {
        const auctionCategory = resolveAuctionCategoryFilter(category);
        items = items.filter(
          (item) => item.category === auctionCategory || item.category === category,
        );
      }

      setRecords(
        items.sort(
          (a, b) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime(),
        ),
      );
    } catch (err) {
      setRecords([]);
      setError(err instanceof Error ? err.message : 'Failed to load auctions');
    }
  }, [status, category, search]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchRecords();
    } finally {
      setRefreshing(false);
    }
  }, [fetchRecords]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      try {
        await fetchRecords();
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [fetchRecords, accessToken]);

  return { records, loading, refreshing, error, refresh };
}

export default useBrowseAuctions;
