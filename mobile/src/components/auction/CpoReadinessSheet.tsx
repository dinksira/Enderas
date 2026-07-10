import { useMemo } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { GoldButton } from '@/components/auth';
import { formatEtbAmount } from '@/lib/auctionUtils';
import { useTheme } from '@/lib/appStore';
import { GLASS_RADIUS, glassElevation } from '@/lib/glassStyles';
import { Typography, Spacing, Radii } from '@/theme';

export type CpoReadinessItem = {
  id: string;
  status: 'ok' | 'warning' | 'error';
  title: string;
  description: string;
  detail?: string;
};

interface CpoReadinessSheetProps {
  visible: boolean;
  items: CpoReadinessItem[];
  cpoAmount: number;
  onClose: () => void;
  onContinue?: () => void;
}

export function CpoReadinessSheet({
  visible,
  items,
  cpoAmount,
  onClose,
  onContinue,
}: CpoReadinessSheetProps) {
  const { t } = useTranslation();
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  const allReady = useMemo(() => items.every((item) => item.status === 'ok'), [items]);
  const hasErrors = items.some((item) => item.status === 'error');

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <View style={[styles.overlay, { backgroundColor: colors.scrim }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityRole="button" />

        <View
          style={[
            styles.sheet,
            {
              backgroundColor: colors.baseElevated,
              borderColor: colors.goldBorder,
              paddingBottom: Math.max(insets.bottom, Spacing.md),
              ...glassElevation(isDark, 'floating'),
            },
          ]}
        >
          <View style={styles.handleRow}>
            <View style={[styles.handle, { backgroundColor: colors.divider }]} />
          </View>

          <View style={styles.header}>
            <MaterialCommunityIcons
              name={allReady ? 'check-decagram-outline' : 'information-outline'}
              size={22}
              color={allReady ? colors.success.fg : colors.goldChampagne}
            />
            <View style={styles.headerCopy}>
              <Text style={[Typography.cardTitle, { color: colors.cream }]}>
                {allReady
                  ? t('auction.participation.cpoReadinessReadyTitle')
                  : t('auction.participation.cpoReadinessTitle')}
              </Text>
              <Text style={[Typography.caption, { color: colors.textSecondary }]}>
                {allReady
                  ? t('auction.participation.cpoReadinessReadyBody', { amount: formatEtbAmount(cpoAmount) })
                  : t('auction.participation.cpoReadinessBody')}
              </Text>
            </View>
          </View>

          <ScrollView style={styles.listScroll} contentContainerStyle={styles.listContent}>
            {items.map((item) => {
              const iconName =
                item.status === 'ok'
                  ? 'check-circle-outline'
                  : item.status === 'warning'
                    ? 'clock-outline'
                    : 'alert-circle-outline';
              const iconColor =
                item.status === 'ok'
                  ? colors.success.fg
                  : item.status === 'warning'
                    ? colors.goldChampagne
                    : colors.danger.fg;
              const rowBg =
                item.status === 'ok'
                  ? colors.success.soft
                  : item.status === 'warning'
                    ? colors.glassFill
                    : colors.danger.soft;
              const rowBorder =
                item.status === 'ok'
                  ? colors.success.border
                  : item.status === 'warning'
                    ? colors.goldBorder
                    : colors.danger.border;

              return (
                <View
                  key={item.id}
                  style={[styles.row, { backgroundColor: rowBg, borderColor: rowBorder }]}
                >
                  <MaterialCommunityIcons name={iconName} size={18} color={iconColor} />
                  <View style={styles.rowCopy}>
                    <Text style={[Typography.bodyMedium, { color: colors.cream, fontWeight: '700' }]}>
                      {item.title}
                    </Text>
                    <Text style={[Typography.caption, { color: colors.textSecondary, lineHeight: 17 }]}>
                      {item.description}
                    </Text>
                    {item.detail ? (
                      <Text style={[Typography.caption, { color: colors.textMuted, marginTop: 2 }]}>
                        {item.detail}
                      </Text>
                    ) : null}
                  </View>
                </View>
              );
            })}
          </ScrollView>

          <View style={styles.actions}>
            {allReady && onContinue ? (
              <GoldButton
                label={t('auction.participation.cpoReadinessContinue')}
                onPress={onContinue}
                compact
              />
            ) : (
              <GoldButton
                label={hasErrors ? t('auction.participation.cpoReadinessGoBack') : t('common.close')}
                onPress={onClose}
                variant={hasErrors ? 'primary' : 'outline'}
                compact
              />
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    maxHeight: '80%',
    borderTopLeftRadius: GLASS_RADIUS.floating,
    borderTopRightRadius: GLASS_RADIUS.floating,
    borderWidth: 1.5,
    borderBottomWidth: 0,
    paddingHorizontal: Spacing.md,
  },
  handleRow: {
    alignItems: 'center',
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xs,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  headerCopy: {
    flex: 1,
    gap: 4,
  },
  listScroll: {
    maxHeight: 320,
  },
  listContent: {
    gap: Spacing.xs,
    paddingBottom: Spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    padding: Spacing.sm2,
    borderRadius: Radii.input,
    borderWidth: 1,
  },
  rowCopy: {
    flex: 1,
    gap: 2,
  },
  actions: {
    paddingTop: Spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,250,240,0.1)',
  },
});

export default CpoReadinessSheet;
