import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useTheme } from '@/lib/appStore';
import { Typography, Spacing, Radii } from '@/theme';

interface LotCategoryHeaderProps {
  lotLabel: string;
  lotTitle?: string | null;
  itemCount: number;
  /** Number of items in this lot the user has selected (shown as a badge). */
  selectedCount?: number;
  /** When provided, the header becomes a collapse/expand toggle. */
  collapsed?: boolean;
  onToggle?: () => void;
}

export function LotCategoryHeader({
  lotLabel,
  lotTitle,
  itemCount,
  selectedCount = 0,
  collapsed = false,
  onToggle,
}: LotCategoryHeaderProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();

  const categoryName = lotTitle?.trim() || t('auction.participation.unnamedLotCategory');
  const collapsible = typeof onToggle === 'function';

  const inner = (
    <View
      style={[
        styles.bar,
        collapsed ? styles.barCollapsed : styles.barExpanded,
        {
          backgroundColor: colors.glassFill,
          borderColor: colors.goldBorder,
        },
      ]}
    >
      <MaterialCommunityIcons
        name={collapsed ? 'folder-outline' : 'folder-open-outline'}
        size={16}
        color={colors.goldChampagne}
      />
      <View style={styles.copy}>
        <Text style={[Typography.microCaps, { color: colors.goldChampagne, fontSize: 9 }]}>
          {lotLabel}
        </Text>
        <Text style={[Typography.bodyMedium, { color: colors.cream, fontWeight: '700' }]} numberOfLines={1}>
          {categoryName}
        </Text>
      </View>

      {selectedCount > 0 ? (
        <View style={[styles.badge, { backgroundColor: colors.goldBright }]}>
          <MaterialCommunityIcons name="check" size={11} color={colors.textOnGold} />
          <Text style={[styles.badgeText, { color: colors.textOnGold }]}>{selectedCount}</Text>
        </View>
      ) : null}

      <Text style={[Typography.caption, { color: colors.textMuted }]}>
        {t('auction.participation.lotItemCount', { count: itemCount })}
      </Text>

      {collapsible ? (
        <MaterialCommunityIcons
          name={collapsed ? 'chevron-down' : 'chevron-up'}
          size={20}
          color={colors.textMuted}
        />
      ) : null}
    </View>
  );

  return (
    <View style={styles.host}>
      {collapsible ? (
        <Pressable
          onPress={onToggle}
          accessibilityRole="button"
          accessibilityState={{ expanded: !collapsed }}
          accessibilityLabel={`${lotLabel} · ${categoryName}`}
        >
          {inner}
        </Pressable>
      ) : (
        inner
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  host: {
    paddingTop: Spacing.md,
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.sm2,
    paddingVertical: Spacing.sm2,
  },
  barCollapsed: {
    borderWidth: 1,
    borderRadius: Radii.lg,
  },
  barExpanded: {
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderTopLeftRadius: Radii.lg,
    borderTopRightRadius: Radii.lg,
  },
  copy: {
    flex: 1,
    gap: 1,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: Radii.full,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
});

export default LotCategoryHeader;
