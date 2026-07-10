import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useTheme } from '@/lib/appStore';
import { Typography, Spacing, Radii } from '@/theme';

interface LotCategoryHeaderProps {
  lotLabel: string;
  lotTitle?: string | null;
  itemCount: number;
}

export function LotCategoryHeader({ lotLabel, lotTitle, itemCount }: LotCategoryHeaderProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();

  const categoryName = lotTitle?.trim() || t('auction.participation.unnamedLotCategory');

  return (
    <View style={styles.host}>
      <View
        style={[
          styles.bar,
          {
            backgroundColor: colors.glassFill,
            borderColor: colors.goldBorder,
          },
        ]}
      >
        <MaterialCommunityIcons name="folder-outline" size={14} color={colors.goldChampagne} />
        <View style={styles.copy}>
          <Text style={[Typography.microCaps, { color: colors.goldChampagne, fontSize: 9 }]}>
            {lotLabel}
          </Text>
          <Text style={[Typography.bodyMedium, { color: colors.cream, fontWeight: '700' }]} numberOfLines={1}>
            {categoryName}
          </Text>
        </View>
        <Text style={[Typography.caption, { color: colors.textMuted }]}>
          {t('auction.participation.lotItemCount', { count: itemCount })}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  host: {
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xs,
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.sm2,
    paddingVertical: Spacing.sm,
    borderRadius: Radii.input,
    borderWidth: 1,
  },
  copy: {
    flex: 1,
    gap: 1,
  },
});

export default LotCategoryHeader;
