import { memo, useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { formatEtbAmount, getCategoryTheme } from '@/lib/auctionUtils';
import { resolveMediaUrl } from '@/lib/media-utils';
import type { LotParticipationRowStatus } from '@/lib/lotParticipationUtils';
import { useTheme } from '@/lib/appStore';
import { Typography, Spacing, Radii } from '@/theme';
import { toneToStatus, type UiTone } from '@/theme/statusTones';
import type { AuctionLot } from '@/types/auctionParticipation';

interface LotParticipationCardProps {
  lot: AuctionLot;
  status: LotParticipationRowStatus;
  bidAmount?: number;
  /** Render as a row inside a grouped lot card (matches LotBidCard chrome). */
  embedded?: boolean;
  /** True for the first row in a group (no top divider). */
  first?: boolean;
  onOpenDetail: (id: string) => void;
}

const THUMB_SIZE = 64;

function statusMeta(status: LotParticipationRowStatus): {
  tone: UiTone;
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  labelKey: string;
} {
  switch (status) {
    case 'bid_submitted':
      return { tone: 'won', icon: 'check-decagram-outline', labelKey: 'auction.participation.lotStatus.bidSubmitted' };
    case 'proposed_under_review':
      return { tone: 'pending', icon: 'clock-outline', labelKey: 'auction.participation.lotStatus.underReview' };
    case 'awaiting_live_bid':
      return { tone: 'live', icon: 'gavel', labelKey: 'auction.participation.lotStatus.awaitingLiveBid' };
    default:
      return { tone: 'lost', icon: 'minus-circle-outline', labelKey: 'auction.participation.lotStatus.notBidding' };
  }
}

function LotParticipationCardImpl({
  lot,
  status,
  bidAmount,
  embedded = false,
  first = false,
  onOpenDetail,
}: LotParticipationCardProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const theme = getCategoryTheme(lot.category);
  const reserveLabel = formatEtbAmount(lot.reservePrice);
  const photoCount = lot.imageUrls.length;
  const isActive = status !== 'not_bidding';

  const meta = statusMeta(status);
  const statusColors = toneToStatus(meta.tone, colors);

  const thumbUri = useMemo(() => resolveMediaUrl(lot.imageUrls[0]), [lot.imageUrls]);

  const containerStyle = embedded
    ? [
        styles.row,
        {
          backgroundColor: isActive ? colors.glassFillActive : colors.glassFill,
          borderLeftColor: colors.goldBorder,
          borderRightColor: colors.goldBorder,
          borderTopColor: first ? 'transparent' : colors.divider,
          borderTopWidth: first ? 0 : StyleSheet.hairlineWidth,
          opacity: isActive ? 1 : 0.72,
        },
      ]
    : [
        styles.card,
        {
          backgroundColor: isActive ? colors.glassFillActive : colors.glassFill,
          borderColor: isActive ? statusColors.border : colors.goldBorder,
          opacity: isActive ? 1 : 0.72,
        },
      ];

  return (
    <View style={containerStyle}>
      <View style={styles.topRow}>
        <Pressable
          onPress={() => onOpenDetail(lot.id)}
          style={styles.thumbWrap}
          accessibilityRole="button"
          accessibilityLabel={t('auction.participation.cardHintPhotos', { title: lot.title })}
        >
          <View style={[styles.thumb, { borderColor: colors.goldBorder }]}>
            {thumbUri ? (
              <Image
                source={{ uri: thumbUri }}
                style={StyleSheet.absoluteFill}
                contentFit="cover"
                cachePolicy="memory-disk"
                transition={0}
              />
            ) : (
              <LinearGradient colors={theme.colors} style={StyleSheet.absoluteFill} />
            )}
            {photoCount > 1 ? (
              <View style={styles.thumbBadge}>
                <MaterialCommunityIcons name="image-multiple" size={9} color="#FFFAF0" />
                <Text style={styles.thumbBadgeText}>{photoCount}</Text>
              </View>
            ) : null}
          </View>
        </Pressable>

        <Pressable
          onPress={() => onOpenDetail(lot.id)}
          style={styles.copy}
          accessibilityRole="button"
          accessibilityLabel={t('auction.participation.viewAssetDetails', { title: lot.title })}
        >
          <Text style={[Typography.bodyMedium, { color: colors.cream, fontWeight: '700' }]} numberOfLines={2}>
            {lot.title}
          </Text>
          {lot.tags?.length ? (
            <Text style={[Typography.caption, { color: colors.goldChampagne }]} numberOfLines={1}>
              {lot.tags.join(' · ')}
            </Text>
          ) : null}
          <Text style={[Typography.caption, { color: colors.textMuted }]}>
            {t('auction.participation.cardReserveLabel', { reserve: reserveLabel })}
          </Text>
          <View style={styles.detailHintRow}>
            <MaterialCommunityIcons name="information-outline" size={12} color={colors.textMuted} />
            <Text style={[Typography.caption, { color: colors.textMuted }]}>
              {t('auction.participation.tapForDetails')}
            </Text>
          </View>
        </Pressable>
      </View>

      <View
        style={[
          styles.statusPill,
          { backgroundColor: statusColors.soft, borderColor: statusColors.border },
        ]}
      >
        <MaterialCommunityIcons name={meta.icon} size={14} color={statusColors.fg} />
        <Text style={[Typography.caption, { color: statusColors.fg, fontWeight: '700', flex: 1 }]} numberOfLines={2}>
          {t(meta.labelKey)}
        </Text>
        {bidAmount != null && isActive ? (
          <Text style={[Typography.caption, { color: colors.cream, fontWeight: '800' }]}>
            {formatEtbAmount(bidAmount)}
          </Text>
        ) : null}
      </View>

      {status === 'not_bidding' ? (
        <Text style={[Typography.caption, { color: colors.textMuted }]}>
          {t('auction.participation.lotStatus.notBiddingHint')}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: Spacing.sm,
    borderRadius: Radii.lg,
    borderWidth: 1,
    padding: Spacing.sm2,
    gap: Spacing.sm,
  },
  row: {
    paddingHorizontal: Spacing.sm2,
    paddingVertical: Spacing.sm,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    gap: Spacing.sm,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },
  thumbWrap: {
    flexShrink: 0,
    width: THUMB_SIZE,
  },
  thumb: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: Radii.input,
    overflow: 'hidden',
    borderWidth: 1,
  },
  thumbBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: Radii.full,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  thumbBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FFFAF0',
  },
  copy: {
    flex: 1,
    gap: 3,
    paddingTop: 1,
  },
  detailHintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 1,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radii.input,
    borderWidth: 1,
  },
});

export const LotParticipationCard = memo(LotParticipationCardImpl);
export default LotParticipationCard;
