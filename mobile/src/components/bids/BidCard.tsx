import { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { useTheme } from '@/lib/appStore';
import { bidStatusTone, formatBidDate } from '@/lib/bidUtils';
import { formatEtbAmount, getCategoryTheme } from '@/lib/auctionUtils';
import { Typography, Spacing, Radii } from '@/theme';
import { toneToStatus, type UiTone } from '@/theme/statusTones';
import { PressableScale } from '@/components/ui';
import type { BidRecord } from '@/types/bid';

interface BidCardProps {
  bid: BidRecord;
  onPress?: () => void;
}

/**
 * Card for a single user-placed bid, shown in the "My Bids" list.
 *
 * Status chip colors come from the semantic `toneToStatus` helper, so
 * contrast is correct in both light and dark mode without per-card hex.
 * Wrapped in `memo` — props are primitives + a stable onPress callback.
 */
function BidCardImpl({ bid, onPress }: BidCardProps) {
  const { t, i18n } = useTranslation();
  const { colors } = useTheme();
  const theme = getCategoryTheme('other');
  const tone: UiTone = bidStatusTone(bid.status);
  const statusColors = toneToStatus(tone, colors);

  const statusLabel = t(`bids.status.${bid.status}`, {
    defaultValue: bid.status.replace(/_/g, ' '),
  });

  return (
    <PressableScale onPress={onPress} scaleTo={0.98}>
      <View
        style={[
          styles.card,
          { backgroundColor: colors.glassFill, borderColor: colors.goldBorder },
        ]}
      >
        <View style={styles.cover}>
          <LinearGradient
            colors={theme.colors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <LinearGradient
            colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.45)']}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.coverTop}>
            <View style={styles.categoryChip}>
              <MaterialCommunityIcons name="gavel" size={12} color={colors.cream} />
              <Text style={[Typography.microCaps, { color: colors.cream }]}>
                {t('bids.title')}
              </Text>
            </View>
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
              <Text style={[Typography.microCaps, { color: statusColors.fg }]}>
                {statusLabel}
              </Text>
            </View>
          </View>
          <View style={styles.coverBottom}>
            <Text
              style={[Typography.cardTitle, { color: colors.cream }]}
              numberOfLines={2}
            >
              {bid.auctionTitle || t('bids.untitledAuction')}
            </Text>
          </View>
        </View>

        <View style={styles.body}>
          <View style={styles.metaRow}>
            <View style={styles.metaCol}>
              <Text style={[Typography.microCaps, { color: colors.textMuted }]}>
                {t('bids.yourBid')}
              </Text>
              <Text style={[Typography.bodyMedium, { color: colors.goldBright, fontWeight: '700' }]}>
                {formatEtbAmount(bid.amount)}
              </Text>
            </View>
            <View style={[styles.metaCol, { alignItems: 'flex-end' }]}>
              <Text style={[Typography.microCaps, { color: colors.textMuted }]}>
                {t('assets.submitted')}
              </Text>
              <Text style={[Typography.bodyMedium, { color: colors.cream, fontWeight: '700' }]}>
                {formatBidDate(bid.submittedAt, i18n.language)}
              </Text>
            </View>
          </View>

          {bid.auctionId ? (
            <View style={styles.footerRow}>
              <MaterialCommunityIcons name="open-in-new" size={14} color={colors.goldBright} />
              <Text style={[Typography.caption, { color: colors.goldBright, fontWeight: '700' }]}>
                {t('bids.viewAuction')}
              </Text>
            </View>
          ) : null}
        </View>
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radii.lg,
    borderWidth: 1.5,
    overflow: 'hidden',
  },
  cover: {
    height: 108,
    padding: Spacing.sm,
    justifyContent: 'space-between',
  },
  coverTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: Spacing.xs,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xxs,
    paddingHorizontal: Spacing.xs,
    paddingVertical: Spacing.xxs,
    borderRadius: Radii.sm,
    backgroundColor: 'rgba(0,0,0,0.28)',
  },
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: Spacing.xs,
    paddingVertical: Spacing.xxs,
    borderRadius: Radii.sm,
    borderWidth: 1,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  coverBottom: {
    marginTop: 'auto',
  },
  body: {
    padding: Spacing.sm,
    gap: Spacing.xs2,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  metaCol: {
    flex: 1,
    gap: Spacing.xxs,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xxs2,
  },
});

export const BidCard = memo(BidCardImpl);
export default BidCard;
