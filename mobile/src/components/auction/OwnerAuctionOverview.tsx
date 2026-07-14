import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { GlassCard } from '@/components/shell/GlassCard';
import { formatEtbAmount } from '@/lib/auctionUtils';
import { useTheme } from '@/lib/appStore';
import { Typography } from '@/theme';
import type { OwnerLotOverviewApi } from '@/types/auctionApi';

interface OwnerAuctionOverviewProps {
  lots: OwnerLotOverviewApi[];
  documentFee?: number;
  totalBidCount?: number;
}

export function OwnerAuctionOverview({ lots, documentFee, totalBidCount }: OwnerAuctionOverviewProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();

  return (
    <GlassCard padding={16} style={styles.card}>
      <Text style={[styles.title, { color: colors.goldChampagne }]}>
        {t('auction.owner.overviewTitle')}
      </Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        {t('auction.owner.overviewSubtitle', {
          totalBids: totalBidCount ?? 0,
          documentFee: formatEtbAmount(Number(documentFee ?? 0)),
        })}
      </Text>

      <View style={styles.lotList}>
        {lots.map((lot) => (
          <View
            key={lot.id}
            style={[styles.lotRow, { borderColor: colors.goldBorder, backgroundColor: colors.glassFill }]}
          >
            <View style={styles.lotMain}>
              <Text style={[styles.lotTitle, { color: colors.cream }]}>
                {lot.assetTitle ?? lot.lotTitle ?? t('auction.owner.unnamedLot')}
              </Text>
              {lot.assetLocation ? (
                <Text style={[styles.lotMeta, { color: colors.textMuted }]}>{lot.assetLocation}</Text>
              ) : null}
            </View>
            <View style={styles.lotStats}>
              <Text style={[styles.statLabel, { color: colors.textMuted }]}>
                {t('auction.owner.reserve')}
              </Text>
              <Text style={[styles.statValue, { color: colors.cream }]}>
                {formatEtbAmount(Number(lot.reservePrice ?? 0))}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textMuted, marginTop: 8 }]}>
                {t('auction.owner.bidCount')}
              </Text>
              <Text style={[styles.bidCount, { color: colors.goldBright }]}>
                {lot.bidCount ?? 0}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 14,
  },
  title: {
    ...Typography.microCaps,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 14,
  },
  lotList: {
    gap: 10,
  },
  lotRow: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    gap: 12,
  },
  lotMain: {
    flex: 1,
    gap: 4,
  },
  lotTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  lotMeta: {
    fontSize: 12,
  },
  lotStats: {
    alignItems: 'flex-end',
    minWidth: 96,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  statValue: {
    fontSize: 14,
    fontWeight: '800',
    marginTop: 2,
  },
  bidCount: {
    fontSize: 22,
    fontWeight: '800',
    marginTop: 2,
    fontVariant: ['tabular-nums'],
  },
});

export default OwnerAuctionOverview;
