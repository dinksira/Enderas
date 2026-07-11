import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { useTheme } from '@/lib/appStore';
import type { BidTabFilter } from '@/types/bid';

const TAB_FILTERS: BidTabFilter[] = ['', 'submitted', 'invalid'];

interface BidFilterPillsProps {
  value: BidTabFilter;
  onChange: (value: BidTabFilter) => void;
}

export function BidFilterPills({ value, onChange }: BidFilterPillsProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {TAB_FILTERS.map((filter) => {
        const isActive = value === filter;
        const labelKey = filter || 'all';

        return (
          <Pressable
            key={filter || 'all'}
            onPress={() => onChange(filter)}
            accessibilityRole="button"
            accessibilityState={{ selected: isActive }}
            style={({ pressed }) => [
              styles.pill,
              {
                backgroundColor: isActive ? colors.goldBright : colors.glassFill,
                borderColor: isActive ? colors.goldBorderActive : colors.goldBorder,
                opacity: pressed ? 0.85 : 1,
              },
            ]}
          >
            {isActive ? (
              <View style={[styles.activeDot, { backgroundColor: colors.textOnGold }]} />
            ) : null}
            <Text
              style={[
                styles.pillText,
                { color: isActive ? colors.textOnGold : colors.textSecondary },
              ]}
            >
              {t(`bids.tabs.${labelKey}`)}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 2,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  pillText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
});

export default BidFilterPills;
