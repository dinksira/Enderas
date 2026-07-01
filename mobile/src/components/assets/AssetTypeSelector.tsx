import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useTheme } from '@/lib/appStore';
import { ASSET_TYPE_KEYS } from '@/lib/assetFormUtils';
import { getCategoryTheme } from '@/lib/auctionUtils';
import type { AssetType } from '@/types/asset';

interface AssetTypeSelectorProps {
  value: AssetType | '';
  onChange: (value: AssetType) => void;
  error?: string;
  disabled?: boolean;
}

export function AssetTypeSelector({ value, onChange, error, disabled }: AssetTypeSelectorProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();

  return (
    <View style={styles.host}>
      <Text style={[styles.label, { color: colors.goldChampagne }]}>
        {t('assets.form.fields.assetType')}
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {ASSET_TYPE_KEYS.map((type) => {
          const theme = getCategoryTheme(type);
          const selected = value === type;
          return (
            <Pressable
              key={type}
              disabled={disabled}
              onPress={() => onChange(type)}
              style={({ pressed }) => [
                styles.chip,
                {
                  backgroundColor: selected ? colors.glassFillActive : colors.glassFill,
                  borderColor: selected ? colors.goldBright : colors.goldBorder,
                  opacity: pressed ? 0.9 : 1,
                },
              ]}
            >
              <MaterialCommunityIcons
                name={theme.icon}
                size={16}
                color={selected ? colors.goldBright : colors.textMuted}
              />
              <Text
                style={[
                  styles.chipText,
                  { color: selected ? colors.cream : colors.textSecondary },
                ]}
              >
                {t(`dashboard.categories.${type}`)}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
      {error ? <Text style={[styles.error, { color: colors.danger.fg }]}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  host: {
    gap: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  row: {
    gap: 8,
    paddingVertical: 2,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  error: {
    fontSize: 12,
    fontWeight: '500',
  },
});

export default AssetTypeSelector;
