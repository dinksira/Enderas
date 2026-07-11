import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useTheme } from '@/lib/appStore';
import { Typography, Spacing, Radii } from '@/theme';

export type BidFlowStep = 'select' | 'bid' | 'submit';

const STEPS: { key: BidFlowStep; icon: keyof typeof MaterialCommunityIcons.glyphMap }[] = [
  { key: 'select', icon: 'checkbox-marked-circle-outline' },
  { key: 'bid', icon: 'cash-edit' },
  { key: 'submit', icon: 'file-upload-outline' },
];

interface BidFlowStepperProps {
  activeStep: BidFlowStep;
  selectedCount: number;
  totalItems: number;
}

export function BidFlowStepper({ activeStep, selectedCount, totalItems }: BidFlowStepperProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const activeIndex = STEPS.findIndex((step) => step.key === activeStep);

  return (
    <View
      style={[styles.card, { backgroundColor: colors.glassFill, borderColor: colors.goldBorder }]}
      accessibilityRole="summary"
    >
      <Text style={[Typography.microCaps, { color: colors.goldChampagne, fontSize: 10, marginBottom: 4 }]}>
        {t('auction.participation.flowTitle')}
      </Text>

      <View style={styles.track}>
        {STEPS.map((step, index) => {
          const done = index < activeIndex;
          const active = index === activeIndex;

          return (
            <View key={step.key} style={styles.stepCol}>
              {index > 0 ? (
                <View
                  style={[
                    styles.connector,
                    {
                      backgroundColor: done || active ? colors.goldBright : colors.divider,
                    },
                  ]}
                />
              ) : null}

              <View
                style={[
                  styles.badge,
                  {
                    backgroundColor: done
                      ? colors.success.soft
                      : active
                        ? colors.glassFillActive
                        : colors.baseElevated,
                    borderColor: done
                      ? colors.success.border
                      : active
                        ? colors.goldBorderActive
                        : colors.goldBorder,
                  },
                ]}
              >
                {done ? (
                  <MaterialCommunityIcons name="check" size={14} color={colors.success.fg} />
                ) : (
                  <MaterialCommunityIcons
                    name={step.icon}
                    size={14}
                    color={active ? colors.goldBright : colors.textMuted}
                  />
                )}
              </View>

              <Text
                style={[
                  Typography.caption,
                  styles.stepLabel,
                  {
                    color: active ? colors.cream : done ? colors.textSecondary : colors.textMuted,
                    fontWeight: active ? '700' : '500',
                  },
                ]}
                numberOfLines={1}
              >
                {t(`auction.participation.flowSteps.${step.key}.title`)}
              </Text>
            </View>
          );
        })}
      </View>

      <Text style={[Typography.caption, { color: colors.textSecondary, lineHeight: 17, marginTop: Spacing.xs }]}>
        {activeStep === 'select'
          ? t('auction.participation.flowSteps.select.hint', { total: totalItems })
          : activeStep === 'bid'
            ? t('auction.participation.flowSteps.bid.hint', { count: selectedCount })
            : t('auction.participation.flowSteps.submit.hint')}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radii.lg,
    borderWidth: 1,
    padding: Spacing.sm2,
  },
  track: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  stepCol: {
    flex: 1,
    alignItems: 'center',
    position: 'relative',
  },
  connector: {
    position: 'absolute',
    top: 14,
    right: '50%',
    left: '-50%',
    height: 2,
    zIndex: 0,
  },
  badge: {
    width: 28,
    height: 28,
    borderRadius: Radii.full,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  stepLabel: {
    fontSize: 10,
    textAlign: 'center',
    marginTop: 4,
    paddingHorizontal: 2,
  },
});

export default BidFlowStepper;
