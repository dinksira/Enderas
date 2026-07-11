import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BottomSheetScrollView } from '@gorhom/bottom-sheet';

import { GoldButton } from '@/components/auth';
import { Sheet } from '@/components/sheet';
import { formatEtbAmount } from '@/lib/auctionUtils';
import { useTheme } from '@/lib/appStore';
import { Radii, Spacing, Typography } from '@/theme';

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

/**
 * CPO readiness checklist sheet. Built on the shared `<Sheet>` primitive
 * — was previously a hand-rolled RN `Modal` with its own translateY
 * animation, `statusBarTranslucent`, and absolute-positioned press
 * catcher. Now uses the same backdrop, handle, and gesture-dismiss
 * language as `BidEntrySheet`.
 */
export function CpoReadinessSheet({
  visible,
  items,
  cpoAmount,
  onClose,
  onContinue,
}: CpoReadinessSheetProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();

  const allReady = useMemo(() => items.every((item) => item.status === 'ok'), [items]);
  const readyCount = useMemo(() => items.filter((item) => item.status === 'ok').length, [items]);
  const nextStep = useMemo(
    () => items.find((item) => item.status === 'error') ?? items.find((item) => item.status === 'warning'),
    [items],
  );
  const remainingSteps = items.filter((item) => item.status !== 'ok').length;
  // When only one (or zero) step is left, don't show a full checklist — just
  // tell the user what to do and let the sheet shrink to fit that content.
  const compact = remainingSteps <= 1;

  return (
    <Sheet
      visible={visible}
      snapPoints={compact ? undefined : ['82%']}
      dynamicSizing={compact}
      onDismiss={onClose}
      contentPadding={Spacing.md}
    >
      <View style={styles.header}>
        <View
          style={[
            styles.headerIcon,
            {
              backgroundColor: allReady ? colors.success.soft : colors.glassFill,
              borderColor: allReady ? colors.success.border : colors.goldBorder,
            },
          ]}
        >
          <MaterialCommunityIcons
            name={allReady ? 'check-decagram-outline' : 'clipboard-list-outline'}
            size={22}
            color={allReady ? colors.success.fg : colors.goldChampagne}
          />
        </View>
        <View style={styles.headerCopy}>
          <Text style={[Typography.cardTitle, { color: colors.cream }]}>
            {allReady
              ? t('auction.participation.cpoReadinessReadyTitle')
              : t('auction.participation.cpoReadinessTitle')}
          </Text>
          <Text style={[Typography.caption, { color: colors.textSecondary, lineHeight: 17 }]}>
            {allReady
              ? t('auction.participation.cpoReadinessReadyBody', { amount: formatEtbAmount(cpoAmount) })
              : t('auction.participation.cpoReadinessProgress', {
                  ready: readyCount,
                  total: items.length,
                })}
          </Text>
        </View>
      </View>

      {!allReady && nextStep ? (
        <View style={[styles.nextStep, { backgroundColor: colors.glassFillActive, borderColor: colors.goldBorderActive }]}>
          <View style={styles.nextStepHead}>
            <MaterialCommunityIcons name="arrow-right-circle" size={16} color={colors.goldBright} />
            <Text style={[Typography.microCaps, { color: colors.goldBright, fontSize: 10 }]}>
              {t('auction.participation.cpoReadinessNextStep')}
            </Text>
            {remainingSteps > 1 ? (
              <Text style={[Typography.caption, { color: colors.textMuted, fontSize: 11 }]}>
                {t('auction.participation.cpoReadinessRemaining', { count: remainingSteps })}
              </Text>
            ) : null}
          </View>
          <Text style={[Typography.bodyMedium, { color: colors.cream, fontWeight: '700' }]}>
            {nextStep.title}
          </Text>
          <Text style={[Typography.caption, { color: colors.textSecondary, lineHeight: 18 }]}>
            {nextStep.description}
          </Text>
          {nextStep.detail ? (
            <Text style={[Typography.caption, { color: colors.textMuted, lineHeight: 17, marginTop: 2 }]}>
              {nextStep.detail}
            </Text>
          ) : null}
        </View>
      ) : null}

      {compact ? null : (
        <>
      <Text style={[Typography.microCaps, styles.listLabel, { color: colors.goldChampagne }]}>
        {t('auction.participation.cpoReadinessChecklist')}
      </Text>

      <BottomSheetScrollView style={styles.listScroll} contentContainerStyle={styles.listContent} showsVerticalScrollIndicator>
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
      </BottomSheetScrollView>
        </>
      )}

      <View style={[styles.actions, compact ? styles.actionsCompact : null]}>
        {allReady && onContinue ? (
          <GoldButton
            label={t('auction.participation.cpoReadinessContinue')}
            onPress={onContinue}
            compact
          />
        ) : (
          <View style={[styles.helperRow, { backgroundColor: colors.glassFill, borderColor: colors.goldBorder }]}>
            <MaterialCommunityIcons name="information-outline" size={16} color={colors.goldChampagne} />
            <Text style={[Typography.caption, { color: colors.textSecondary, flex: 1, lineHeight: 17 }]}>
              {t('auction.participation.uploadHelperDefault')}
            </Text>
          </View>
        )}
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCopy: {
    flex: 1,
    gap: 4,
  },
  nextStep: {
    borderRadius: Radii.lg,
    borderWidth: 1,
    padding: Spacing.sm2,
    gap: 3,
    marginBottom: Spacing.sm,
  },
  nextStepHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  listLabel: {
    fontSize: 10,
    marginBottom: Spacing.xs,
  },
  listScroll: {
    maxHeight: 260,
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
    paddingTop: Spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(122, 180, 216, 0.12)',
  },
  actionsCompact: {
    paddingTop: Spacing.sm,
    borderTopWidth: 0,
  },
  helperRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.xs,
    padding: Spacing.sm,
    borderRadius: Radii.input,
    borderWidth: 1,
  },
});

export default CpoReadinessSheet;
