import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, ScrollView, SectionList, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { GoldButton } from '@/components/auth';
import { AuctionAssetDetailModal } from '@/components/auction/AuctionAssetDetailModal';
import { BidEntrySheet } from '@/components/auction/BidEntrySheet';
import { BidFlowStepper, type BidFlowStep } from '@/components/auction/BidFlowStepper';
import { BidGuideCard } from '@/components/auction/BidGuideCard';
import { BidSummaryBar } from '@/components/auction/BidSummaryBar';
import { CpoReadinessSheet } from '@/components/auction/CpoReadinessSheet';
import { CpoUploadModal } from '@/components/auction/CpoUploadModal';
import { LotBidCard } from '@/components/auction/LotBidCard';
import { LotCategoryHeader } from '@/components/auction/LotCategoryHeader';
import { LotParticipationCard } from '@/components/auction/LotParticipationCard';
import { ParticipationStatusBanner } from '@/components/auction/ParticipationStatusBanner';
import { KycRequiredModal } from '@/components/kyc/KycRequiredModal';
import { ScreenShell } from '@/components/shell/ScreenShell';
import { GlassCard } from '@/components/shell/GlassCard';
import { useAuctionActionGate } from '@/hooks/useAuctionActionGate';
import { useAuctionParticipation } from '@/hooks/useAuctionParticipation';
import { formatLotOrderLabel, mapAuctionAssetForDisplay } from '@/lib/auctionAssetUtils';
import { validateLotBid, getLotBidFeedback } from '@/lib/auctionParticipationUtils';
import { computeRequiredCpoFromBidAmounts } from '@/lib/auctionLotUtils';
import { buildCpoReadinessItems, isCpoUploadReady } from '@/lib/cpoReadinessUtils';
import {
  buildLotParticipationRows,
  countActiveLotParticipation,
  shouldShowLotParticipationOverview,
  sumSubmittedBidAmounts,
} from '@/lib/lotParticipationUtils';
import type { LotParticipationRow } from '@/lib/lotParticipationUtils';
import { useTheme } from '@/lib/appStore';
import { cpoApi } from '@/services/cpoApi';
import { fileUploadApi } from '@/services/fileUploadApi';
import { Typography, Spacing, Radii } from '@/theme';
import type { AuctionAssetApi, AuctionLotApi } from '@/types/auctionApi';
import type { AuctionLot } from '@/types/auctionParticipation';

const BID_SAVE_DEBOUNCE_MS = 600;

type LotSection = {
  lotLabel: string;
  lotTitle?: string | null;
  lotId: string;
  itemCount: number;
  selectedCount: number;
  collapsed: boolean;
  data: AuctionAssetApi[];
};

export default function AuctionBidScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const { colors } = useTheme();
  const auctionId = id ?? '';
  const {
    auction,
    participation,
    lots,
    auctionAssets,
    loading,
    error,
    kycVerified,
    documentApproved,
    refresh,
    upsertLotBid,
    clearLotSelection,
  } = useAuctionParticipation(auctionId);
  const { isAuthenticated } = useAuctionActionGate();
  const [cpoModalVisible, setCpoModalVisible] = useState(false);
  const [cpoReadinessVisible, setCpoReadinessVisible] = useState(false);
  const [showErrors, setShowErrors] = useState(false);
  const [submittingCpo, setSubmittingCpo] = useState(false);
  const [lotBids, setLotBids] = useState<Record<string, string>>({});
  const [collapsedLots, setCollapsedLots] = useState<Record<string, boolean>>({});
  const [bidSheetAsset, setBidSheetAsset] = useState<AuctionLot | null>(null);
  const [detailAsset, setDetailAsset] = useState<AuctionLot | null>(null);
  const hydratedDraftIdsRef = useRef<Set<string>>(new Set());
  const saveTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const bidDrafts = participation?.bidDrafts ?? [];
  const selectedDrafts = bidDrafts.filter((draft) => draft.status === 'draft' || draft.status === 'locked');
  const selectedLotIds = Object.keys(lotBids);
  const locked = Boolean(participation?.gates.bidsLocked);
  const canEdit = Boolean(participation?.gates.canEditBidDrafts);
  const cpoPending = participation?.cpo?.status === 'pending';
  const cpoApproved = participation?.cpo?.status === 'approved' || participation?.flags?.hasBid;
  const cpoRejected = participation?.cpo?.status === 'rejected';
  const showParticipationOverview = shouldShowLotParticipationOverview(participation);
  const participationRows = useMemo(
    () => buildLotParticipationRows(lots, participation),
    [lots, participation],
  );
  const participationRowMap = useMemo(() => {
    const map = new Map<string, LotParticipationRow>();
    for (const row of participationRows) {
      map.set(row.lotId, row);
    }
    return map;
  }, [participationRows]);
  const participationActiveCount = useMemo(
    () => countActiveLotParticipation(participationRows),
    [participationRows],
  );
  const participationBidTotal = useMemo(
    () => sumSubmittedBidAmounts(participationRows),
    [participationRows],
  );

  useEffect(() => {
    if (!participation?.bidDrafts) return;
    const syncDrafts = () => {
      setLotBids((prev) => {
        const next = { ...prev };
        for (const draft of participation.bidDrafts) {
          if (draft.status !== 'draft' && draft.status !== 'locked') continue;
          if (!draft.auctionAssetId) continue;
          if (hydratedDraftIdsRef.current.has(draft.id) || draft.auctionAssetId in next) continue;
          next[draft.auctionAssetId] = String(draft.amount);
          hydratedDraftIdsRef.current.add(draft.id);
        }
        return next;
      });
    };

    const timer = setTimeout(syncDrafts, 0);
    return () => clearTimeout(timer);
  }, [participation?.bidDrafts]);

  useEffect(() => {
    return () => {
      for (const timer of saveTimersRef.current.values()) {
        clearTimeout(timer);
      }
      saveTimersRef.current.clear();
    };
  }, []);

  const parseBidAmount = (text: string): number => {
    const digits = text.replace(/[^\d]/g, '');
    return digits ? Number(digits) : 0;
  };

  const summary = useMemo(() => {
    const selectedLots = auctionAssets.filter((lot) => selectedLotIds.includes(lot.id));
    const totalBidAmount = selectedLots.reduce((sum, lot) => sum + parseBidAmount(lotBids[lot.id] ?? ''), 0);

    const validProposedBids = selectedLots
      .map((lot) => ({
        auctionAssetId: lot.id,
        amount: parseBidAmount(lotBids[lot.id] ?? ''),
      }))
      .filter((entry) => {
        const lot = selectedLots.find((item) => item.id === entry.auctionAssetId);
        return lot != null && validateLotBid(entry.amount, mapAuctionAssetForDisplay(lot)) === null;
      });

    const liveCpoAmount = computeRequiredCpoFromBidAmounts(
      validProposedBids,
      auction?.cpoPercentage ?? 0,
      auctionAssets.map((lot) => ({ id: lot.id, reservePrice: lot.reservePrice })),
      auction?.reservePrice,
    );

    const cpoAmount =
      liveCpoAmount > 0
        ? liveCpoAmount
        : participation?.requiredCpoAmountPreview ?? participation?.cpo?.requiredCpoAmount ?? 0;

    return {
      selectedLots,
      totalBidAmount,
      cpoAmount: Number(cpoAmount),
    };
  }, [auction, auctionAssets, lotBids, participation, selectedLotIds]);

  const allSelectedLotsSaved = selectedLotIds.every((lotId) => {
    const lot = auctionAssets.find((item) => item.id === lotId);
    if (!lot) return false;
    const amount = parseBidAmount(lotBids[lotId] ?? '');
    if (validateLotBid(amount, mapAuctionAssetForDisplay(lot)) !== null) return false;
    return selectedDrafts.some((draft) => draft.auctionAssetId === lotId && draft.amount === amount);
  });

  const flowStep = useMemo((): BidFlowStep => {
    if (selectedLotIds.length === 0) return 'select';
    if (!allSelectedLotsSaved) return 'bid';
    return 'submit';
  }, [allSelectedLotsSaved, selectedLotIds.length]);

  const bidSheetOpen = bidSheetAsset != null;

  const cpoReadinessItems = useMemo(
    () =>
      buildCpoReadinessItems({
        t,
        auctionAssets,
        selectedLotIds,
        lotBids,
        allSelectedLotsSaved,
        cpoAmount: summary.cpoAmount,
      }),
    [allSelectedLotsSaved, auctionAssets, lotBids, selectedLotIds, summary.cpoAmount, t],
  );

  const sections: LotSection[] = useMemo(
    () =>
      lots.map((lot: AuctionLotApi, lotIndex: number) => {
        const assets = lot.assets ?? [];
        const collapsed = Boolean(collapsedLots[lot.id]);
        const selectedCount = showParticipationOverview
          ? assets.filter((asset) => {
              const row = participationRowMap.get(asset.id);
              return row != null && row.status !== 'not_bidding';
            }).length
          : assets.filter((asset) => asset.id in lotBids).length;
        return {
          lotLabel: formatLotOrderLabel(lotIndex),
          lotTitle: lot.title,
          lotId: lot.id,
          itemCount: assets.length,
          selectedCount,
          collapsed,
          data: collapsed ? [] : assets,
        };
      }),
    [lots, collapsedLots, lotBids, showParticipationOverview, participationRowMap],
  );

  const toggleLotCollapsed = useCallback((lotId: string) => {
    setCollapsedLots((prev) => ({ ...prev, [lotId]: !prev[lotId] }));
  }, []);

  // Stable per-asset display models so LotBidCard's `lot` prop keeps a
  // stable identity across bid keystrokes (memo can then skip re-render).
  const displayLotMap = useMemo(() => {
    const map = new Map<string, AuctionLot>();
    for (const asset of auctionAssets) {
      map.set(asset.id, mapAuctionAssetForDisplay(asset));
    }
    return map;
  }, [auctionAssets]);

  // Latest mutable state for stable callbacks (avoids recreating handlers —
  // and thus re-rendering every card — on every bid keystroke).
  const interactionStateRef = useRef({
    lotBids,
    selectedDrafts,
    canEdit,
    locked,
    bidSheetAssetId: bidSheetAsset?.id ?? null,
  });
  interactionStateRef.current = {
    lotBids,
    selectedDrafts,
    canEdit,
    locked,
    bidSheetAssetId: bidSheetAsset?.id ?? null,
  };

  const openBidSheet = useCallback((assetId: string) => {
    const raw = auctionAssets.find((item) => item.id === assetId);
    if (!raw) return;
    setBidSheetAsset(mapAuctionAssetForDisplay(raw));
  }, [auctionAssets]);

  const handleOpenDetail = useCallback(
    (assetId: string) => {
      const lot = displayLotMap.get(assetId);
      if (lot) setDetailAsset(lot);
    },
    [displayLotMap],
  );

  const persistBid = useCallback(
    async (lotId: string, text: string) => {
      if (!canEdit || locked) return;

      const amount = parseBidAmount(text);
      const existing = selectedDrafts.find((draft) => draft.auctionAssetId === lotId);

      if (!amount) {
        if (existing) {
          await clearLotSelection(lotId, existing.id);
        }
        return;
      }

      const lot = auctionAssets.find((item) => item.id === lotId);
      if (!lot) return;

      const validationError = validateLotBid(amount, mapAuctionAssetForDisplay(lot));
      if (validationError) {
        if (existing) {
          await clearLotSelection(lotId, existing.id);
        }
        return;
      }

      await upsertLotBid(lotId, amount);
    },
    [auctionAssets, canEdit, clearLotSelection, locked, selectedDrafts, upsertLotBid],
  );

  const handleBidChange = useCallback(
    (lotId: string, text: string) => {
      setLotBids((prev) => ({ ...prev, [lotId]: text }));

      const existing = saveTimersRef.current.get(lotId);
      if (existing) clearTimeout(existing);

      const timer = setTimeout(() => {
        saveTimersRef.current.delete(lotId);
        void persistBid(lotId, text);
      }, BID_SAVE_DEBOUNCE_MS);
      saveTimersRef.current.set(lotId, timer);
    },
    [persistBid],
  );

  const handleToggleLot = useCallback(
    async (lotId: string) => {
      const { lotBids: bids, selectedDrafts: drafts, canEdit: editable, locked: isLocked, bidSheetAssetId } =
        interactionStateRef.current;
      if (!editable || isLocked) return;
      if (lotId in bids) {
        const existing = drafts.find((draft) => draft.auctionAssetId === lotId);
        const pending = saveTimersRef.current.get(lotId);
        if (pending) {
          clearTimeout(pending);
          saveTimersRef.current.delete(lotId);
        }
        if (bidSheetAssetId === lotId) {
          setBidSheetAsset(null);
        }
        setLotBids((prev) => {
          const next = { ...prev };
          delete next[lotId];
          return next;
        });
        if (existing) {
          await clearLotSelection(lotId, existing.id);
        }
        return;
      }
      setLotBids((prev) => ({ ...prev, [lotId]: '' }));
      openBidSheet(lotId);
    },
    [clearLotSelection, openBidSheet],
  );

  const findNextIncompleteBidId = useCallback(
    (afterId: string) => {
      const startIdx = selectedLotIds.indexOf(afterId);
      const order =
        startIdx >= 0
          ? [...selectedLotIds.slice(startIdx + 1), ...selectedLotIds.slice(0, startIdx + 1)]
          : selectedLotIds;

      for (const lotId of order) {
        if (lotId === afterId) continue;
        const lot = auctionAssets.find((item) => item.id === lotId);
        if (!lot) continue;
        const feedback = getLotBidFeedback(lotBids[lotId] ?? '', mapAuctionAssetForDisplay(lot));
        if (feedback.kind !== 'valid') return lotId;
      }
      return null;
    },
    [auctionAssets, lotBids, selectedLotIds],
  );

  const handleSaveBidSheet = () => {
    if (!bidSheetAsset) return;
    void persistBid(bidSheetAsset.id, lotBids[bidSheetAsset.id] ?? '');
    setBidSheetAsset(null);
  };

  const handleSaveAndNextBidSheet = () => {
    if (!bidSheetAsset) return;
    void persistBid(bidSheetAsset.id, lotBids[bidSheetAsset.id] ?? '');
    const nextId = findNextIncompleteBidId(bidSheetAsset.id);
    if (nextId) {
      openBidSheet(nextId);
    } else {
      setBidSheetAsset(null);
    }
  };

  const handleUploadCpo = async (payload: { receiptUri: string; receiptName: string; mimeType?: string }) => {
    if (!auction || submittingCpo) return;
    setSubmittingCpo(true);
    try {
      const uploaded = await fileUploadApi.uploadFile(
        {
          uri: payload.receiptUri,
          name: payload.receiptName,
          mimeType: payload.mimeType ?? 'application/pdf',
        },
        'cpo/documents',
      );

      await cpoApi.createCpo({
        auctionId: auction.id,
        documentUrl: uploaded.fileUrl,
        proposedBids: selectedDrafts.map((draft) => ({
          auctionAssetId: draft.auctionAssetId,
          amount: draft.amount,
        })),
        declaredCpoAmount: summary.cpoAmount,
      });
      await refresh();
    } catch (err) {
      throw err;
    } finally {
      setSubmittingCpo(false);
    }
  };

  const handleUploadCpoPress = () => {
    setShowErrors(true);
    setCpoReadinessVisible(true);
  };

  const handleCpoReadinessContinue = () => {
    setCpoReadinessVisible(false);
    setCpoModalVisible(true);
  };

  const renderSectionHeader = useCallback(
    ({ section }: { section: LotSection }) => (
      <LotCategoryHeader
        lotLabel={section.lotLabel}
        lotTitle={section.lotTitle}
        itemCount={section.itemCount}
        selectedCount={section.selectedCount}
        collapsed={section.collapsed}
        onToggle={() => toggleLotCollapsed(section.lotId)}
      />
    ),
    [toggleLotCollapsed],
  );

  const renderItem = useCallback(
    ({ item, index }: { item: AuctionAssetApi; index: number }) => {
      const displayLot = displayLotMap.get(item.id);
      if (!displayLot) return null;
      const selected = item.id in lotBids;
      const bidText = lotBids[item.id] ?? '';
      const bidAmount = parseBidAmount(bidText);
      const feedback = getLotBidFeedback(bidText, displayLot, { forceShow: showErrors });

      return (
        <LotBidCard
          lot={displayLot}
          selected={selected}
          bidAmount={bidAmount}
          bidComplete={feedback.kind === 'valid'}
          bidHasError={showErrors && feedback.kind === 'error'}
          locked={locked || !canEdit}
          embedded
          first={index === 0}
          onToggle={handleToggleLot}
          onOpenDetail={handleOpenDetail}
          onOpenBid={openBidSheet}
        />
      );
    },
    [canEdit, displayLotMap, handleOpenDetail, handleToggleLot, locked, lotBids, openBidSheet, showErrors],
  );

  const renderParticipationItem = useCallback(
    ({ item, index }: { item: AuctionAssetApi; index: number }) => {
      const displayLot = displayLotMap.get(item.id);
      const row = participationRowMap.get(item.id);
      if (!displayLot || !row) return null;

      return (
        <LotParticipationCard
          lot={displayLot}
          status={row.status}
          bidAmount={row.bidAmount}
          embedded
          first={index === 0}
          onOpenDetail={handleOpenDetail}
        />
      );
    },
    [displayLotMap, participationRowMap, handleOpenDetail],
  );

  const renderSectionFooter = useCallback(
    ({ section }: { section: LotSection }) =>
      section.collapsed || section.itemCount === 0 ? null : (
        <View style={[styles.groupFooter, { backgroundColor: colors.glassFill, borderColor: colors.goldBorder }]} />
      ),
    [colors.glassFill, colors.goldBorder],
  );

  const statusBanner = useMemo(() => {
    if (cpoRejected) {
      return (
        <ParticipationStatusBanner
          tone="lost"
          icon="close-circle-outline"
          title={t('auction.participation.cpoRejectedTitle')}
          message={participation?.cpo?.rejectionReason ?? t('auction.participation.cpoRejectedBody')}
        />
      );
    }
    if (cpoPending) {
      return (
        <ParticipationStatusBanner
          tone="pending"
          icon="shield-sync-outline"
          title={t('auction.participation.cpoPendingTitle')}
          message={t('auction.participation.cpoPendingBody')}
        />
      );
    }
    if (cpoApproved) {
      return (
        <ParticipationStatusBanner
          tone="won"
          icon="check-decagram-outline"
          title={t('auction.participation.cpoApprovedTitle')}
          message={t('auction.participation.cpoApprovedBody')}
        />
      );
    }
    return null;
  }, [cpoApproved, cpoPending, cpoRejected, participation?.cpo?.rejectionReason, t]);

  const listHeader = useMemo(
    () => (
      <View style={styles.listHeader}>
        {statusBanner}
        {showParticipationOverview ? (
          <View style={styles.overviewHeading}>
            <Text style={[Typography.microCaps, { color: colors.goldChampagne, fontSize: 11 }]}>
              {t('auction.participation.itemOverviewTitle')}
            </Text>
            <Text style={[Typography.caption, { color: colors.textMuted }]}>
              {t('auction.participation.itemOverviewSubtitle', {
                active: participationActiveCount,
                total: participationRows.length,
              })}
            </Text>
          </View>
        ) : (
          <>
            {auction?.title ? (
              <Text
                style={[Typography.microCaps, { color: colors.goldChampagne, fontSize: 10 }]}
                numberOfLines={1}
              >
                {auction.title}
              </Text>
            ) : null}
            <BidFlowStepper
              activeStep={flowStep}
              selectedCount={summary.selectedLots.length}
              totalItems={auctionAssets.length}
            />
            <BidGuideCard activeStep={flowStep} />
          </>
        )}
      </View>
    ),
    [auction, colors.goldChampagne, colors.textMuted, flowStep, t, participationRows.length, participationActiveCount, showParticipationOverview, statusBanner, summary.selectedLots.length, auctionAssets.length],
  );

  const bidFooter = auction && !bidSheetOpen ? (
    <BidSummaryBar
      selectedCount={summary.selectedLots.length}
      totalItems={auctionAssets.length}
      totalBidAmount={summary.totalBidAmount}
      cpoAmount={summary.cpoAmount}
      cpoPercent={auction.cpoPercentage ?? 0}
      locked={locked}
      showParticipation={showParticipationOverview}
      participationActiveCount={participationRows.filter((row) => row.status !== 'not_bidding').length}
      participationBidTotal={participationBidTotal}
      uploadingCpo={submittingCpo}
      onUploadCpo={canEdit && !locked ? handleUploadCpoPress : undefined}
      showReuploadCpo={cpoRejected && canEdit}
      onReuploadCpo={cpoRejected && canEdit ? () => setCpoModalVisible(true) : undefined}
    />
  ) : null;

  const sheetBidText = bidSheetAsset ? lotBids[bidSheetAsset.id] ?? '' : '';
  const sheetFeedback = bidSheetAsset
    ? getLotBidFeedback(sheetBidText, bidSheetAsset, { forceShow: true })
    : { kind: 'hint' as const };
  const sheetPosition = bidSheetAsset ? selectedLotIds.indexOf(bidSheetAsset.id) + 1 : undefined;
  const nextIncompleteId = bidSheetAsset ? findNextIncompleteBidId(bidSheetAsset.id) : null;

  if (!isAuthenticated) {
    return (
      <ScreenShell title={t('auction.participation.placeBids')} showBack onBack={() => router.back()} bottomPadding={40}>
        <GlassCard padding={Spacing.lg}>
          <Text style={[Typography.body, { color: colors.textSecondary }]}>
            {t('auction.participation.loginRequired')}
          </Text>
          <GoldButton
            label={t('authRequired.loginCta')}
            onPress={() => router.push(`/(auth)/login?returnTo=${encodeURIComponent(`/auction/${auctionId}/bid`)}` as any)}
          />
        </GlassCard>
      </ScreenShell>
    );
  }

  if (!kycVerified) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.base }}>
        <KycRequiredModal
          visible
          onClose={() => router.back()}
          onVerify={() => router.push('/kyc' as any)}
        />
      </View>
    );
  }

  if (loading && !auction) {
    return (
      <ScreenShell title={t('auction.participation.placeBids')} showBack onBack={() => router.back()} bottomPadding={40}>
        <ActivityIndicator color={colors.goldBright} />
      </ScreenShell>
    );
  }

  if (!auction || !id || error) {
    return (
      <ScreenShell title={t('auction.participation.placeBids')} showBack onBack={() => router.back()} bottomPadding={40}>
        <GlassCard padding={Spacing.lg}>
          <Text style={[Typography.body, { color: colors.danger.fg }]}>
            {error ?? t('dashboard.browse.detailError')}
          </Text>
        </GlassCard>
      </ScreenShell>
    );
  }

  if (participation?.isAuctionOwner || participation?.gates?.isAuctionOwner) {
    return (
      <ScreenShell title={t('auction.participation.placeBids')} showBack onBack={() => router.back()} bottomPadding={40}>
        <GlassCard padding={Spacing.lg}>
          <Text style={[Typography.cardTitle, { color: colors.cream, marginBottom: 8 }]}>
            {t('auction.owner.bannerTitle')}
          </Text>
          <Text style={[Typography.body, { color: colors.textSecondary }]}>
            {t('auction.owner.bannerBody')}
          </Text>
        </GlassCard>
      </ScreenShell>
    );
  }

  if (!documentApproved) {
    return (
      <ScreenShell
        title={t('auction.participation.placeBids')}
        pageTitle={auction.title}
        showBack
        onBack={() => router.back()}
        bottomPadding={40}
      >
        <ParticipationStatusBanner
          tone="pending"
          icon="lock-outline"
          title={t('auction.participation.bidLockedTitle')}
          message={t('auction.participation.bidDocLocked')}
        />
        <GoldButton
          label={t('auction.participation.buyDoc')}
          onPress={() => router.push(`/auction/${id}/buy-doc`)}
        />
      </ScreenShell>
    );
  }

  return (
    <View style={styles.screenHost}>
      <ScreenShell
        title={t('auction.participation.placeBids')}
        showBack
        onBack={() => router.back()}
        scrollable={false}
        stickyFooter={bidFooter}
        noFade
      >
        {auctionAssets.length === 0 ? (
          <ScrollView
            style={styles.staticContent}
            contentContainerStyle={styles.staticScrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {listHeader}
            <GlassCard padding={Spacing.lg}>
              <Text style={[Typography.body, { color: colors.textSecondary }]}>
                {t('auction.participation.noItems')}
              </Text>
            </GlassCard>
          </ScrollView>
        ) : (
          <SectionList
            sections={sections}
            keyExtractor={(item) => item.id}
            renderItem={showParticipationOverview ? renderParticipationItem : renderItem}
            renderSectionHeader={renderSectionHeader}
            renderSectionFooter={renderSectionFooter}
            ListHeaderComponent={listHeader}
            stickySectionHeadersEnabled={false}
            style={styles.sectionList}
            contentContainerStyle={styles.sectionListContent}
            keyboardShouldPersistTaps="handled"
            initialNumToRender={8}
            maxToRenderPerBatch={6}
            windowSize={8}
          />
        )}

        <CpoReadinessSheet
          visible={cpoReadinessVisible}
          items={cpoReadinessItems}
          cpoAmount={summary.cpoAmount}
          onClose={() => setCpoReadinessVisible(false)}
          onContinue={
            isCpoUploadReady(cpoReadinessItems) ? handleCpoReadinessContinue : undefined
          }
        />

        <CpoUploadModal
          visible={cpoModalVisible}
          cpoAmount={summary.cpoAmount}
          submitting={submittingCpo}
          onClose={() => setCpoModalVisible(false)}
          onSubmit={handleUploadCpo}
        />

        <AuctionAssetDetailModal
          visible={detailAsset != null}
          asset={detailAsset}
          onClose={() => setDetailAsset(null)}
        />

      </ScreenShell>

      <BidEntrySheet
        visible={bidSheetAsset != null}
        asset={bidSheetAsset}
        bidText={sheetBidText}
        feedbackKind={sheetFeedback.kind}
        feedbackErrorKey={sheetFeedback.errorKey}
        locked={locked || !canEdit}
        position={sheetPosition}
        total={selectedLotIds.length}
        hasNext={nextIncompleteId != null}
        onBidChange={(text) => bidSheetAsset && handleBidChange(bidSheetAsset.id, text)}
        onSave={handleSaveBidSheet}
        onSaveAndNext={handleSaveAndNextBidSheet}
        onClose={() => setBidSheetAsset(null)}
        onViewPhotos={() => {
          if (bidSheetAsset) {
            setDetailAsset(bidSheetAsset);
            setBidSheetAsset(null);
          }
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screenHost: {
    flex: 1,
  },
  listHeader: {
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  overviewHeading: {
    gap: 3,
    marginTop: Spacing.xs,
  },
  staticContent: {
    flex: 1,
  },
  staticScrollContent: {
    paddingBottom: Spacing.lg,
  },
  sectionList: {
    flex: 1,
    marginHorizontal: -16,
    paddingHorizontal: 16,
  },
  sectionListContent: {
    paddingBottom: Spacing.md,
  },
  groupFooter: {
    height: Spacing.sm,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderBottomLeftRadius: Radii.lg,
    borderBottomRightRadius: Radii.lg,
  },
});
