import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GoldButton } from '@/components/auth';
import { formatEtbAmount } from '@/lib/auctionUtils';
import { useTheme } from '@/lib/appStore';
import { Typography, Spacing, Radii } from '@/theme';

interface BidSummaryBarProps {
  selectedCount: number;
  totalItems: number;
  totalBidAmount: number;
  cpoAmount: number;
  cpoPercent: number;
  locked?: boolean;
  showParticipation?: boolean;
  participationActiveCount?: number;
  participationBidTotal?: number;
  uploadingCpo?: boolean;
  onUploadCpo?: () => void;
  showReuploadCpo?: boolean;
  onReuploadCpo?: () => void;
}

export function BidSummaryBar({
  selectedCount,
  totalItems,
  totalBidAmount,
  cpoAmount,
  cpoPercent,
  locked = false,
  showParticipation = false,
  participationActiveCount = 0,
  participationBidTotal = 0,
  uploadingCpo = false,
  onUploadCpo,
  showReuploadCpo = false,
  onReuploadCpo,
}: BidSummaryBarProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const bidTotal = showParticipation ? participationBidTotal : totalBidAmount;
  const showUploadAction = !showParticipation && !locked && (onUploadCpo || onReuploadCpo);
  const hasSelection = selectedCount > 0;

  const statusLabel = showParticipation
    ? t('auction.participation.itemOverviewSubtitle', {
        active: participationActiveCount,
        total: totalItems,
      })
    : !hasSelection
      ? t('auction.participation.summaryNoItems')
      : t('auction.participation.summaryItemsSelected', {
          count: selectedCount,
          total: totalItems,
        });

  return (
    <View
      style={[
        styles.bar,
        {
          backgroundColor: colors.baseElevated,
          borderTopColor: colors.goldBorder,
          paddingBottom: Math.max(insets.bottom, 10),
        },
      ]}
    >
      <View style={styles.topRow}>
        <Text style={[Typography.caption, { color: colors.textSecondary, flex: 1 }]} numberOfLines={1}>
          {statusLabel}
        </Text>
        {locked ? (
          <MaterialCommunityIcons name="lock-outline" size={14} color={colors.textMuted} />
        ) : null}
      </View>

      {(hasSelection || showParticipation) && bidTotal > 0 ? (
        <View style={styles.totalsRow}>
          <View style={styles.totalChip}>
            <Text style={[Typography.microCaps, { color: colors.textMuted, fontSize: 9 }]}>
              {t('auction.participation.totalBidAmount')}
            </Text>
            <Text style={[styles.amountValue, { color: colors.cream }]}>{formatEtbAmount(bidTotal)}</Text>
          </View>
          <View style={[styles.totalChip, styles.totalChipRight]}>
            <Text style={[Typography.microCaps, { color: colors.textMuted, fontSize: 9 }]}>
              {t('auction.participation.cpoShort', { percent: cpoPercent })}
            </Text>
            <Text style={[styles.amountValue, { color: colors.goldBright }]}>
              {formatEtbAmount(cpoAmount)}
            </Text>
          </View>
        </View>
      ) : null}

      {showUploadAction ? (
        <View style={styles.actionSection}>
          {showReuploadCpo && onReuploadCpo ? (
            <GoldButton
              label={t('auction.participation.reuploadCpo')}
              onPress={onReuploadCpo}
              variant="outline"
              compact
            />
          ) : onUploadCpo ? (
            <>
              <GoldButton
                label={uploadingCpo ? t('common.submitting') : t('auction.participation.uploadCpo')}
                onPress={onUploadCpo}
                disabled={uploadingCpo}
                loading={uploadingCpo}
                compact
              />
              <Text style={[Typography.caption, styles.uploadHint, { color: colors.textMuted }]}>
                {t('auction.participation.uploadCpoHint')}
              </Text>
            </>
          ) : null}
        </View>
      ) : null}
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
    gap: Spacing.sm,
  },
  totalsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  totalChip: {
    flex: 1,
    gap: 2,
  },
  totalChipRight: {
    alignItems: 'flex-end',
  },
  amountValue: {
    fontSize: 16,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  actionSection: {
    marginTop: 2,
    gap: 4,
  },
  uploadHint: {
    lineHeight: 16,
    textAlign: 'center',
  },
});

export default BidSummaryBar;
