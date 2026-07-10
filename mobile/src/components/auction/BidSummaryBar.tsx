import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { formatEtbAmount } from '@/lib/auctionUtils';
import { useTheme } from '@/lib/appStore';
import { Typography, Spacing, Radii } from '@/theme';

interface BidSummaryBarProps {
  selectedCount: number;
  totalLots: number;
  totalBidAmount: number;
  cpoAmount: number;
  cpoPercent: number;
  locked?: boolean;
  showParticipation?: boolean;
  participationActiveCount?: number;
  participationBidTotal?: number;
}

export function BidSummaryBar({
  selectedCount,
  totalLots,
  totalBidAmount,
  cpoAmount,
  cpoPercent,
  locked = false,
  showParticipation = false,
  participationActiveCount = 0,
  participationBidTotal = 0,
}: BidSummaryBarProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const lotsLabel = showParticipation
    ? t('auction.participation.lotOverviewSubtitle', {
        active: participationActiveCount,
        total: totalLots,
      })
    : selectedCount > 0
      ? t('auction.participation.summaryLotsSelected', {
          count: selectedCount,
          total: totalLots,
        })
      : t('auction.participation.summaryNoLots');

  const bidTotal = showParticipation ? participationBidTotal : totalBidAmount;

  return (
    <View
      style={[
        styles.bar,
        {
          backgroundColor: colors.baseElevated,
          borderTopColor: colors.goldBorder,
          paddingBottom: Math.max(insets.bottom, 12),
        },
      ]}
    >
      <View style={styles.topRow}>
        <View style={styles.lotsInfo}>
          <MaterialCommunityIcons name="format-list-checks" size={16} color={colors.goldChampagne} />
          <Text style={[Typography.caption, { color: colors.textSecondary, flex: 1 }]} numberOfLines={1}>
            {lotsLabel}
          </Text>
        </View>
        {locked ? (
          <View style={[styles.lockBadge, { backgroundColor: colors.glassFill, borderColor: colors.goldBorder }]}>
            <MaterialCommunityIcons name="lock-outline" size={12} color={colors.textMuted} />
            <Text style={[Typography.microCaps, { color: colors.textMuted, fontSize: 9 }]}>
              {t('auction.participation.locked')}
            </Text>
          </View>
        ) : null}
      </View>

      <View style={styles.amountsRow}>
        <View style={styles.amountBlock}>
          <Text style={[Typography.microCaps, { color: colors.textMuted, fontSize: 9 }]}>
            {t('auction.participation.totalBidAmount')}
          </Text>
          <Text style={[styles.amountValue, { color: colors.cream }]}>
            {formatEtbAmount(bidTotal)}
          </Text>
        </View>

        <View style={[styles.divider, { backgroundColor: colors.divider }]} />

        <View style={styles.amountBlock}>
          <Text style={[Typography.microCaps, { color: colors.textMuted, fontSize: 9 }]}>
            {t('auction.participation.cpoShort', { percent: cpoPercent })}
          </Text>
          <Text style={[styles.amountValue, { color: colors.goldBright }]}>
            {formatEtbAmount(cpoAmount)}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    borderTopWidth: 1,
    paddingTop: Spacing.sm,
    paddingHorizontal: Spacing.md,
    gap: Spacing.xs,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  lotsInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  lockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radii.full,
    borderWidth: 1,
  },
  amountsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  amountBlock: {
    flex: 1,
    gap: 2,
  },
  amountValue: {
    fontSize: 17,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
    letterSpacing: 0.2,
  },
  divider: {
    width: 1,
    height: 32,
    marginHorizontal: Spacing.sm,
  },
});

export default BidSummaryBar;
