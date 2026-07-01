import { useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { AuthRequired } from '@/components/auth';
import { BidCard } from '@/components/bids/BidCard';
import { BidFilterPills } from '@/components/bids/BidFilterPills';
import { StatCard } from '@/components/auction/StatCard';
import { AppHeader } from '@/components/shell/AppHeader';
import { Skeleton } from '@/components/ui';
import { useMyBids } from '@/hooks/useMyBids';
import { useTheme } from '@/lib/appStore';
import { filterBidsByTab, summarizeBids } from '@/lib/bidUtils';
import { useIsAuthenticated } from '@/lib/authStore';
import { Typography, Spacing } from '@/theme';
import type { BidTabFilter } from '@/types/bid';

export default function BidsScreen() {
  const { t } = useTranslation();
  const isAuthenticated = useIsAuthenticated();

  if (!isAuthenticated) {
    return (
      <AuthRequired
        title={t('bids.title')}
        icon="gavel"
        message={t('authRequired.bidsMessage')}
        cta={t('authRequired.loginCta')}
        returnTo="/(tabs)/bids"
      />
    );
  }

  return <AuthenticatedBidsScreen />;
}

function AuthenticatedBidsScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { bids, loading, refreshing, error, refresh } = useMyBids();
  const [tab, setTab] = useState<BidTabFilter>('');

  const summary = useMemo(() => summarizeBids(bids), [bids]);
  const filteredBids = useMemo(() => filterBidsByTab(bids, tab), [bids, tab]);

  const listHeader = (
    <View style={styles.headerBlock}>
      <Text style={[Typography.body, { color: colors.textSecondary }]}>
        {t('bids.subtitle')}
      </Text>

      <View style={styles.statsRow}>
        <StatCard
          label={t('bids.summary.totalBids')}
          value={String(summary.total)}
          icon="gavel"
        />
        <StatCard
          label={t('bids.summary.activeBids')}
          value={String(summary.active)}
          icon="clock-outline"
        />
      </View>
      <View style={styles.statsRow}>
        <StatCard
          label={t('bids.summary.winningBids')}
          value={String(summary.winning)}
          icon="trophy-outline"
          trend="up"
        />
        <StatCard
          label={t('bids.summary.wonBids')}
          value={String(summary.won)}
          icon="check-decagram"
        />
      </View>

      <BidFilterPills value={tab} onChange={setTab} />

      <Text style={[Typography.microCaps, { color: colors.goldChampagne }]}>
        {t('bids.results', { count: filteredBids.length })}
      </Text>
    </View>
  );

  return (
    <View style={[styles.host, { backgroundColor: colors.base }]}>
      <AppHeader title={t('bids.title')} />
      <FlatList
        data={filteredBids}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <BidCard
            bid={item}
            onPress={
              item.auctionId
                ? () => router.push(`/auction/${item.auctionId}` as any)
                : undefined
            }
          />
        )}
        ListHeaderComponent={listHeader}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshing={refreshing}
        onRefresh={refresh}
        ListEmptyComponent={
          loading ? (
            <View style={styles.skeletonCol}>
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} style={{ height: 200, borderRadius: 16 }} />
              ))}
            </View>
          ) : error ? (
            <View style={styles.emptyWrap}>
              <MaterialCommunityIcons name="alert-circle-outline" size={28} color={colors.danger.fg} />
              <Text style={[Typography.body, { color: colors.danger.fg }]}>
                {t('bids.loadError', { message: error })}
              </Text>
              <Pressable onPress={refresh} hitSlop={8}>
                <Text style={[Typography.bodyMedium, { color: colors.goldBright, fontWeight: '700' }]}>
                  {t('common.retry')}
                </Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.emptyWrap}>
              <MaterialCommunityIcons name="gavel" size={32} color={colors.textMuted} />
              <Text style={[Typography.cardTitle, { color: colors.cream }]}>
                {t('bids.emptyTitle')}
              </Text>
              <Text style={[Typography.body, { color: colors.textMuted }]}>
                {t('bids.empty')}
              </Text>
            </View>
          )
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  host: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm2,
    paddingBottom: Spacing.tabBarClearance,
    flexGrow: 1,
  },
  headerBlock: {
    gap: Spacing.sm2,
    marginBottom: Spacing.md,
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.xs2,
  },
  separator: {
    height: Spacing.sm2,
  },
  skeletonCol: {
    gap: Spacing.sm2,
  },
  emptyWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.huge,
    gap: Spacing.xs2,
    paddingHorizontal: Spacing.xl2,
  },
});
