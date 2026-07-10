import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';

import { ApiError } from '@/services/api';
import { auctionApi } from '@/services/auctionApi';
import { bidDraftApi } from '@/services/bidDraftApi';
import { isKycVerified } from '@/lib/auth-utils';
import { flattenAuctionAssets, normalizeBrowseAuctionApi } from '@/lib/normalizeBrowseAuction';
import { useAuthStore } from '@/lib/authStore';
import type { AuctionAssetApi, AuctionLotApi, AuctionParticipationApi, BrowseAuctionApi } from '@/types/auctionApi';

const FOCUS_RELOAD_MS = 20_000;

interface UseAuctionParticipationResult {
  auction: BrowseAuctionApi | null;
  participation: AuctionParticipationApi | null;
  lots: AuctionLotApi[];
  auctionAssets: AuctionAssetApi[];
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

function normalizeParticipationApi(
  participation: AuctionParticipationApi,
): AuctionParticipationApi {
  return {
    ...participation,
    bids: Array.isArray(participation.bids) ? participation.bids : [],
    bidDrafts: Array.isArray(participation.bidDrafts) ? participation.bidDrafts : [],
    lotParticipation: Array.isArray(participation.lotParticipation)
      ? participation.lotParticipation
      : [],
    payment: participation.payment ?? null,
    cpo: participation.cpo
      ? {
          ...participation.cpo,
          selectedAuctionAssetIds: Array.isArray(participation.cpo.selectedAuctionAssetIds)
            ? participation.cpo.selectedAuctionAssetIds
            : [],
        }
      : null,
    gates: {
      documentAccess: Boolean(participation.gates?.documentAccess),
      cpoApproved: Boolean(participation.gates?.cpoApproved),
      canSubmitPayment: Boolean(participation.gates?.canSubmitPayment),
      canSubmitCpo: Boolean(participation.gates?.canSubmitCpo),
      canSubmitCpoWithBids: Boolean(participation.gates?.canSubmitCpoWithBids),
      canEditBidDrafts: Boolean(participation.gates?.canEditBidDrafts),
      bidsLocked: Boolean(participation.gates?.bidsLocked),
      canPlaceBid: Boolean(participation.gates?.canPlaceBid),
      inBiddingWindow: Boolean(participation.gates?.inBiddingWindow),
      biddingWindowStatus: participation.gates?.biddingWindowStatus,
      paymentPending: Boolean(participation.gates?.paymentPending),
      cpoPending: Boolean(participation.gates?.cpoPending),
      isAuctionOwner: Boolean(participation.gates?.isAuctionOwner),
      biddingBlockedReason: participation.gates?.biddingBlockedReason ?? null,
    },
    flags: {
      paymentApproved: Boolean(participation.flags?.paymentApproved),
      paymentRejected: Boolean(participation.flags?.paymentRejected),
      cpoApproved: Boolean(participation.flags?.cpoApproved),
      cpoRejected: Boolean(participation.flags?.cpoRejected),
      hasBid: Boolean(participation.flags?.hasBid),
      allBidsSubmitted: Boolean(participation.flags?.allBidsSubmitted),
      pendingLotCount: Number(participation.flags?.pendingLotCount ?? 0),
      isAuctionOwner: Boolean(participation.flags?.isAuctionOwner),
    },
    isAuctionOwner: Boolean(participation.isAuctionOwner),
    ownerOverview: participation.ownerOverview,
  };
}

export function useAuctionParticipation(auctionId: string): UseAuctionParticipationResult {
  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);
  const [auction, setAuction] = useState<BrowseAuctionApi | null>(null);
  const [participation, setParticipation] = useState<AuctionParticipationApi | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastLoadedAtRef = useRef(0);

  const kycVerified = isKycVerified(user);
  const documentApproved = Boolean(participation?.gates?.documentAccess);
  const canBid = Boolean(documentApproved && kycVerified && participation?.gates?.canEditBidDrafts);

  const lots = useMemo(() => auction?.lots ?? [], [auction?.lots]);
  const auctionAssets = useMemo(() => flattenAuctionAssets(lots), [lots]);

  const load = useCallback(async () => {
    if (!auctionId) return;

    setError(null);
    try {
      const auctionData = normalizeBrowseAuctionApi(await auctionApi.browseAuctionById(auctionId));
      setAuction(auctionData);
      lastLoadedAtRef.current = Date.now();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load auction');
      return;
    }

    if (!accessToken) {
      setParticipation(null);
      return;
    }

    try {
      const rawParticipation = await auctionApi.getParticipation(auctionId);
      setParticipation(normalizeParticipationApi(rawParticipation));
    } catch {
      // Participation is supplementary — don't block the auction view.
    }
  }, [auctionId, accessToken]);

  const loadAuctionOnly = useCallback(async () => {
    if (!auctionId) return;

    setError(null);
    try {
      const auctionData = normalizeBrowseAuctionApi(await auctionApi.browseAuctionById(auctionId));
      setAuction(auctionData);
      lastLoadedAtRef.current = Date.now();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load auction');
    }
  }, [auctionId]);

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
        await loadAuctionOnly();
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }

      if (cancelled) return;

      if (accessToken) {
        try {
          const rawParticipation = await auctionApi.getParticipation(auctionId);
          if (!cancelled) {
            setParticipation(normalizeParticipationApi(rawParticipation));
          }
        } catch {
          // Participation loads in background.
        }
      } else {
        setParticipation(null);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [auctionId, accessToken, loadAuctionOnly]);

  useFocusEffect(
    useCallback(() => {
      if (loading) return;
      const elapsed = Date.now() - lastLoadedAtRef.current;
      if (elapsed < FOCUS_RELOAD_MS) return;
      void load();
    }, [load, loading]),
  );

  const upsertLotBid = useCallback(
    async (lotId: string, amount: number) => {
      const draft = await bidDraftApi.upsertBidDraft({
        auctionId,
        auctionAssetId: lotId,
        amount,
      });
      setParticipation((prev) => {
        if (!prev) return prev;
        const drafts = [...(prev.bidDrafts ?? [])];
        const idx = drafts.findIndex((d) => d.auctionAssetId === lotId);
        if (idx >= 0) {
          drafts[idx] = { ...drafts[idx], ...draft, amount, status: draft.status ?? 'draft' };
        } else {
          drafts.push(draft);
        }
        return { ...prev, bidDrafts: drafts };
      });
    },
    [auctionId],
  );

  const removeLotBid = useCallback(
    async (draftId: string) => {
      try {
        await bidDraftApi.deleteBidDraft(draftId);
      } catch (err) {
        if (!(err instanceof ApiError && err.code === 'BID_DRAFT_NOT_FOUND')) throw err;
      }
      setParticipation((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          bidDrafts: (prev.bidDrafts ?? []).filter((d) => d.id !== draftId),
        };
      });
    },
    [],
  );

  const clearLotSelection = useCallback(
    async (lotId: string, draftId?: string) => {
      const id = draftId ?? participation?.bidDrafts?.find(
        (draft) => draft.auctionAssetId === lotId && draft.status === 'draft',
      )?.id;
      if (id) {
        try {
          await bidDraftApi.deleteBidDraft(id);
        } catch (err) {
          if (!(err instanceof ApiError && err.code === 'BID_DRAFT_NOT_FOUND')) throw err;
        }
        setParticipation((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            bidDrafts: (prev.bidDrafts ?? []).filter((d) => d.id !== id),
          };
        });
      }
    },
    [participation?.bidDrafts],
  );

  return {
    auction,
    participation,
    lots,
    auctionAssets,
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
