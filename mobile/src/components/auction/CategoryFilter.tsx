import { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import { useTheme } from '@/lib/appStore';
import { SheetDropdown } from '@/components/sheet';
import { useAssetCategories } from '@/hooks/useAssetCategories';
import { Spacing, Typography } from '@/theme';

interface CategoryFilterProps {
  value: string;
  onChange: (value: string) => void;
}

/**
 * Category filter dropdown for the dashboard search bar.
 *
 * Now built on the shared `<SheetDropdown>` primitive — same motion,
 * backdrop, and dismiss language as every other overlay.
 *
 * Previously positioned its dropdown with a hardcoded
 * `paddingTop: insets.top + 150` which broke whenever the header
 * layout shifted. The new primitive uses `insets.top + 60` (the same
 * value used by `LanguageSelector` and `NotificationBell`), so all
 * three header dropdowns now anchor to the same y-coordinate.
 */
export function CategoryFilter({ value, onChange }: CategoryFilterProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { categories, loading } = useAssetCategories();
  const [open, setOpen] = useState(false);

  return (
    <View>
      <Pressable
        onPress={() => setOpen((v) => !v)}
        style={({ pressed }) => [
          styles.trigger,
          {
            backgroundColor: colors.glassFill,
            borderColor: value ? colors.goldBorderActive : colors.goldBorder,
            opacity: pressed ? 0.85 : 1,
          },
        ]}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel={t('dashboard.browse.category')}
      >
        <MaterialCommunityIcons name="filter-variant" size={18} color={colors.goldBright} />
      </Pressable>

      <SheetDropdown visible={open} onDismiss={() => setOpen(false)} maxWidth={220}>
        <View style={[styles.dropdownHeader, { borderBottomColor: colors.divider }]}>
          <Text style={[Typography.eyebrow, { color: colors.goldBright }]}>
            {t('dashboard.browse.category').toUpperCase()}
          </Text>
        </View>
        {loading ? (
          <View style={styles.loadingRow}>
            <Text style={[Typography.bodyMedium, { color: colors.textMuted }]}>
              {t('common.loading')}
            </Text>
          </View>
        ) : (
          ['', ...categories].map((cat) => {
            const active = cat === value;
            return (
              <Pressable
                key={cat || 'all'}
                onPress={() => {
                  onChange(cat);
                  setOpen(false);
                }}
                style={({ pressed }) => [
                  styles.optionRow,
                  {
                    backgroundColor: active ? colors.glassFillActive : 'transparent',
                    opacity: pressed ? 0.7 : 1,
                  },
                ]}
              >
                <Text
                  style={[
                    Typography.bodyMedium,
                    { color: active ? colors.goldBright : colors.cream },
                  ]}
                >
                  {cat
                    ? t(`dashboard.categories.${cat}`, { defaultValue: cat })
                    : t('dashboard.filters.all')}
                </Text>
                {active ? (
                  <MaterialCommunityIcons name="check-circle" size={18} color={colors.goldBright} />
                ) : null}
              </Pressable>
            );
          })
        )}
      </SheetDropdown>
    </View>
  );
}

const styles = StyleSheet.create({
  trigger: {
    width: 40,
    height: 40,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dropdownHeader: {
    paddingHorizontal: Spacing.sm2,
    paddingVertical: Spacing.sm2,
    borderBottomWidth: 1,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.sm2,
    paddingVertical: Spacing.sm2,
  },
  loadingRow: {
    paddingHorizontal: Spacing.sm2,
    paddingVertical: Spacing.sm2,
  },
});

export default CategoryFilter;
