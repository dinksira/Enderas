import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Dimensions, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Image } from 'expo-image';

import { LockedActionButton } from '@/components/auction/LockedActionButton';
import { LotParticipationOverview } from '@/components/auction/LotParticipationOverview';
import { OwnerAuctionOverview } from '@/components/auction/OwnerAuctionOverview';
import { ParticipationStatusBanner } from '@/components/auction/ParticipationStatusBanner';
import { KycRequiredModal } from '@/components/kyc/KycRequiredModal';
import { LoginRequiredModal } from '@/components/auth';
import { ImageGallery } from '@/components/shared/ImageGallery';
import { ScreenShell } from '@/components/shell/ScreenShell';
import { GlassCard } from '@/components/shell/GlassCard';
import { useAuctionActionGate } from '@/hooks/useAuctionActionGate';
import { useAuctionParticipation } from '@/hooks/useAuctionParticipation';
import { collectAuctionGalleryImages } from '@/lib/auctionAssetUtils';
import { canShowBuyDocButton } from '@/lib/auctionParticipationUtils';
import { useAuctionCountdown } from '@/lib/auctionCountdown';
import { formatEtbAmount, statusTone } from '@/lib/auctionUtils';
import { resolveMediaUrl } from '@/lib/media-utils';
import {
  buildLotParticipationRows,
  shouldShowLotParticipationOverview,
} from '@/lib/lotParticipationUtils';
import { useTheme } from '@/lib/appStore';
import { Typography, Spacing } from '@/theme';
import { toneToStatus, type UiTone } from '@/theme/statusTones';
import type { BrowseAuction } from '@/types/auction';

const HERO_HEIGHT = 220;
const HERO_WIDTH = Dimensions.get('window').width - Spacing.md * 2;

export default function AuctionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const { colors } = useTheme();
  const auctionId = id ?? '';
  const { auction, participation, lots, auctionAssets, loading, error, documentApproved, kycVerified } =
    useAuctionParticipation(auctionId);
  const { isAuthenticated, gateReason } = useAuctionActionGate();
  const [kycModalVisible, setKycModalVisible] = useState(false);
  // Path to resume after the user logs in via the login-required dialog.
  const [loginReturnPath, setLoginReturnPath] = useState<string | null>(null);
  const { label: countdownLabel, urgency, expired } = useAuctionCountdown(
    auction?.endDate,
    t('bids.ended'),
  );

  const paymentStatus = participation?.payment?.status ?? 'none';
  const isAuctionOwner = Boolean(
    auction?.isAuctionOwner || participation?.isAuctionOwner || participation?.gates?.isAuctionOwner,
  );
  const ownerLots = participation?.ownerOverview?.lots ?? [];
  const showBuyDoc = !isAuctionOwner && canShowBuyDocButton(participation);
  const showParticipationOverview = !isAuctionOwner && shouldShowLotParticipationOverview(participation);
  const participationRows = useMemo(
    () => buildLotParticipationRows(lots, participation),
    [lots, participation],
  );
  const galleryImageUrls = useMemo(
    () => collectAuctionGalleryImages(auction?.imageUrls ?? [], auctionAssets),
    [auction?.imageUrls, auctionAssets],
  );

  useEffect(() => {
    const urls = galleryImageUrls
      .slice(0, 4)
      .map((url) => resolveMediaUrl(url))
      .filter(Boolean) as string[];
    if (urls.length) {
      void Image.prefetch(urls);
    }
  }, [galleryImageUrls]);
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
      setLoginReturnPath(path);
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
      setLoginReturnPath(`/auction/${id}/document`);
      return;
    }
    if (!kycVerified) {
      setKycModalVisible(true);
      return;
    }
    router.push(`/auction/${id}/document` as any);
  };

  const renderParticipationBanner = () => {
    if (isAuctionOwner) {
      return (
        <ParticipationStatusBanner
          tone="live"
          icon="eye-outline"
          title={t('auction.owner.bannerTitle')}
          message={t('auction.owner.bannerBody')}
        />
      );
    }
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

  const tone: UiTone = statusTone(auctionStatus as BrowseAuction['status']);
  const statusColors = toneToStatus(tone, colors);
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
      noFade
    >
      {renderParticipationBanner()}

      <View style={styles.hero}>
        <ImageGallery
          imageUrls={galleryImageUrls}
          width={HERO_WIDTH}
          height={HERO_HEIGHT}
          category={auction.category}
          mode="manual"
          showThumbnails={galleryImageUrls.length > 1}
          borderRadius={18}
        />
        <View style={styles.heroOverlay} pointerEvents="none">
          <View style={styles.statusChip}>
            <View style={[styles.statusDot, { backgroundColor: statusColors.fg }]} />
            <Text style={styles.statusLabel}>{statusLabel}</Text>
          </View>
        </View>
      </View>

      <View style={[styles.infoStrip, { borderColor: colors.goldBorder, backgroundColor: colors.glassFill }]}>
        <InfoCell label={t('dashboard.browse.category')} value={categoryLabel} colors={colors} />
        <View style={[styles.infoDivider, { backgroundColor: colors.divider }]} />
        <InfoCell
          label={expired ? t('dashboard.browse.ends') : 'Ends in'}
          value={countdownLabel}
          colors={colors}
          valueColor={expired ? colors.textMuted : urgency === 'critical' ? colors.danger.fg : colors.cream}
          align="center"
        />
        <View style={[styles.infoDivider, { backgroundColor: colors.divider }]} />
        <InfoCell
          label={t('auction.participation.documentFee')}
          value={formatEtbAmount(Number(auction.documentFee ?? 0))}
          colors={colors}
          align="right"
        />
      </View>

      <View style={styles.descriptionBlock}>
        <Text style={[styles.sectionTitle, { color: colors.goldChampagne }]}>
          {t('dashboard.browse.description')}
        </Text>
        <Text style={[styles.bodyText, { color: colors.textSecondary }]}>
          {auctionDescription}
        </Text>
      </View>

      {showParticipationOverview ? (
        <LotParticipationOverview rows={participationRows} onlyActiveLots compact />
      ) : null}

      {isAuctionOwner && ownerLots.length > 0 ? (
        <OwnerAuctionOverview
          lots={ownerLots}
          documentFee={participation?.ownerOverview?.documentFee ?? auction.documentFee}
          totalBidCount={participation?.ownerOverview?.totalBidCount ?? auction.bidCount}
        />
      ) : null}

      <View style={styles.actionsBlock}>
        <Text style={[styles.sectionTitle, { color: colors.goldChampagne, marginBottom: 8 }]}>
          {isAuctionOwner ? t('auction.owner.actionsTitle') : t('auction.participation.actions')}
        </Text>
        <View style={styles.actions}>
          {!isAuctionOwner && showBuyDoc ? (
            <LockedActionButton
              label={t('auction.participation.buyDoc')}
              locked={false}
              disabled={false}
              onPress={() => handleParticipationAction(`/auction/${id}/buy-doc`)}
              variant="primary"
              icon="file-document-plus-outline"
              helperText="Unlock auction docs"
            />
          ) : !isAuctionOwner && paymentStatus === 'pending' ? (
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
            locked={!isAuctionOwner && viewDocLocked}
            disabled={!isAuctionOwner && viewDocLocked}
            lockedHint={isAuctionOwner ? undefined : viewDocHint}
            onPress={() => {
              void handleViewDocument();
            }}
            variant="primary"
            icon="eye-outline"
            helperText={isAuctionOwner ? t('auction.owner.viewDocsHelper') : 'Preview documents'}
          />

          {!isAuctionOwner ? (
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
          ) : null}
        </View>
      </View>

      <KycRequiredModal
        visible={kycModalVisible}
        onClose={() => setKycModalVisible(false)}
        onVerify={() => {
          setKycModalVisible(false);
          router.push('/kyc' as any);
        }}
      />

      <LoginRequiredModal
        visible={loginReturnPath !== null}
        message={t('auction.participation.loginRequired')}
        onClose={() => setLoginReturnPath(null)}
        onLogin={() => {
          const path = loginReturnPath;
          setLoginReturnPath(null);
          router.push(`/(auth)/login?returnTo=${encodeURIComponent(path ?? `/auction/${id}`)}` as any);
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
  align?: 'left' | 'center' | 'right';
  valueColor?: string;
}) {
  return (
    <View
      style={[
        styles.infoCell,
        { alignItems: align === 'right' ? 'flex-end' : align === 'center' ? 'center' : 'flex-start' },
      ]}
    >
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
    marginBottom: 14,
    position: 'relative',
  },
  heroOverlay: {
    position: 'absolute',
    top: 12,
    left: 12,
    zIndex: 2,
  },
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    borderColor: 'rgba(255,250,240,0.24)',
  },
  statusLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: '#FFFAF0',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  infoStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  infoDivider: {
    width: 1,
    height: 32,
    marginHorizontal: 8,
  },
  infoCell: {
    flex: 1,
    gap: 3,
  },
  infoLabel: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
    letterSpacing: 0.1,
  },
  descriptionBlock: {
    marginBottom: 16,
    gap: 8,
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
  actionsBlock: {
    marginTop: 4,
  },
  actions: {
    gap: 12,
  },
});
