import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { GoldButton } from '@/components/auth';
import { CpoUploadModal } from '@/components/auction/CpoUploadModal';
import { LotBidCard } from '@/components/auction/LotBidCard';
import { ParticipationStatusBanner } from '@/components/auction/ParticipationStatusBanner';
import { ScreenShell } from '@/components/shell/ScreenShell';
import { GlassCard } from '@/components/shell/GlassCard';
import { findMockAuctionById } from '@/data/mockAuctions';
import { useAuctionParticipation } from '@/hooks/useAuctionParticipation';
import { formatEtbAmount } from '@/lib/auctionUtils';
import { validateLotBid } from '@/lib/auctionParticipationUtils';
import { useTheme } from '@/lib/appStore';
import { Typography, Spacing } from '@/theme';

export default function AuctionBidScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const { colors } = useTheme();
  const auction = useMemo(() => (id ? findMockAuctionById(id) : undefined), [id]);
  const { record, lots, canBid, kycVerified, summary, actions } = useAuctionParticipation(id ?? '');
  const [cpoModalVisible, setCpoModalVisible] = useState(false);
  const [showErrors, setShowErrors] = useState(false);

  if (!auction || !id) {
    return (
      <ScreenShell title={t('auction.participation.placeBids')} showBack onBack={() => router.back()} bottomPadding={40}>
        <GlassCard padding={Spacing.lg}>
          <Text style={[Typography.body, { color: colors.danger.fg }]}>
            {t('dashboard.browse.detailError')}
          </Text>
        </GlassCard>
      </ScreenShell>
    );
  }

  if (!canBid) {
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
          message={
            !kycVerified
              ? t('auction.participation.bidKycLocked')
              : t('auction.participation.bidDocLocked')
          }
        />
        {!kycVerified ? (
          <GoldButton label={t('profile.menu.kycVerification')} onPress={() => router.push('/kyc')} />
        ) : (
          <GoldButton
            label={t('auction.participation.buyDoc')}
            onPress={() => router.push(`/auction/${id}/buy-doc`)}
          />
        )}
      </ScreenShell>
    );
  }

  const locked = record.cpo.locked;
  const cpoPending = locked && record.cpo.status === 'pending';
  const cpoApproved = record.cpo.status === 'approved';
  const cpoRejected = record.cpo.status === 'rejected';

  const bidErrors = useMemo(() => {
    const errors: Record<string, string | null> = {};
    for (const lot of lots) {
      if (!record.cpo.selectedLotIds.includes(lot.id)) continue;
      const bid = record.cpo.bids.find((item) => item.lotId === lot.id);
      errors[lot.id] = validateLotBid(bid?.amount ?? 0, lot);
    }
    return errors;
  }, [lots, record.cpo.bids, record.cpo.selectedLotIds]);

  const hasBidErrors = Object.values(bidErrors).some(Boolean);
  const canUploadCpo =
    !locked && summary.selectedLots.length > 0 && !hasBidErrors && summary.cpoAmount > 0;

  const handleUploadCpo = (payload: { receiptUri: string; receiptName: string }) => {
    actions.submitCpoReceipt(id, payload);
  };

  const handleOpenCpoModal = () => {
    setShowErrors(true);
    if (!canUploadCpo) return;
    setCpoModalVisible(true);
  };

  return (
    <ScreenShell
      title={t('auction.participation.placeBids')}
      pageTitle={auction.title}
      showBack
      onBack={() => router.back()}
      bottomPadding={40}
    >
      {cpoPending ? (
        <ParticipationStatusBanner
          tone="pending"
          icon="shield-sync-outline"
          title={t('auction.participation.cpoPendingTitle')}
          message={t('auction.participation.cpoPendingBody')}
        />
      ) : null}

      {cpoApproved ? (
        <ParticipationStatusBanner
          tone="won"
          icon="check-decagram-outline"
          title={t('auction.participation.cpoApprovedTitle')}
          message={t('auction.participation.cpoApprovedBody')}
        />
      ) : null}

      {cpoRejected ? (
        <ParticipationStatusBanner
          tone="lost"
          icon="close-circle-outline"
          title={t('auction.participation.cpoRejectedTitle')}
          message={t('auction.participation.cpoRejectedBody')}
        />
      ) : null}

      <GlassCard padding={16} style={styles.summaryCard}>
        <Text style={[styles.sectionTitle, { color: colors.goldChampagne }]}>
          {t('auction.participation.bidSummary')}
        </Text>
        <View style={styles.summaryRow}>
          <Text style={[Typography.caption, { color: colors.textMuted }]}>
            {t('auction.participation.selectedLots')}
          </Text>
          <Text style={[Typography.bodyMedium, { color: colors.cream }]}>
            {summary.selectedLots.length}
          </Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={[Typography.caption, { color: colors.textMuted }]}>
            {t('auction.participation.totalBidAmount')}
          </Text>
          <Text style={[Typography.bodyMedium, { color: colors.cream }]}>
            {formatEtbAmount(summary.totalBidAmount)}
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
            {t('auction.participation.bidsLockedHint')}
          </Text>
        ) : (
          <Text style={[Typography.caption, { color: colors.textMuted, marginTop: 8 }]}>
            {t('auction.participation.selectLotsHint')}
          </Text>
        )}
      </GlassCard>

      {lots.length === 0 ? (
        <GlassCard padding={Spacing.lg}>
          <Text style={[Typography.body, { color: colors.textSecondary }]}>
            {t('auction.participation.noLots')}
          </Text>
        </GlassCard>
      ) : (
        lots.map((lot) => {
          const selected = record.cpo.selectedLotIds.includes(lot.id);
          const bid = record.cpo.bids.find((item) => item.lotId === lot.id);
          return (
            <LotBidCard
              key={lot.id}
              lot={lot}
              selected={selected}
              bidAmount={bid?.amount ?? 0}
              locked={locked}
              errorKey={showErrors && selected ? bidErrors[lot.id] : null}
              onToggle={() => actions.toggleLotSelection(id, lot.id)}
              onBidChange={(amount) => actions.updateLotBid(id, lot.id, amount)}
            />
          );
        })
      )}

      {!locked ? (
        <GoldButton
          label={t('auction.participation.uploadCpo')}
          onPress={handleOpenCpoModal}
          disabled={!canUploadCpo}
        />
      ) : null}

      {cpoPending ? (
        <View style={styles.simRow}>
          <Text style={[Typography.caption, { color: colors.textMuted, flex: 1 }]}>
            {t('auction.participation.simulateHint')}
          </Text>
          <Pressable onPress={() => actions.simulateApproveCpo(id)}>
            <Text style={[Typography.caption, { color: colors.goldBright, fontWeight: '700' }]}>
              {t('auction.participation.simulateApprove')}
            </Text>
          </Pressable>
        </View>
      ) : null}

      {cpoRejected ? (
        <GoldButton
          label={t('auction.participation.reuploadCpo')}
          onPress={() => setCpoModalVisible(true)}
          variant="outline"
        />
      ) : null}

      <CpoUploadModal
        visible={cpoModalVisible}
        cpoAmount={summary.cpoAmount}
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
  simRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 14,
    paddingHorizontal: 4,
  },
});
