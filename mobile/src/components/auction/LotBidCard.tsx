import { memo, useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { PressableScale } from '@/components/ui';
import { formatEtbAmount, getCategoryTheme } from '@/lib/auctionUtils';
import { resolveMediaUrl } from '@/lib/media-utils';
import { useTheme } from '@/lib/appStore';
import { Typography, Spacing, Radii } from '@/theme';
import type { AuctionLot } from '@/types/auctionParticipation';

interface LotBidCardProps {
  lot: AuctionLot;
  selected: boolean;
  bidAmount: number;
  bidComplete: boolean;
  bidHasError: boolean;
  locked: boolean;
  /** Render as a row inside a grouped lot card (no standalone card chrome). */
  embedded?: boolean;
  /** True for the first row in a group (no top divider). */
  first?: boolean;
  onToggle: (id: string) => void;
  onOpenDetail: (id: string) => void;
  onOpenBid: (id: string) => void;
}

const THUMB_SIZE = 64;

function LotBidCardImpl({
  lot,
  selected,
  bidAmount,
  bidComplete,
  bidHasError,
  locked,
  embedded = false,
  first = false,
  onToggle,
  onOpenDetail,
  onOpenBid,
}: LotBidCardProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const theme = getCategoryTheme(lot.category);
  const reserveLabel = formatEtbAmount(lot.reservePrice);
  const bidLabel = formatEtbAmount(bidAmount);
  const photoCount = lot.imageUrls.length;

  const thumbUri = useMemo(
    () => resolveMediaUrl(lot.imageUrls[0]),
    [lot.imageUrls],
  );

  const pillLabel = useMemo(() => {
    if (bidHasError) return t('auction.participation.cardPillFixBid');
    if (bidComplete) return t('auction.participation.cardPillEditBid', { amount: bidLabel });
    return t('auction.participation.cardPillSetBid');
  }, [bidComplete, bidHasError, bidLabel, t]);

  const pillFg = bidHasError ? colors.danger.fg : bidComplete ? colors.success.fg : colors.goldChampagne;
  const pillBg = bidHasError ? colors.danger.soft : bidComplete ? colors.success.soft : colors.glassFillActive;
  const pillBorder = bidHasError ? colors.danger.border : bidComplete ? colors.success.border : colors.goldBorderActive;

  const containerStyle = embedded
    ? [
        styles.row,
        {
          backgroundColor: selected ? colors.glassFillActive : colors.glassFill,
          borderLeftColor: colors.goldBorder,
          borderRightColor: colors.goldBorder,
          borderTopColor: first ? 'transparent' : colors.divider,
          borderTopWidth: first ? 0 : StyleSheet.hairlineWidth,
        },
      ]
    : [
        styles.card,
        {
          backgroundColor: selected ? colors.glassFillActive : colors.glassFill,
          borderColor: selected ? colors.goldBorderActive : colors.goldBorder,
        },
      ];

  return (
    <View style={containerStyle}>
      <View style={styles.topRow}>
        <Pressable
          onPress={() => !locked && onOpenDetail(lot.id)}
          disabled={locked}
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
          onPress={() => !locked && onOpenDetail(lot.id)}
          disabled={locked}
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

        <PressableScale
          onPress={() => !locked && onToggle(lot.id)}
          disabled={locked}
          hitSlop={10}
          style={styles.checkboxHit}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: selected }}
          accessibilityLabel={
            selected
              ? t('auction.participation.cardCheckboxRemove', { title: lot.title })
              : t('auction.participation.cardCheckboxAdd', { title: lot.title })
          }
        >
          <View
            style={[
              styles.checkbox,
              {
                borderColor: selected ? colors.goldBright : colors.goldBorder,
                backgroundColor: selected ? colors.goldBright : 'transparent',
              },
            ]}
          >
            {selected ? <MaterialCommunityIcons name="check" size={16} color={colors.textOnGold} /> : null}
          </View>
        </PressableScale>
      </View>

      {selected ? (
        <Pressable
          onPress={() => !locked && onOpenBid(lot.id)}
          disabled={locked}
          style={[styles.bidPill, { backgroundColor: pillBg, borderColor: pillBorder }]}
          accessibilityRole="button"
          accessibilityLabel={pillLabel}
        >
          <MaterialCommunityIcons
            name={bidHasError ? 'alert-circle-outline' : bidComplete ? 'check-circle' : 'cash-edit'}
            size={16}
            color={pillFg}
          />
          <Text style={[Typography.caption, { color: pillFg, fontWeight: '700', flex: 1 }]} numberOfLines={2}>
            {pillLabel}
          </Text>
          <MaterialCommunityIcons name="chevron-right" size={18} color={pillFg} />
        </Pressable>
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
  checkboxHit: {
    paddingTop: 1,
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bidPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: Radii.input,
    borderWidth: 1,
  },
});

export const LotBidCard = memo(LotBidCardImpl);
export default LotBidCard;
