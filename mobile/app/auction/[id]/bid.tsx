import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, SectionList, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { GoldButton } from '@/components/auth';
import { AuctionAssetDetailModal } from '@/components/auction/AuctionAssetDetailModal';
import { BidSummaryBar } from '@/components/auction/BidSummaryBar';
import { CpoUploadModal } from '@/components/auction/CpoUploadModal';
import { LotBidCard } from '@/components/auction/LotBidCard';
import { LotParticipationOverview } from '@/components/auction/LotParticipationOverview';
import { ParticipationStatusBanner } from '@/components/auction/ParticipationStatusBanner';
import { KycRequiredModal } from '@/components/kyc/KycRequiredModal';
import { ScreenShell } from '@/components/shell/ScreenShell';
import { GlassCard } from '@/components/shell/GlassCard';
import { useAuctionActionGate } from '@/hooks/useAuctionActionGate';
import { useAuctionParticipation } from '@/hooks/useAuctionParticipation';
import { formatLotOrderLabel, mapAuctionAssetForDisplay } from '@/lib/auctionAssetUtils';
import { validateLotBid, getLotBidFeedback } from '@/lib/auctionParticipationUtils';
import { computeRequiredCpoFromBidAmounts } from '@/lib/auctionLotUtils';
import {
  buildLotParticipationRows,
  shouldShowLotParticipationOverview,
  sumSubmittedBidAmounts,
} from '@/lib/lotParticipationUtils';
import { useTheme } from '@/lib/appStore';
import { cpoApi } from '@/services/cpoApi';
import { fileUploadApi } from '@/services/fileUploadApi';
import { Typography, Spacing } from '@/theme';
import type { AuctionAssetApi, AuctionLotApi } from '@/types/auctionApi';
import type { AuctionLot } from '@/types/auctionParticipation';

const BID_SAVE_DEBOUNCE_MS = 600;

type LotSection = {
  title: string;
  lotId: string;
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
  const [showErrors, setShowErrors] = useState(false);
  const [submittingCpo, setSubmittingCpo] = useState(false);
  const [lotBids, setLotBids] = useState<Record<string, string>>({});
  const [focusLotId, setFocusLotId] = useState<string | null>(null);
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

  const bidErrors = useMemo(() => {
    const errors: Record<string, string | null> = {};
    for (const lot of auctionAssets) {
      if (!selectedLotIds.includes(lot.id)) continue;
      errors[lot.id] = validateLotBid(parseBidAmount(lotBids[lot.id] ?? ''), mapAuctionAssetForDisplay(lot));
    }
    return errors;
  }, [lotBids, auctionAssets, selectedLotIds]);

  const hasBidErrors = Object.values(bidErrors).some(Boolean);
  const allSelectedLotsSaved = selectedLotIds.every((lotId) => {
    const lot = auctionAssets.find((item) => item.id === lotId);
    if (!lot) return false;
    const amount = parseBidAmount(lotBids[lotId] ?? '');
    if (validateLotBid(amount, mapAuctionAssetForDisplay(lot)) !== null) return false;
    return selectedDrafts.some((draft) => draft.auctionAssetId === lotId && draft.amount === amount);
  });
  const canUploadCpo =
    canEdit && !locked && selectedLotIds.length > 0 && !hasBidErrors && allSelectedLotsSaved && summary.cpoAmount > 0;

  const sections: LotSection[] = useMemo(
    () =>
      lots.map((lot: AuctionLotApi, lotIndex: number) => ({
        title: `${formatLotOrderLabel(lotIndex)}${lot.title ? ` · ${lot.title}` : ''}`,
        lotId: lot.id,
        data: lot.assets ?? [],
      })),
    [lots],
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

  const handleToggleLot = async (lotId: string) => {
    if (!canEdit || locked) return;
    if (lotId in lotBids) {
      const existing = selectedDrafts.find((draft) => draft.auctionAssetId === lotId);
      const pending = saveTimersRef.current.get(lotId);
      if (pending) {
        clearTimeout(pending);
        saveTimersRef.current.delete(lotId);
      }
      setFocusLotId(null);
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
    setFocusLotId(lotId);
  };

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

  const handleOpenCpoModal = () => {
    setShowErrors(true);
    if (!canUploadCpo) return;
    setCpoModalVisible(true);
  };

  const renderSectionHeader = useCallback(
    ({ section }: { section: LotSection }) => (
      <Text style={[Typography.caption, styles.sectionHeader, { color: colors.goldChampagne }]}>
        {section.title}
      </Text>
    ),
    [colors.goldChampagne],
  );

  const renderItem = useCallback(
    ({ item }: { item: AuctionAssetApi }) => {
      const displayLot = mapAuctionAssetForDisplay(item);
      const selected = item.id in lotBids;
      return (
        <LotBidCard
          lot={displayLot}
          selected={selected}
          bidText={lotBids[item.id] ?? ''}
          locked={locked || !canEdit}
          autoFocus={focusLotId === item.id}
          feedback={getLotBidFeedback(lotBids[item.id] ?? '', displayLot, {
            forceShow: showErrors,
          })}
          onToggle={() => void handleToggleLot(item.id)}
          onOpenDetail={() => setDetailAsset(displayLot)}
          onBidChange={(text) => handleBidChange(item.id, text)}
          onAutoFocusHandled={() => {
            setFocusLotId((current) => (current === item.id ? null : current));
          }}
        />
      );
    },
    [canEdit, focusLotId, handleBidChange, locked, lotBids, showErrors],
  );

  const listHeader = useMemo(
    () => (
      <View style={styles.listHeader}>
        {cpoPending ? (
          <ParticipationStatusBanner
            tone="pending"
            icon="shield-sync-outline"
            title={t('auction.participation.cpoPendingTitle')}
            message={t('auction.participation.cpoPendingBodyDetailed')}
          />
        ) : null}

        {cpoApproved ? (
          <ParticipationStatusBanner
            tone="won"
            icon="check-decagram-outline"
            title={t('auction.participation.cpoApprovedTitle')}
            message={t('auction.participation.cpoApprovedBodyDetailed')}
          />
        ) : null}

        {cpoRejected ? (
          <ParticipationStatusBanner
            tone="lost"
            icon="close-circle-outline"
            title={t('auction.participation.cpoRejectedTitle')}
            message={participation?.cpo?.rejectionReason ?? t('auction.participation.cpoRejectedBody')}
          />
        ) : null}

        {showParticipationOverview ? (
          <LotParticipationOverview rows={participationRows} />
        ) : null}

        {!showParticipationOverview && auctionAssets.length > 0 ? (
          <Text style={[Typography.body, { color: colors.textSecondary, marginBottom: 4 }]}>
            {t('auction.participation.selectLotsHint')}
          </Text>
        ) : null}

        {canEdit && !locked ? (
          <GoldButton
            label={submittingCpo ? t('common.submitting') : t('auction.participation.uploadCpo')}
            onPress={handleOpenCpoModal}
            disabled={!canUploadCpo || submittingCpo}
          />
        ) : null}

        {cpoRejected && canEdit ? (
          <GoldButton
            label={t('auction.participation.reuploadCpo')}
            onPress={() => setCpoModalVisible(true)}
            variant="outline"
          />
        ) : null}
      </View>
    ),
    [
      auctionAssets.length,
      canEdit,
      canUploadCpo,
      colors.textSecondary,
      cpoApproved,
      cpoPending,
      cpoRejected,
      handleOpenCpoModal,
      locked,
      participation?.cpo?.rejectionReason,
      participationRows,
      showParticipationOverview,
      submittingCpo,
      t,
    ],
  );

  const stickyFooter = auction ? (
    <BidSummaryBar
      selectedCount={summary.selectedLots.length}
      totalLots={auctionAssets.length}
      totalBidAmount={summary.totalBidAmount}
      cpoAmount={summary.cpoAmount}
      cpoPercent={auction.cpoPercentage ?? 0}
      locked={locked}
      showParticipation={showParticipationOverview}
      participationActiveCount={participationRows.filter((row) => row.status !== 'not_bidding').length}
      participationBidTotal={participationBidTotal}
    />
  ) : null;

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
    <ScreenShell
      title={t('auction.participation.placeBids')}
      pageTitle={auction.title}
      showBack
      onBack={() => router.back()}
      keyboardAware
      keyboardToolbar
      keyboardToolbarArrows={false}
      keyboardBottomOffset={16}
      stickyFooter={stickyFooter}
      scrollable={false}
      noFade
    >
      {showParticipationOverview || auctionAssets.length === 0 ? (
        <View style={styles.staticContent}>
          {listHeader}
          {auctionAssets.length === 0 ? (
            <GlassCard padding={Spacing.lg}>
              <Text style={[Typography.body, { color: colors.textSecondary }]}>
                {t('auction.participation.noLots')}
              </Text>
            </GlassCard>
          ) : null}
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          renderSectionHeader={renderSectionHeader}
          ListHeaderComponent={listHeader}
          stickySectionHeadersEnabled
          style={styles.sectionList}
          contentContainerStyle={{ paddingBottom: 160 }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          automaticallyAdjustKeyboardInsets
          initialNumToRender={6}
          maxToRenderPerBatch={4}
          windowSize={7}
          removeClippedSubviews
        />
      )}

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
  );
}

const styles = StyleSheet.create({
  listHeader: {
    gap: 12,
    marginBottom: 8,
  },
  staticContent: {
    paddingBottom: 160,
  },
  sectionHeader: {
    fontWeight: '700',
    letterSpacing: 0.3,
    marginBottom: 6,
    marginTop: 4,
  },
  sectionList: {
    flex: 1,
    marginHorizontal: -16,
    paddingHorizontal: 16,
  },
});
