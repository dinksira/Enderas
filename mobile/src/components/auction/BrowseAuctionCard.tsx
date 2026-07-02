import { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';

import { useTheme } from '@/lib/appStore';
import { useAuctionCountdown } from '@/lib/auctionCountdown';
import { resolveMediaUrl } from '@/lib/media-utils';
import { getCategoryTheme } from '@/theme/categoryColors';
import { toneToStatus, type UiTone } from '@/theme/statusTones';
import { Typography, Spacing, Radii } from '@/theme';
import { PressableScale } from '@/components/ui';
import { statusTone } from '@/lib/auctionUtils';
import type { BrowseAuction } from '@/types/auction';

interface BrowseAuctionCardProps {
  auction: BrowseAuction;
  onPress?: () => void;
  /** Compact variant — used inside the 2-column dashboard grid. */
  compact?: boolean;
}

/**
 * Auction card for the browse / dashboard grid.
 *
 * Two variants:
 *   - default : single-column, larger image, more padding.
 *   - compact : 2-column grid — smaller image, tighter padding, fewer
 *               description lines so the card stays short.
 *
 * Status chip colors come from the semantic `toneToStatus` helper so
 * they automatically hit WCAG AA in both light and dark mode (no
 * per-card hex codes).
 *
 * Wrapped in `memo` — props are an auction object + a stable onPress
 * callback (the dashboard binds `() => router.push(…)` inline, which
 * would defeat memo, so the dashboard memoizes the callback itself).
 */
function BrowseAuctionCardImpl({ auction, onPress, compact }: BrowseAuctionCardProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const theme = getCategoryTheme(auction.category);
  const tone: UiTone = statusTone(auction.status);
  const statusColors = toneToStatus(tone, colors);

  const statusLabel = t(`dashboard.filters.${auction.status.toLowerCase()}`);
  const thumbnailUri = resolveMediaUrl(auction.imageUrls[0]);
  const categoryLabel = t(`dashboard.categories.${auction.category}`, {
    defaultValue: auction.category,
  });
  const { shortLabel, accentLabel, urgency, expired } = useAuctionCountdown(
    auction.endDate,
    t('bids.ended'),
  );

  const thumbHeight = compact ? 96 : 140;
  const bodyPadding = compact ? Spacing.sm : Spacing.sm2;
  const titleLines = compact ? 1 : 2;
  const descLines = compact ? 1 : 2;
  return (
    <PressableScale
      onPress={onPress}
      scaleTo={0.97}
      accessibilityRole="button"
      accessibilityLabel={t('dashboard.browse.openDetail', { title: auction.title })}
    >
      <View
        style={[
          styles.card,
          compact && styles.cardCompact,
          { backgroundColor: colors.glassFill, borderColor: colors.goldBorder },
        ]}
      >
        <View style={[styles.thumbWrap, { height: thumbHeight }]}>
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
          {/* Dark overlay so white text on the thumbnail stays readable
              regardless of the underlying image content. */}
          <LinearGradient
            colors={['rgba(0,0,0,0.05)', 'rgba(0,0,0,0.55)']}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.thumbTop}>
            <View style={styles.categoryChip}>
              <MaterialCommunityIcons name={theme.icon} size={12} color="#FFFAF0" />
              <Text style={[Typography.microCaps, { color: '#FFFAF0', fontSize: 9, letterSpacing: 0.5 }]} numberOfLines={1}>
                {categoryLabel}
              </Text>
            </View>
          </View>

          <View style={styles.thumbBottom}>
            <View
              style={[
                styles.statusChip,
                {
                  backgroundColor: colors.base,
                  borderColor: statusColors.border,
                },
              ]}
            >
              <View style={[styles.statusDot, { backgroundColor: statusColors.fg }]} />
              <Text style={[Typography.microCaps, { color: statusColors.fg, letterSpacing: 0.5 }]}>
                {statusLabel}
              </Text>
            </View>
          </View>
          {!thumbnailUri ? (
            <View style={styles.thumbIcon}>
              <MaterialCommunityIcons name={theme.icon} size={36} color="rgba(255,250,240,0.35)" />
            </View>
          ) : null}
        </View>

        <View style={[styles.body, { padding: bodyPadding }]}>
          <Text
            style={[Typography.cardTitle, { color: colors.cream }]}
            numberOfLines={titleLines}
          >
            {auction.title}
          </Text>
          <Text
            style={[Typography.bodySmall, { color: colors.textSecondary }]}
            numberOfLines={descLines}
          >
            {auction.description}
          </Text>

          <View style={[styles.dateRow, { borderTopColor: colors.divider }]}>
            <Text style={[Typography.microCaps, { color: colors.textMuted }]}>
              {expired ? t('dashboard.browse.ends') : 'Ends in'}
            </Text>
            <Text
              style={[
                compact ? Typography.bodyMedium : Typography.cardTitle,
                styles.countdownValue,
                {
                  color: expired ? colors.textMuted : urgency === 'critical' ? colors.danger.fg : colors.cream,
                  fontWeight: '800',
                },
              ]}
            >
              {shortLabel}
            </Text>
            <Text
              style={[
                Typography.caption,
                styles.countdownSupport,
                {
                  color: expired ? colors.textMuted : urgency === 'critical' ? colors.danger.fg : colors.textSecondary,
                },
              ]}
            >
              {accentLabel}
            </Text>
          </View>
        </View>
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radii.xl,
    borderWidth: 1.5,
    overflow: 'hidden',
  },
  cardCompact: {
    borderWidth: 1,
  },
  thumbWrap: {
    position: 'relative',
  },
  thumbTop: {
    flexDirection: 'row',
    padding: Spacing.xs,
    zIndex: 2,
  },
  thumbBottom: {
    position: 'absolute',
    bottom: Spacing.xs,
    right: Spacing.xs,
    zIndex: 2,
  },
  thumbIcon: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xxs,
    paddingHorizontal: Spacing.xs,
    paddingVertical: Spacing.xxs,
    borderRadius: Radii.full,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderWidth: 1,
    borderColor: 'rgba(255,250,240,0.3)',
    maxWidth: 100,
  },

  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xxs2,
    paddingHorizontal: Spacing.xs,
    paddingVertical: Spacing.xxs,
    borderRadius: Radii.full,
    borderWidth: 1,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  body: {
    gap: Spacing.xxs2,
  },
  dateRow: {
    flexDirection: 'column',
    borderTopWidth: 1,
    paddingTop: Spacing.xs2,
    marginTop: Spacing.xxs,
    gap: Spacing.xxs,
  },
  countdownValue: {
    fontVariant: ['tabular-nums'],
    letterSpacing: 0.3,
  },
  countdownSupport: {
    marginTop: -2,
  },
});

export const BrowseAuctionCard = memo(BrowseAuctionCardImpl);
export default BrowseAuctionCard;
