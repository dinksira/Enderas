import { useCallback, useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { BrowseAuctionCard } from '@/components/auction/BrowseAuctionCard';
import { CategoryFilter } from '@/components/auction/CategoryFilter';
import { FilterPills } from '@/components/auction/FilterPills';
import { AuctionParticipationBanner } from '@/components/kyc/AuctionParticipationBanner';
import { AppHeader } from '@/components/shell/AppHeader';
import { ListItemEntrance, Skeleton } from '@/components/ui';
import { useTheme } from '@/lib/appStore';
import { useBrowseAuctions } from '@/hooks/useBrowseAuctions';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { Typography, Spacing, Radii } from '@/theme';
import type { AuctionStatusFilter, BrowseAuction } from '@/types/auction';

/**
 * Dashboard — the primary browse surface.
 *
 * Layout
 * ------
 *   [AppHeader]
 *   [AuctionParticipationBanner]
 *   ┌────────────────────────────────────────┐
 *   │  subtitle                              │
 *   │  [search bar] [category filter]        │
 *   │  [filter pills: all / live / closed]   │
 *   │  N results · sort by                   │
 *   └────────────────────────────────────────┘
 *   ┌──────────┐ ┌──────────┐
 *   │  card 1  │ │  card 2  │    ← 2-col grid
 *   ├──────────┤ ├──────────┤       (compact variant)
 *   │  card 3  │ │  card 4  │
 *   └──────────┘ └──────────┘
 *
 * Responsiveness
 * --------------
 *   The grid uses `numColumns` derived from window width:
 *     - < 380px : 2 columns (small phones)
 *     - < 640px : 2 columns (default phones)
 *     - ≥ 640px : 3 columns (large phones / tablets in portrait)
 *   Cards switch to the `compact` variant (smaller thumbnail, fewer
 *   description lines) so the grid never overflows horizontally.
 *
 * Visual variety
 * --------------
 *   The first item in each row can be promoted to a wider "featured"
 *   card if its category is a featured one (vehicles / realEstate /
 *   jewelry). This breaks the uniform grid and gives the dashboard a
 *   more curated feel. Currently disabled — kept here as a hook for
 *   future product work.
 *
 * Performance
 * -----------
 *   - `BrowseAuctionCard` is wrapped in `memo`, so re-renders only
 *     happen when an auction prop actually changes.
 *   - `handleCardPress` is memoized per-auction-id via `useCallback`
 *     so the cards' onPress reference stays stable across renders.
 *   - Empty/loading states use the `Skeleton` placeholder to make the
 *     wait feel smoother than a centered spinner.
 */
export default function DashboardScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { width: screenWidth } = useWindowDimensions();

  const [statusFilter, setStatusFilter] = useState<AuctionStatusFilter>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 350);

  const { records, loading, refreshing, error, refresh } = useBrowseAuctions({
    status: statusFilter,
    category: categoryFilter,
    search: debouncedSearch,
  });

  // Responsive column count — 2 on phones, 3 on larger screens.
  const numColumns = screenWidth >= 640 ? 3 : 2;

  // Press handler factory — memoized so `BrowseAuctionCard` (wrapped in
  // `memo`) doesn't re-render every time the parent does.
  const handleCardPress = useCallback(
    (id: string) => () => {
      router.push(`/auction/${id}`);
    },
    [],
  );

  const listHeader = useMemo(
    () => (
      <View style={styles.headerBlock}>
        <Text style={[Typography.body, { color: colors.textSecondary }]}>
          {t('dashboard.subtitle')}
        </Text>

        <View
          style={[
            styles.searchBar,
            { backgroundColor: colors.glassFill, borderColor: colors.goldBorder },
          ]}
        >
          <MaterialCommunityIcons name="magnify" size={18} color={colors.textMuted} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder={t('dashboard.browse.searchPlaceholder')}
            placeholderTextColor={colors.textMuted}
            style={[Typography.bodyMedium, { color: colors.cream, flex: 1, padding: 0 }]}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
            clearButtonMode="while-editing"
          />
          {search.length > 0 ? (
            <Pressable onPress={() => setSearch('')} hitSlop={8}>
              <MaterialCommunityIcons name="close-circle" size={18} color={colors.textMuted} />
            </Pressable>
          ) : null}
          <View style={{ width: Spacing.xs }} />
          <CategoryFilter value={categoryFilter} onChange={setCategoryFilter} />
        </View>

        <FilterPills value={statusFilter} onChange={setStatusFilter} />

        <Text style={[Typography.microCaps, { color: colors.goldChampagne }]}>
          {t('dashboard.browse.results', { count: records.length })}
        </Text>
      </View>
    ),
    [colors, records.length, search, statusFilter, categoryFilter, t],
  );

  const renderItem = useCallback(
    ({ item, index }: { item: BrowseAuction; index: number }) => (
      <ListItemEntrance
        index={index}
        // Cap each cell at 1/numColumns of the row so a lone card (e.g. a
        // single filtered result, or the odd last item in a row) stays
        // grid-sized and left-aligned instead of stretching full width.
        style={[styles.gridCell, numColumns > 1 && { maxWidth: `${100 / numColumns}%` }]}
      >
        <BrowseAuctionCard
          auction={item}
          onPress={handleCardPress(item.id)}
          compact
        />
      </ListItemEntrance>
    ),
    [handleCardPress, numColumns],
  );

  const ListEmptyComponent = loading ? (
    <View style={styles.skeletonGrid}>
      {Array.from({ length: 4 }).map((_, i) => (
        <View key={i} style={styles.gridCell}>
          <Skeleton style={{ height: 96, borderRadius: Radii.xl }} />
          <Skeleton style={{ height: 14, marginTop: Spacing.xxs2, width: '80%' }} />
          <Skeleton style={{ height: 12, marginTop: Spacing.xxs, width: '60%' }} />
        </View>
      ))}
    </View>
  ) : error ? (
    <View style={styles.emptyWrap}>
      <MaterialCommunityIcons name="alert-circle-outline" size={28} color={colors.danger.fg} />
      <Text style={[Typography.body, { color: colors.danger.fg }]}>
        {t('dashboard.browse.error', { message: error })}
      </Text>
    </View>
  ) : (
    <View style={styles.emptyWrap}>
      <MaterialCommunityIcons name="gavel" size={32} color={colors.textMuted} />
      <Text style={[Typography.cardTitle, { color: colors.cream }]}>
        {t('dashboard.browse.empty')}
      </Text>
      <Text style={[Typography.body, { color: colors.textMuted }]}>
        {t('dashboard.browse.emptyHint')}
      </Text>
    </View>
  );

  return (
    <View style={[styles.host, { backgroundColor: colors.base }]}>
      <AppHeader title={t('tabs.dashboard')} />
      <AuctionParticipationBanner />

      <FlatList
        data={records}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListHeaderComponent={listHeader}
        // `numColumns` is fixed at mount — changing it requires a `key`
        // reset so FlatList remounts its cells with the new layout.
        key={`grid-${numColumns}`}
        numColumns={numColumns}
        columnWrapperStyle={numColumns > 1 ? styles.rowGap : undefined}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        refreshing={refreshing}
        onRefresh={refresh}
        ListEmptyComponent={ListEmptyComponent}
        // Don't render a separator between grid rows — the gap is
        // handled by the cell padding.
        ItemSeparatorComponent={null}
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
  },
  headerBlock: {
    gap: Spacing.sm2,
    marginBottom: Spacing.md,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs2,
    borderWidth: 1.5,
    borderRadius: Radii.input,
    paddingHorizontal: Spacing.sm2,
    paddingVertical: Spacing.xs2,
  },
  resultsLabel: {
    letterSpacing: 1.4,
  },
  // Grid layout — each cell takes 1/numColumns of the row, minus the
  // gap. We use `flex: 1` plus a small horizontal padding so cards
  // don't touch each other or the screen edge.
  rowGap: {
    gap: Spacing.sm,
  },
  gridCell: {
    flex: 1,
    paddingHorizontal: Spacing.xxs2,
    marginBottom: Spacing.sm,
  },
  skeletonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  emptyWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.huge,
    gap: Spacing.xs2,
    paddingHorizontal: Spacing.xl2,
  },
});
