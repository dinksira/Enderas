import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useTheme } from '@/lib/appStore';
import { Typography, Spacing, Radii } from '@/theme';

import type { BidFlowStep } from '@/components/auction/BidFlowStepper';

const STEPS = [
  { key: 'browse', icon: 'image-search-outline' as const },
  { key: 'select', icon: 'checkbox-marked-circle-outline' as const },
  { key: 'bid', icon: 'cash-edit' as const },
  { key: 'submit', icon: 'file-upload-outline' as const },
] as const;

function flowToGuideHighlight(step: BidFlowStep): (typeof STEPS)[number]['key'] {
  if (step === 'select') return 'select';
  if (step === 'bid') return 'bid';
  return 'submit';
}

interface BidGuideCardProps {
  activeStep?: BidFlowStep;
}

export function BidGuideCard({ activeStep }: BidGuideCardProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [expanded, setExpanded] = useState(false);

  const highlightKey = activeStep ? flowToGuideHighlight(activeStep) : null;

  if (!expanded) {
    return (
      <Pressable
        onPress={() => setExpanded(true)}
        style={[styles.collapsed, { backgroundColor: colors.glassFill, borderColor: colors.goldBorder }]}
        accessibilityRole="button"
        accessibilityLabel={t('auction.participation.guideShow')}
      >
        <MaterialCommunityIcons name="lightbulb-on-outline" size={16} color={colors.goldChampagne} />
        <Text style={[Typography.caption, { color: colors.goldChampagne, flex: 1, fontWeight: '600' }]}>
          {t('auction.participation.guideCollapsed')}
        </Text>
        <MaterialCommunityIcons name="chevron-down" size={18} color={colors.textMuted} />
      </Pressable>
    );
  }

  return (
    <View style={[styles.card, { backgroundColor: colors.glassFill, borderColor: colors.goldBorder }]}>
      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <MaterialCommunityIcons name="lightbulb-on-outline" size={18} color={colors.goldChampagne} />
          <Text style={[Typography.bodyMedium, { color: colors.cream, fontWeight: '700' }]}>
            {t('auction.participation.guideTitle')}
          </Text>
        </View>
        <Pressable
          onPress={() => setExpanded(false)}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={t('auction.participation.guideHide')}
        >
          <MaterialCommunityIcons name="chevron-up" size={20} color={colors.textMuted} />
        </Pressable>
      </View>

      <Text style={[Typography.caption, { color: colors.textSecondary, marginBottom: Spacing.xs }]}>
        {t('auction.participation.guideIntro')}
      </Text>

      <View style={styles.steps}>
        {STEPS.map((step, index) => {
          const highlighted = highlightKey === step.key || (highlightKey === 'select' && step.key === 'browse');
          const done =
            highlightKey != null &&
            STEPS.findIndex((s) => s.key === highlightKey) > index;

          return (
          <View
            key={step.key}
            style={[
              styles.step,
              highlighted && { backgroundColor: colors.glassFillActive, borderRadius: Radii.sm, marginHorizontal: -4, paddingHorizontal: 4, paddingVertical: 4 },
            ]}
          >
            <View
              style={[
                styles.stepBadge,
                {
                  backgroundColor: done ? colors.success.soft : highlighted ? colors.glassFillActive : colors.baseElevated,
                  borderColor: done ? colors.success.border : highlighted ? colors.goldBorderActive : colors.goldBorder,
                },
              ]}
            >
              {done ? (
                <MaterialCommunityIcons name="check" size={14} color={colors.success.fg} />
              ) : (
                <MaterialCommunityIcons name={step.icon} size={15} color={highlighted ? colors.goldBright : colors.goldChampagne} />
              )}
            </View>
            <View style={styles.stepCopy}>
              <Text style={[Typography.caption, { color: highlighted ? colors.cream : colors.cream, fontWeight: highlighted ? '800' : '700' }]}>
                {index + 1}. {t(`auction.participation.guideSteps.${step.key}.title`)}
                {highlighted ? ` ${t('auction.participation.guideCurrentStep')}` : ''}
              </Text>
              <Text style={[Typography.caption, { color: colors.textMuted, lineHeight: 17 }]}>
                {t(`auction.participation.guideSteps.${step.key}.body`)}
              </Text>
            </View>
          </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radii.lg,
    borderWidth: 1,
    padding: Spacing.sm2,
    gap: Spacing.xs,
  },
  collapsed: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    borderRadius: Radii.lg,
    borderWidth: 1,
    paddingHorizontal: Spacing.sm2,
    paddingVertical: Spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerCopy: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    flex: 1,
  },
  steps: {
    gap: Spacing.sm,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },
  stepBadge: {
    width: 30,
    height: 30,
    borderRadius: Radii.sm,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepCopy: {
    flex: 1,
    gap: 2,
  },
});

export default BidGuideCard;
