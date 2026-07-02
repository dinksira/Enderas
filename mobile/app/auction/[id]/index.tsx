import { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, View } from 'react-native';
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
import { openAuctionDocumentInBrowser } from '@/lib/auctionDocumentUtils';
import { formatEtbAmount, getCategoryTheme, statusTone } from '@/lib/auctionUtils';
import {
  buildLotParticipationRows,
  shouldShowLotParticipationOverview,
} from '@/lib/lotParticipationUtils';
import { useTheme } from '@/lib/appStore';
import { useAuthStore } from '@/lib/authStore';
import { resolveMediaUrl } from '@/lib/media-utils';
import { Typography, Spacing } from '@/theme';
import { toneToStatus, type UiTone } from '@/theme/statusTones';
import type { BrowseAuction } from '@/types/auction';

export default function AuctionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const { colors } = useTheme();
  const auctionId = id ?? '';
  const { auction, participation, lots, loading, error, documentApproved, kycVerified } =
    useAuctionParticipation(auctionId);
  const { isAuthenticated, gateReason } = useAuctionActionGate();
  const accessToken = useAuthStore((s) => s.accessToken);
  const [kycModalVisible, setKycModalVisible] = useState(false);

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

  const handleViewDocument = async () => {
    if (!isAuthenticated) {
      router.push(`/(auth)/login?returnTo=${encodeURIComponent(`/auction/${id}/document`)}` as any);
      return;
    }
    if (!kycVerified) {
      setKycModalVisible(true);
      return;
    }
    if (!documentApproved) {
      router.push(`/auction/${id}/document` as any);
      return;
    }

    const opened = await openAuctionDocumentInBrowser(id, auction?.documents, 0, accessToken);
    if (!opened) {
      Alert.alert(t('auction.participation.downloadErrorTitle'), t('auction.participation.downloadErrorBody'));
    }
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

  const theme = getCategoryTheme(auction.category);
  const tone: UiTone = statusTone(auction.status as BrowseAuction['status']);
  const statusColors = toneToStatus(tone, colors);
  const thumbnailUri = resolveMediaUrl(auction.imageUrls?.[0]);
  const categoryLabel = t(`dashboard.categories.${auction.category}`, {
    defaultValue: auction.category,
  });
  const statusLabel = t(`dashboard.filters.${auction.status.toLowerCase()}`);

  return (
    <ScreenShell
      title={t('dashboard.browse.detailEyebrow')}
      pageTitle={auction.title}
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
        <View style={styles.infoRow}>
          <InfoCell label={t('dashboard.browse.category')} value={categoryLabel} colors={colors} />
          <InfoCell
            label={t('dashboard.browse.ends')}
            value={auction.endingDate ?? auction.endDate ?? '—'}
            colors={colors}
            align="right"
          />
        </View>
        <View style={[styles.infoRow, { marginTop: 12 }]}>
          <InfoCell
            label={t('auction.participation.documentFee')}
            value={formatEtbAmount(auction.documentFee)}
            colors={colors}
          />
          <InfoCell
            label={t('auction.participation.lots')}
            value={String(lots.length)}
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
          {auction.description}
        </Text>
      </GlassCard>

      {showParticipationOverview ? (
        <LotParticipationOverview rows={participationRows} onlyActiveLots compact />
      ) : null}

      <GlassCard padding={16}>
        <Text style={[styles.sectionTitle, { color: colors.goldChampagne, marginBottom: 12 }]}>
          {t('auction.participation.actions')}
        </Text>
        <View style={styles.actions}>
          {showBuyDoc ? (
            <LockedActionButton
              label={t('auction.participation.buyDoc')}
              locked={false}
              onPress={() => handleParticipationAction(`/auction/${id}/buy-doc`)}
            />
          ) : paymentStatus === 'pending' ? (
            <LockedActionButton
              label={t('auction.participation.docUnderReview')}
              locked
              lockedHint={t('auction.participation.docPendingBody')}
              onPress={() => router.push(`/auction/${id}/buy-doc`)}
              variant="outline"
            />
          ) : null}

          <LockedActionButton
            label={t('auction.participation.viewDoc')}
            locked={viewDocLocked}
            lockedHint={viewDocHint}
            onPress={() => {
              void handleViewDocument();
            }}
            variant="outline"
          />

          <LockedActionButton
            label={
              showParticipationOverview
                ? t('auction.participation.viewYourBids')
                : t('auction.participation.placeBids')
            }
            locked={bidLocked}
            lockedHint={bidHint}
            onPress={() => handleParticipationAction(`/auction/${id}/bid`)}
            variant="outline"
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
    <View style={[styles.infoCell, align === 'right' && { alignItems: 'flex-end' }]}>
      <Text style={[styles.infoLabel, { color: colors.textMuted }]}>{label}</Text>
      <Text style={[styles.infoValue, { color: valueColor ?? colors.cream }]}>{value}</Text>
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
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  infoCell: {
    flex: 1,
    gap: 4,
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
    gap: 12,
  },
});
