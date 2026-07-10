import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Image } from 'expo-image';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { GlassCard } from '@/components/shell/GlassCard';
import { formatEtbAmount, getCategoryTheme } from '@/lib/auctionUtils';
import { resolveMediaUrl } from '@/lib/media-utils';
import type { LotParticipationRow, LotParticipationRowStatus } from '@/lib/lotParticipationUtils';
import { countActiveLotParticipation } from '@/lib/lotParticipationUtils';
import { useTheme } from '@/lib/appStore';
import { Typography, Spacing, Radii } from '@/theme';
import { toneToStatus, type UiTone } from '@/theme/statusTones';

interface LotParticipationOverviewProps {
  rows: LotParticipationRow[];
  /** Hide lots the user is not bidding on (useful on auction detail). */
  onlyActiveLots?: boolean;
  compact?: boolean;
}

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

export function LotParticipationOverview({
  rows,
  onlyActiveLots = false,
  compact = false,
}: LotParticipationOverviewProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();

  const visibleRows = onlyActiveLots
    ? rows.filter((row) => row.status !== 'not_bidding')
    : rows;
  const activeCount = countActiveLotParticipation(rows);

  if (!visibleRows.length) {
    return null;
  }

  return (
    <GlassCard padding={compact ? 14 : 16} style={styles.card}>
      <View style={styles.header}>
        <Text style={[styles.sectionTitle, { color: colors.goldChampagne }]}>
          {t('auction.participation.lotOverviewTitle')}
        </Text>
        <Text style={[Typography.caption, { color: colors.textMuted }]}>
          {t('auction.participation.lotOverviewSubtitle', {
            active: activeCount,
            total: rows.length,
          })}
        </Text>
      </View>

      <View style={styles.list}>
        {visibleRows.map((row) => {
          const meta = statusMeta(row.status);
          const statusColors = toneToStatus(meta.tone, colors);
          const theme = getCategoryTheme(row.category);
          const thumbnailUri = resolveMediaUrl(row.imageUrls[0]);
          const isActive = row.status !== 'not_bidding';

          return (
            <View
              key={row.lotId}
              style={[
                styles.row,
                {
                  borderColor: isActive ? statusColors.border : colors.goldBorder,
                  backgroundColor: isActive ? statusColors.soft : colors.glassFill,
                  opacity: isActive ? 1 : 0.72,
                },
              ]}
            >
              <View style={[styles.thumb, compact && styles.thumbCompact]}>
                {thumbnailUri ? (
                  <Image
                    source={{ uri: thumbnailUri }}
                    style={StyleSheet.absoluteFill}
                    contentFit="cover"
                    cachePolicy="memory-disk"
                    transition={0}
                  />
                ) : (
                  <LinearGradient colors={theme.colors} style={StyleSheet.absoluteFill} />
                )}
                {!thumbnailUri ? (
                  <MaterialCommunityIcons name={theme.icon} size={18} color="rgba(255,250,240,0.45)" />
                ) : null}
              </View>

              <View style={styles.copy}>
                <Text style={[Typography.microCaps, { color: colors.goldChampagne }]}>{row.lotLabel}</Text>
                <Text
                  style={[Typography.bodyMedium, { color: colors.cream, fontWeight: '700' }]}
                  numberOfLines={compact ? 1 : 2}
                >
                  {row.title}
                </Text>
                {!compact ? (
                  <Text style={[Typography.caption, { color: colors.textMuted }]}>
                    {t('auction.participation.reserve')}: {formatEtbAmount(row.reservePrice)}
                  </Text>
                ) : null}

                <View
                  style={[
                    styles.statusPill,
                    {
                      backgroundColor: statusColors.soft,
                      borderColor: statusColors.border,
                    },
                  ]}
                >
                  <MaterialCommunityIcons name={meta.icon} size={13} color={statusColors.fg} />
                  <Text style={[Typography.caption, { color: statusColors.fg, flex: 1 }]}>
                    {t(meta.labelKey)}
                  </Text>
                </View>

                {row.bidAmount != null && isActive ? (
                  <Text style={[Typography.bodySmall, { color: colors.cream, fontWeight: '800' }]}>
                    {t('auction.participation.yourBidAmount', {
                      amount: formatEtbAmount(row.bidAmount),
                    })}
                  </Text>
                ) : null}

                {row.status === 'not_bidding' ? (
                  <Text style={[Typography.caption, { color: colors.textMuted }]}>
                    {t('auction.participation.lotStatus.notBiddingHint')}
                  </Text>
                ) : null}
              </View>
            </View>
          );
        })}
      </View>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: Spacing.sm,
  },
  header: {
    gap: 4,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  list: {
    gap: 10,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    padding: 12,
    borderRadius: Radii.input,
    borderWidth: 1,
  },
  thumb: {
    width: 64,
    height: 64,
    borderRadius: Radii.input,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbCompact: {
    width: 52,
    height: 52,
  },
  copy: {
    flex: 1,
    gap: 4,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    marginTop: 2,
  },
});

export default LotParticipationOverview;
