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
  onToggle: () => void;
  onPress: () => void;
  onOpenDetail: () => void;
}

const THUMB_SIZE = 64;

function LotBidCardImpl({
  lot,
  selected,
  bidAmount,
  bidComplete,
  bidHasError,
  locked,
  onToggle,
  onPress,
  onOpenDetail,
}: LotBidCardProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const theme = getCategoryTheme(lot.category);
  const reserveLabel = formatEtbAmount(lot.reservePrice);
  const bidLabel = formatEtbAmount(bidAmount);

  const thumbUri = useMemo(
    () => resolveMediaUrl(lot.imageUrls[0]),
    [lot.imageUrls],
  );

  const actionHint = useMemo(() => {
    if (locked) return t('auction.participation.cardHintLocked');
    if (!selected) return t('auction.participation.cardHintSelect');
    if (bidHasError) return t('auction.participation.cardHintFixBid');
    if (bidComplete) return t('auction.participation.cardHintEditBid', { amount: bidLabel });
    return t('auction.participation.cardHintSetBid');
  }, [bidComplete, bidHasError, bidLabel, locked, selected, t]);

  const pillLabel = useMemo(() => {
    if (bidHasError) return t('auction.participation.cardPillFixBid');
    if (bidComplete) return t('auction.participation.cardPillEditBid', { amount: bidLabel });
    return t('auction.participation.cardPillSetBid');
  }, [bidComplete, bidHasError, bidLabel, t]);

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: selected ? colors.glassFillActive : colors.glassFill,
          borderColor: selected ? colors.goldBorderActive : colors.goldBorder,
        },
      ]}
    >
      <Pressable
        onPress={() => !locked && onOpenDetail()}
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
          <View style={styles.thumbLabel}>
            <MaterialCommunityIcons name="image-outline" size={10} color="#FFFAF0" />
          </View>
        </View>
        <Text style={[Typography.caption, styles.thumbHint, { color: colors.textMuted }]}>
          {t('auction.participation.cardPhotoLabel')}
        </Text>
      </Pressable>

      <Pressable
        onPress={() => !locked && onPress()}
        disabled={locked}
        style={styles.copy}
        accessibilityRole="button"
        accessibilityLabel={actionHint}
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
        <Text
          style={[
            Typography.caption,
            {
              color: selected ? colors.goldChampagne : colors.textSecondary,
              lineHeight: 17,
            },
          ]}
        >
          {actionHint}
        </Text>

        {selected ? (
          <View
            style={[
              styles.bidPill,
              {
                backgroundColor: bidHasError
                  ? colors.danger.soft
                  : bidComplete
                    ? colors.success.soft
                    : colors.glassFill,
                borderColor: bidHasError
                  ? colors.danger.border
                  : bidComplete
                    ? colors.success.border
                    : colors.goldBorder,
              },
            ]}
          >
            <MaterialCommunityIcons
              name={bidHasError ? 'alert-circle-outline' : bidComplete ? 'check-circle' : 'cash-edit'}
              size={14}
              color={bidHasError ? colors.danger.fg : bidComplete ? colors.success.fg : colors.goldChampagne}
            />
            <Text
              style={[
                Typography.caption,
                {
                  color: bidHasError ? colors.danger.fg : bidComplete ? colors.success.fg : colors.goldChampagne,
                  fontWeight: '700',
                  flex: 1,
                },
              ]}
              numberOfLines={2}
            >
              {pillLabel}
            </Text>
            <MaterialCommunityIcons name="chevron-right" size={16} color={colors.textMuted} />
          </View>
        ) : null}
      </Pressable>

      <View style={styles.checkboxCol}>
        <PressableScale
          onPress={() => !locked && onToggle()}
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
            {selected ? <MaterialCommunityIcons name="check" size={14} color={colors.textOnGold} /> : null}
          </View>
        </PressableScale>
        <Text style={[Typography.caption, styles.checkboxHint, { color: colors.textMuted }]} numberOfLines={2}>
          {selected ? t('auction.participation.cardCheckboxSelected') : t('auction.participation.cardCheckboxIdle')}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
    borderRadius: Radii.lg,
    borderWidth: 1,
    padding: Spacing.sm2,
  },
  thumbWrap: {
    flexShrink: 0,
    alignItems: 'center',
    gap: 3,
    width: THUMB_SIZE,
  },
  thumb: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: Radii.sm,
    overflow: 'hidden',
    borderWidth: 1,
  },
  thumbLabel: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: Radii.full,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbHint: {
    fontSize: 9,
    textAlign: 'center',
  },
  copy: {
    flex: 1,
    gap: 4,
    paddingTop: 2,
  },
  bidPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: Radii.input,
    borderWidth: 1,
  },
  checkboxCol: {
    alignItems: 'center',
    width: 52,
    gap: 4,
  },
  checkboxHit: {
    paddingTop: 2,
  },
  checkbox: {
    width: 26,
    height: 26,
    borderRadius: 7,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxHint: {
    fontSize: 9,
    textAlign: 'center',
    lineHeight: 12,
  },
});

export const LotBidCard = memo(LotBidCardImpl);
export default LotBidCard;
