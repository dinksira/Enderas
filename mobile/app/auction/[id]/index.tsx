import { useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Image } from 'expo-image';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { LockedActionButton } from '@/components/auction/LockedActionButton';
import { LotParticipationOverview } from '@/components/auction/LotParticipationOverview';
import { ParticipationStatusBanner } from '@/components/auction/ParticipationStatusBanner';
import { KycRequiredModal } from '@/components/kyc/KycRequiredModal';
import { ScreenShell } from '@/components/shell/ScreenShell';
import { GlassCard } from '@/components/shell/GlassCard';
import { useAuctionActionGate } from '@/hooks/useAuctionActionGate';
import { useAuctionParticipation } from '@/hooks/useAuctionParticipation';
import { canShowBuyDocButton } from '@/lib/auctionParticipationUtils';
import { useAuctionCountdown } from '@/lib/auctionCountdown';
import { formatEtbAmount, getCategoryTheme, statusTone } from '@/lib/auctionUtils';
import {
  buildLotParticipationRows,
  shouldShowLotParticipationOverview,
} from '@/lib/lotParticipationUtils';
import { useTheme } from '@/lib/appStore';
import { resolveMediaUrl } from '@/lib/media-utils';
import { Typography, Spacing } from '@/theme';
import { toneToStatus, type UiTone } from '@/theme/statusTones';
import type { BrowseAuction } from '@/types/auction';

export default function AuctionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const { colors } = useTheme();
  const auctionId = id ?? '';
  const { auction, participation, lots, auctionAssets, loading, error, documentApproved, kycVerified } =
    useAuctionParticipation(auctionId);
  const { isAuthenticated, gateReason } = useAuctionActionGate();
  const [kycModalVisible, setKycModalVisible] = useState(false);
  const { label: countdownLabel, accentLabel, urgency, expired } = useAuctionCountdown(
    auction?.endDate,
    t('bids.ended'),
  );

  const paymentStatus = participation?.payment?.status ?? 'none';
  const showBuyDoc = canShowBuyDocButton(participation);
  const showParticipationOverview = shouldShowLotParticipationOverview(participation);
  const participationRows = useMemo(
    () => buildLotParticipationRows(lots, participation),
    [lots, participation],
  );
  const participationLocked = !isAuthenticated || gateReason === 'kyc';
  const viewDocLocked = !documentApproved || participationLocked;
  const bidLocked = !documentApproved || !kycVerified || participationLocked;

  const viewDocHint = !isAuthenticated
    ? t('auction.participation.loginRequired')
    : !kycVerified
      ? t('auction.participation.bidKycLocked')
      : !documentApproved
        ? t('auction.participation.viewDocLocked')
        : undefined;

  const bidHint = !isAuthenticated
    ? t('auction.participation.loginRequired')
    : !kycVerified
      ? t('auction.participation.bidKycLocked')
      : !documentApproved
        ? t('auction.participation.bidDocLocked')
        : undefined;

  const handleParticipationAction = (path: string) => {
    if (!isAuthenticated) {
      router.push(`/(auth)/login?returnTo=${encodeURIComponent(path)}` as any);
      return;
    }
    if (!kycVerified) {
      setKycModalVisible(true);
      return;
    }
    router.push(path as any);
  };

  const handleViewDocument = () => {
    if (!isAuthenticated) {
      router.push(`/(auth)/login?returnTo=${encodeURIComponent(`/auction/${id}/document`)}` as any);
      return;
    }
    if (!kycVerified) {
      setKycModalVisible(true);
      return;
    }
    router.push(`/auction/${id}/document` as any);
  };

  const renderParticipationBanner = () => {
    if (paymentStatus === 'pending') {
      return (
        <ParticipationStatusBanner
          tone="pending"
          icon="clock-outline"
          title={t('auction.participation.docPendingTitle')}
          message={t('auction.participation.docPendingBody')}
        />
      );
    }
    if (participation?.cpo?.status === 'pending') {
      return (
        <ParticipationStatusBanner
          tone="pending"
          icon="shield-sync-outline"
          title={t('auction.participation.cpoPendingTitle')}
          message={t('auction.participation.cpoPendingBodyDetailed')}
        />
      );
    }
    if (participation?.cpo?.status === 'approved' || participation?.flags?.hasBid) {
      return (
        <ParticipationStatusBanner
          tone="won"
          icon="check-decagram-outline"
          title={t('auction.participation.cpoApprovedTitle')}
          message={t('auction.participation.cpoApprovedBodyDetailed')}
        />
      );
    }
    if (paymentStatus === 'approved') {
      return (
        <ParticipationStatusBanner
          tone="live"
          icon="file-check-outline"
          title={t('auction.participation.docApprovedTitle')}
          message={t('auction.participation.docApprovedBody')}
        />
      );
    }
    return null;
  };

  if (loading && !auction) {
    return (
      <ScreenShell title={t('dashboard.browse.detailTitle')} showBack onBack={() => router.back()} bottomPadding={40}>
        <View style={styles.centered}>
          <ActivityIndicator color={colors.goldBright} />
        </View>
      </ScreenShell>
    );
  }

  if (!auction || !id || error) {
    return (
      <ScreenShell title={t('dashboard.browse.detailTitle')} showBack onBack={() => router.back()} bottomPadding={40}>
        <GlassCard padding={Spacing.lg}>
          <Text style={[Typography.body, { color: colors.danger.fg }]}>
            {error ?? t('dashboard.browse.detailError')}
          </Text>
        </GlassCard>
      </ScreenShell>
    );
  }

  const auctionStatus =
    typeof auction.status === 'string' && auction.status.length > 0 ? auction.status : 'PENDING';
  const auctionTitle = typeof auction.title === 'string' && auction.title.length > 0 ? auction.title : 'Auction';
  const auctionDescription =
    typeof auction.description === 'string' && auction.description.length > 0
      ? auction.description
      : '—';
  const auctionImageUrls = Array.isArray(auction.imageUrls) ? auction.imageUrls : [];

  const theme = getCategoryTheme(auction.category);
  const tone: UiTone = statusTone(auctionStatus as BrowseAuction['status']);
  const statusColors = toneToStatus(tone, colors);
  const countdownTone =
    urgency === 'critical'
      ? colors.danger
      : urgency === 'soon'
        ? colors.warning
        : urgency === 'warm'
          ? { fg: colors.goldBright, soft: colors.glassFillActive, border: colors.goldBorderActive }
          : urgency === 'expired'
            ? null
            : { fg: colors.goldChampagne, soft: colors.glassFillActive, border: colors.goldBorder };
  const thumbnailUri = resolveMediaUrl(auctionImageUrls[0]);
  const categoryLabel = t(`dashboard.categories.${auction.category}`, {
    defaultValue: auction.category,
  });
  const statusLabel = t(`dashboard.filters.${auctionStatus.toLowerCase()}`);

  return (
    <ScreenShell
      title={t('dashboard.browse.detailEyebrow')}
      pageTitle={auctionTitle}
      showBack
      onBack={() => router.back()}
      bottomPadding={40}
    >
      {renderParticipationBanner()}

      <View style={styles.hero}>
        {thumbnailUri ? (
          <Image source={{ uri: thumbnailUri }} style={StyleSheet.absoluteFill} contentFit="cover" />
        ) : (
          <LinearGradient
            colors={theme.colors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
        )}
        <LinearGradient
          colors={['rgba(0,0,0,0.1)', 'rgba(0,0,0,0.7)']}
          style={StyleSheet.absoluteFill}
        />
        {!thumbnailUri ? (
          <View style={styles.heroIcon}>
            <MaterialCommunityIcons name={theme.icon} size={48} color="rgba(255,250,240,0.4)" />
          </View>
        ) : null}
        <View style={styles.heroBottom}>
          <View
            style={[
              styles.statusChip,
              {
                backgroundColor: statusColors.soft,
                borderColor: statusColors.border,
              },
            ]}
          >
            <View style={[styles.statusDot, { backgroundColor: statusColors.fg }]} />
            <Text style={[Typography.microCaps, { color: statusColors.fg }]}>{statusLabel}</Text>
          </View>
        </View>
      </View>

      <GlassCard padding={16} style={styles.infoCard}>
        <View style={styles.infoGrid}>
          <InfoCell label={t('dashboard.browse.category')} value={categoryLabel} colors={colors} />
          <View
            style={[
              styles.infoCell,
              styles.infoTile,
              styles.countdownCell,
              {
                backgroundColor: colors.glassFill,
                borderColor: countdownTone?.border ?? colors.goldBorder,
              },
            ]}
          >
            <Text style={[styles.infoLabel, { color: colors.textMuted }]}>
              {expired ? t('dashboard.browse.ends') : 'Ends in'}
            </Text>
            <Text
              style={[
                styles.infoValue,
                styles.countdownValue,
                {
                  color: expired ? colors.textMuted : urgency === 'critical' ? colors.danger.fg : colors.cream,
                },
              ]}
            >
              {countdownLabel}
            </Text>
            <Text
              style={[
                Typography.caption,
                styles.countdownSupport,
                { color: expired ? colors.textMuted : urgency === 'critical' ? colors.danger.fg : colors.textSecondary },
              ]}
            >
              {accentLabel}
            </Text>
          </View>
          <InfoCell
            label={t('auction.participation.documentFee')}
            value={formatEtbAmount(Number(auction.documentFee ?? 0))}
            colors={colors}
          />
          <InfoCell
            label={t('auction.participation.lots')}
            value={String(auction?.lotCount ?? lots.length)}
            colors={colors}
            align="right"
          />
        </View>
      </GlassCard>

      <GlassCard padding={16} style={styles.infoCard}>
        <Text style={[styles.sectionTitle, { color: colors.goldChampagne }]}>
          {t('dashboard.browse.description')}
        </Text>
        <Text style={[styles.bodyText, { color: colors.textSecondary }]}>
          {auctionDescription}
        </Text>
      </GlassCard>

      {showParticipationOverview ? (
        <LotParticipationOverview rows={participationRows} onlyActiveLots compact />
      ) : null}

      <GlassCard padding={16}>
        <Text style={[styles.sectionTitle, { color: colors.goldChampagne, marginBottom: 12 }]}>
          {t('auction.participation.actions')}
        </Text>
        <Text style={[styles.actionsIntro, { color: colors.textSecondary }]}>
          {showParticipationOverview
            ? 'Review your participation or jump back into bidding.'
            : 'Unlock documents, inspect the lot pack, and place your bids when you are ready.'}
        </Text>
        <View style={styles.actions}>
          {showBuyDoc ? (
            <LockedActionButton
              label={t('auction.participation.buyDoc')}
              locked={false}
              disabled={false}
              onPress={() => handleParticipationAction(`/auction/${id}/buy-doc`)}
              variant="primary"
              icon="file-document-plus-outline"
              helperText="Unlock auction docs"
            />
          ) : paymentStatus === 'pending' ? (
            <LockedActionButton
              label={t('auction.participation.docUnderReview')}
              locked
              disabled
              lockedHint={t('auction.participation.docPendingBody')}
              onPress={() => router.push(`/auction/${id}/buy-doc`)}
              variant="primary"
              icon="clock-outline"
              helperText="Payment review"
            />
          ) : null}

          <LockedActionButton
            label={t('auction.participation.viewDoc')}
            locked={viewDocLocked}
            disabled={viewDocLocked}
            lockedHint={viewDocHint}
            onPress={() => {
              void handleViewDocument();
            }}
            variant="primary"
            icon="eye-outline"
            helperText="Preview documents"
          />

          <LockedActionButton
            label={
              showParticipationOverview
                ? t('auction.participation.viewYourBids')
                : t('auction.participation.placeBids')
            }
            locked={bidLocked}
            disabled={bidLocked}
            lockedHint={bidHint}
            onPress={() => handleParticipationAction(`/auction/${id}/bid`)}
            variant="primary"
            icon="gavel"
            helperText="Join the auction"
          />
        </View>
      </GlassCard>

      <KycRequiredModal
        visible={kycModalVisible}
        onClose={() => setKycModalVisible(false)}
        onVerify={() => {
          setKycModalVisible(false);
          router.push('/kyc' as any);
        }}
      />
    </ScreenShell>
  );
}

function InfoCell({
  label,
  value,
  colors,
  align = 'left',
  valueColor,
}: {
  label: string;
  value: string;
  colors: ReturnType<typeof useTheme>['colors'];
  align?: 'left' | 'right';
  valueColor?: string;
}) {
  return (
    <View
      style={[
        styles.infoCell,
        styles.infoTile,
        {
          alignItems: align === 'right' ? 'flex-end' : 'flex-start',
          backgroundColor: colors.glassFill,
          borderColor: colors.goldBorder,
        },
      ]}
    >
      <Text style={[styles.infoLabel, { color: colors.textMuted }]}>{label}</Text>
      <Text style={[styles.infoValue, styles.countdownValue, { color: valueColor ?? colors.cream }]}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  centered: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  hero: {
    height: 220,
    borderRadius: 18,
    overflow: 'hidden',
    marginBottom: 14,
    position: 'relative',
  },
  heroIcon: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
  },
  statusChip: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  infoCard: {
    marginBottom: 14,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  infoCell: {
    width: '47%',
    gap: 4,
  },
  infoTile: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 12,
    minHeight: 82,
    justifyContent: 'center',
  },
  countdownCell: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  infoLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.1,
    textTransform: 'uppercase',
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  countdownValue: {
    fontVariant: ['tabular-nums'],
    textAlign: 'right',
  },
  countdownSupport: {
    marginTop: 2,
    textAlign: 'right',
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  bodyText: {
    fontSize: 15,
    fontWeight: '500',
    lineHeight: 23,
    letterSpacing: 0.2,
  },
  actions: {
    gap: 14,
  },
  actionsIntro: {
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 14,
  },
});
