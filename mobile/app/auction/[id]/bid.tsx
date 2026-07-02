import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { GoldButton } from '@/components/auth';
import { CpoUploadModal } from '@/components/auction/CpoUploadModal';
import { LotBidCard } from '@/components/auction/LotBidCard';
import { LotParticipationOverview } from '@/components/auction/LotParticipationOverview';
import { ParticipationStatusBanner } from '@/components/auction/ParticipationStatusBanner';
import { KycRequiredModal } from '@/components/kyc/KycRequiredModal';
import { ScreenShell } from '@/components/shell/ScreenShell';
import { GlassCard } from '@/components/shell/GlassCard';
import { useAuctionActionGate } from '@/hooks/useAuctionActionGate';
import { useAuctionParticipation } from '@/hooks/useAuctionParticipation';
import { formatEtbAmount } from '@/lib/auctionUtils';
import { validateLotBid, getLotBidFeedback } from '@/lib/auctionParticipationUtils';
import {
  buildLotParticipationRows,
  shouldShowLotParticipationOverview,
  sumSubmittedBidAmounts,
} from '@/lib/lotParticipationUtils';
import { useTheme } from '@/lib/appStore';
import { cpoApi } from '@/services/cpoApi';
import { fileUploadApi } from '@/services/fileUploadApi';
import { Typography, Spacing } from '@/theme';
import type { AuctionLot } from '@/types/auctionParticipation';

function mapLotForCard(lot: {
  id: string;
  auctionId: string;
  lotLabel: string;
  reservePrice: number;
  sortOrder: number;
  assetTitle?: string | null;
  assetType?: string | null;
  assetLocation?: string | null;
  imageUrls?: string[];
}): AuctionLot {
  return {
    id: lot.id,
    auctionId: lot.auctionId,
    lotLabel: lot.lotLabel,
    title: lot.assetTitle ?? lot.lotLabel,
    description: lot.assetLocation ?? '',
    category: lot.assetType ?? 'other_assets',
    imageUrls: lot.imageUrls ?? [],
    reservePrice: lot.reservePrice,
    sortOrder: lot.sortOrder,
  };
}

export default function AuctionBidScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const { colors } = useTheme();
  const auctionId = id ?? '';
  const {
    auction,
    participation,
    lots,
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
  const hydratedDraftIdsRef = useRef<Set<string>>(new Set());

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

  const parseBidAmount = (text: string): number => {
    const digits = text.replace(/[^\d]/g, '');
    return digits ? Number(digits) : 0;
  };

  const summary = useMemo(() => {
    const selectedLots = lots.filter((lot) => selectedLotIds.includes(lot.id));
    const totalBidAmount = selectedLots.reduce((sum, lot) => sum + parseBidAmount(lotBids[lot.id] ?? ''), 0);
    const cpoAmount =
      participation?.requiredCpoAmountPreview ??
      participation?.cpo?.requiredCpoAmount ??
      0;
    return {
      selectedLots,
      totalBidAmount,
      cpoAmount: Number(cpoAmount),
    };
  }, [lots, lotBids, participation, selectedLotIds]);

  const bidErrors = useMemo(() => {
    const errors: Record<string, string | null> = {};
    for (const lot of lots) {
      if (!selectedLotIds.includes(lot.id)) continue;
      errors[lot.id] = validateLotBid(parseBidAmount(lotBids[lot.id] ?? ''), mapLotForCard(lot));
    }
    return errors;
  }, [lotBids, lots, selectedLotIds]);

  const hasBidErrors = Object.values(bidErrors).some(Boolean);
  const allSelectedLotsSaved = selectedLotIds.every((lotId) => {
    const lot = lots.find((item) => item.id === lotId);
    if (!lot) return false;
    const amount = parseBidAmount(lotBids[lotId] ?? '');
    if (validateLotBid(amount, mapLotForCard(lot)) !== null) return false;
    return selectedDrafts.some((draft) => draft.auctionAssetId === lotId && draft.amount === amount);
  });
  const canUploadCpo =
    canEdit && !locked && selectedLotIds.length > 0 && !hasBidErrors && allSelectedLotsSaved && summary.cpoAmount > 0;

  const handleToggleLot = async (lotId: string) => {
    if (!canEdit || locked) return;
    if (lotId in lotBids) {
      const existing = selectedDrafts.find((draft) => draft.auctionAssetId === lotId);
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

  const handleBidChange = async (lotId: string, text: string) => {
    setLotBids((prev) => ({ ...prev, [lotId]: text }));
    if (!canEdit || locked) return;

    const amount = parseBidAmount(text);
    const existing = selectedDrafts.find((draft) => draft.auctionAssetId === lotId);

    if (!amount) {
      if (existing) {
        await clearLotSelection(lotId, existing.id);
      }
      return;
    }

    const lot = lots.find((item) => item.id === lotId);
    if (!lot) return;

    const validationError = validateLotBid(amount, mapLotForCard(lot));
    if (validationError) {
      if (existing) {
        await clearLotSelection(lotId, existing.id);
      }
      return;
    }

    await upsertLotBid(lotId, amount);
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

  const handleOpenCpoModal = () => {
    setShowErrors(true);
    if (!canUploadCpo) return;
    setCpoModalVisible(true);
  };

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
      bottomPadding={120}
      keyboardAware
      keyboardToolbar
      keyboardToolbarArrows={false}
      keyboardBottomOffset={16}
    >
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

      <GlassCard padding={16} style={styles.summaryCard}>
        <Text style={[styles.sectionTitle, { color: colors.goldChampagne }]}>
          {showParticipationOverview
            ? t('auction.participation.participationSummary')
            : t('auction.participation.bidSummary')}
        </Text>
        <View style={styles.summaryRow}>
          <Text style={[Typography.caption, { color: colors.textMuted }]}>
            {t('auction.participation.selectedLots')}
          </Text>
          <Text style={[Typography.bodyMedium, { color: colors.cream }]}>
            {showParticipationOverview
              ? participationRows.filter((row) => row.status !== 'not_bidding').length
              : summary.selectedLots.length}
          </Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={[Typography.caption, { color: colors.textMuted }]}>
            {t('auction.participation.totalBidAmount')}
          </Text>
          <Text style={[Typography.bodyMedium, { color: colors.cream }]}>
            {formatEtbAmount(showParticipationOverview ? participationBidTotal : summary.totalBidAmount)}
          </Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={[Typography.caption, { color: colors.textMuted }]}>
            {t('auction.participation.cpoAmount', { percent: auction.cpoPercentage })}
          </Text>
          <Text style={[Typography.statValue, { color: colors.goldBright, fontSize: 18 }]}>
            {formatEtbAmount(summary.cpoAmount)}
          </Text>
        </View>
        {locked ? (
          <Text style={[Typography.caption, { color: colors.textMuted, marginTop: 8 }]}>
            {cpoPending
              ? t('auction.participation.cpoPendingLotsHint')
              : cpoApproved
                ? t('auction.participation.cpoApprovedLotsHint')
                : t('auction.participation.bidsLockedHint')}
          </Text>
        ) : (
          <Text style={[Typography.caption, { color: colors.textMuted, marginTop: 8 }]}>
            {t('auction.participation.selectLotsHint')}
          </Text>
        )}
      </GlassCard>

      {showParticipationOverview ? (
        <LotParticipationOverview rows={participationRows} />
      ) : null}

      {lots.length === 0 ? (
        <GlassCard padding={Spacing.lg}>
          <Text style={[Typography.body, { color: colors.textSecondary }]}>
            {t('auction.participation.noLots')}
          </Text>
        </GlassCard>
      ) : showParticipationOverview ? null : (
        lots.map((lot) => {
          const selected = lot.id in lotBids;
          return (
            <LotBidCard
              key={lot.id}
              lot={mapLotForCard(lot)}
              selected={selected}
              bidText={lotBids[lot.id] ?? ''}
              locked={locked || !canEdit}
              autoFocus={focusLotId === lot.id}
              feedback={getLotBidFeedback(lotBids[lot.id] ?? '', mapLotForCard(lot), {
                forceShow: showErrors,
              })}
              onToggle={() => void handleToggleLot(lot.id)}
              onBidChange={(text) => void handleBidChange(lot.id, text)}
              onAutoFocusHandled={() => {
                setFocusLotId((current) => (current === lot.id ? null : current));
              }}
            />
          );
        })
      )}

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

      <CpoUploadModal
        visible={cpoModalVisible}
        cpoAmount={summary.cpoAmount}
        submitting={submittingCpo}
        onClose={() => setCpoModalVisible(false)}
        onSubmit={handleUploadCpo}
      />
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  summaryCard: {
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
});
