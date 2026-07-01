import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Image } from 'expo-image';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { LockedActionButton } from '@/components/auction/LockedActionButton';
import { ParticipationDemoChip } from '@/components/auction/ParticipationDemoChip';
import { ParticipationStatusBanner } from '@/components/auction/ParticipationStatusBanner';
import { ScreenShell } from '@/components/shell/ScreenShell';
import { GlassCard } from '@/components/shell/GlassCard';
import { findMockAuctionById } from '@/data/mockAuctions';
import { getMockLotsForAuction } from '@/data/mockAuctionLots';
import { useAuctionParticipation } from '@/hooks/useAuctionParticipation';
import { formatEtbAmount, getCategoryTheme, statusTone } from '@/lib/auctionUtils';
import { useTheme } from '@/lib/appStore';
import { Typography, Spacing } from '@/theme';
import { toneToStatus, type UiTone } from '@/theme/statusTones';

export default function AuctionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const { colors } = useTheme();

  const auction = useMemo(() => (id ? findMockAuctionById(id) : undefined), [id]);
  const participation = useAuctionParticipation(id ?? '');
  const lots = useMemo(() => (id ? getMockLotsForAuction(id) : []), [id]);

  if (!auction || !id) {
    return (
      <ScreenShell
        title={t('dashboard.browse.detailTitle')}
        showBack
        onBack={() => router.back()}
        bottomPadding={40}
      >
        <GlassCard padding={Spacing.lg}>
          <Text style={[Typography.body, { color: colors.danger.fg }]}>
            {t('dashboard.browse.detailError')}
          </Text>
        </GlassCard>
      </ScreenShell>
    );
  }

  const theme = getCategoryTheme(auction.category);
  const tone: UiTone = statusTone(auction.status);
  const statusColors = toneToStatus(tone, colors);
  const thumbnailUri = auction.imageUrls[0];
  const categoryLabel = t(`dashboard.categories.${auction.category}`, {
    defaultValue: auction.category,
  });
  const statusLabel = t(`dashboard.filters.${auction.status.toLowerCase()}`);

  const paymentStatus = participation.record.documentPayment.status;
  const showBuyDoc =
    paymentStatus === 'none' || paymentStatus === 'rejected';
  const docUnlocked = participation.documentApproved;
  const viewDocLocked = !docUnlocked;
  const bidLocked = !participation.canBid;

  const viewDocHint = viewDocLocked
    ? t('auction.participation.viewDocLocked')
    : undefined;
  const bidHint = !participation.kycVerified
    ? t('auction.participation.bidKycLocked')
    : viewDocLocked
      ? t('auction.participation.bidDocLocked')
      : undefined;

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
    if (paymentStatus === 'approved' && participation.record.cpo.locked) {
      if (participation.record.cpo.status === 'pending') {
        return (
          <ParticipationStatusBanner
            tone="pending"
            icon="shield-sync-outline"
            title={t('auction.participation.cpoPendingTitle')}
            message={t('auction.participation.cpoPendingBody')}
          />
        );
      }
      if (participation.record.cpo.status === 'approved') {
        return (
          <ParticipationStatusBanner
            tone="won"
            icon="check-decagram-outline"
            title={t('auction.participation.cpoApprovedTitle')}
            message={t('auction.participation.cpoApprovedBody')}
          />
        );
      }
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

  return (
    <ScreenShell
      title={t('dashboard.browse.detailEyebrow')}
      pageTitle={auction.title}
      showBack
      onBack={() => router.back()}
      bottomPadding={40}
    >
      <ParticipationDemoChip auctionId={id} />
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
          <InfoCell
            label={t('dashboard.browse.category')}
            value={categoryLabel}
            colors={colors}
          />
          <InfoCell
            label={t('dashboard.browse.ends')}
            value={auction.endingDate}
            colors={colors}
            align="right"
          />
        </View>
        <View style={[styles.infoRow, { marginTop: 12 }]}>
          <InfoCell
            label={t('auction.participation.documentFee')}
            value={formatEtbAmount(auction.documentPrice)}
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

      <GlassCard padding={16}>
        <Text style={[styles.sectionTitle, { color: colors.goldChampagne, marginBottom: 12 }]}>
          {t('auction.participation.actions')}
        </Text>
        <View style={styles.actions}>
          {showBuyDoc ? (
            <LockedActionButton
              label={t('auction.participation.buyDoc')}
              locked={false}
              onPress={() => router.push(`/auction/${id}/buy-doc`)}
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
            onPress={() => router.push(`/auction/${id}/document`)}
            variant={showBuyDoc || paymentStatus === 'pending' ? 'outline' : 'primary'}
          />

          <LockedActionButton
            label={t('auction.participation.placeBids')}
            locked={bidLocked}
            lockedHint={bidHint}
            onPress={() => router.push(`/auction/${id}/bid`)}
            variant="outline"
          />
        </View>
      </GlassCard>
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
