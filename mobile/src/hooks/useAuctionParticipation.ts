import { useCallback, useEffect, useMemo, useState } from 'react';
import { useFocusEffect } from 'expo-router';

import { auctionApi } from '@/services/auctionApi';
import { bidDraftApi } from '@/services/bidDraftApi';
import { isKycVerified } from '@/lib/auth-utils';
import { normalizeBrowseAuctionApi } from '@/lib/normalizeBrowseAuction';
import { useAuthStore } from '@/lib/authStore';
import type { AuctionLotApi, AuctionParticipationApi, BrowseAuctionApi } from '@/types/auctionApi';

interface UseAuctionParticipationResult {
  auction: BrowseAuctionApi | null;
  participation: AuctionParticipationApi | null;
  lots: AuctionLotApi[];
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  kycVerified: boolean;
  documentApproved: boolean;
  canBid: boolean;
  refresh: () => Promise<void>;
  upsertLotBid: (lotId: string, amount: number) => Promise<void>;
  removeLotBid: (draftId: string) => Promise<void>;
  clearLotSelection: (lotId: string, draftId?: string) => Promise<void>;
}

export function useAuctionParticipation(auctionId: string): UseAuctionParticipationResult {
  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);
  const [auction, setAuction] = useState<BrowseAuctionApi | null>(null);
  const [participation, setParticipation] = useState<AuctionParticipationApi | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const kycVerified = isKycVerified(user);
  const documentApproved = Boolean(participation?.gates.documentAccess);
  const canBid = Boolean(documentApproved && kycVerified && participation?.gates.canEditBidDrafts);

  const lots = useMemo(() => auction?.lots ?? [], [auction?.lots]);

  const load = useCallback(async () => {
    if (!auctionId) return;

    setError(null);
    try {
      const auctionData = normalizeBrowseAuctionApi(await auctionApi.browseAuctionById(auctionId));
      setAuction(auctionData);

      if (accessToken) {
        const participationData = await auctionApi.getParticipation(auctionId);
        setParticipation(participationData);
      } else {
        setParticipation(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load auction');
    }
  }, [auctionId, accessToken]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await load();
    } finally {
      setRefreshing(false);
    }
  }, [load]);

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

  useFocusEffect(
    useCallback(() => {
      if (!loading) {
        void load();
      }
    }, [load, loading]),
  );

  const upsertLotBid = useCallback(
    async (lotId: string, amount: number) => {
      await bidDraftApi.upsertBidDraft({
        auctionId,
        auctionAssetId: lotId,
        amount,
      });
      await load();
    },
    [auctionId, load],
  );

  const removeLotBid = useCallback(
    async (draftId: string) => {
      await bidDraftApi.deleteBidDraft(draftId);
      await load();
    },
    [load],
  );

  const clearLotSelection = useCallback(
    async (lotId: string, draftId?: string) => {
      if (draftId) {
        await bidDraftApi.deleteBidDraft(draftId);
      } else {
        const existing = participation?.bidDrafts.find(
          (draft) => draft.auctionAssetId === lotId && draft.status === 'draft',
        );
        if (existing?.id) {
          await bidDraftApi.deleteBidDraft(existing.id);
        }
      }
      await load();
    },
    [load, participation?.bidDrafts],
  );

  return {
    auction,
    participation,
    lots,
    loading,
    refreshing,
    error,
    kycVerified,
    documentApproved,
    canBid,
    refresh,
    upsertLotBid,
    removeLotBid,
    clearLotSelection,
  };
}

export default useAuctionParticipation;
