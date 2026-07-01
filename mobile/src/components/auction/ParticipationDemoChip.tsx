import type { ComponentProps } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import {
  getParticipationDemoStep,
  resolveParticipationRecord,
  type ParticipationDemoStep,
} from '@/data/mockParticipationSeeds';
import { useAuctionParticipationStore } from '@/lib/auctionParticipationStore';
import { useTheme } from '@/lib/appStore';
import { Typography, Radii } from '@/theme';
import { toneToStatus, type UiTone } from '@/theme/statusTones';

const STEP_TONE: Record<ParticipationDemoStep, UiTone> = {
  not_started: 'pending',
  doc_pending: 'pending',
  doc_approved: 'live',
  bids_draft: 'ending',
  cpo_pending: 'pending',
  cpo_approved: 'won',
};

const STEP_ICON: Record<ParticipationDemoStep, ComponentProps<typeof MaterialCommunityIcons>['name']> = {
  not_started: 'account-outline',
  doc_pending: 'clock-outline',
  doc_approved: 'file-check-outline',
  bids_draft: 'format-list-checks',
  cpo_pending: 'shield-sync-outline',
  cpo_approved: 'check-decagram-outline',
};

interface ParticipationDemoChipProps {
  auctionId: string;
  compact?: boolean;
}

export function ParticipationDemoChip({ auctionId, compact }: ParticipationDemoChipProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const storedRecord = useAuctionParticipationStore((s) => s.records[auctionId]);
  const step = getParticipationDemoStep(resolveParticipationRecord(auctionId, storedRecord));
  const tone = STEP_TONE[step];
  const status = toneToStatus(tone, colors);

  return (
    <View
      style={[
        styles.chip,
        compact && styles.chipCompact,
        {
          backgroundColor: status.soft,
          borderColor: status.border,
        },
      ]}
    >
      <MaterialCommunityIcons name={STEP_ICON[step]} size={compact ? 11 : 13} color={status.fg} />
      <Text
        style={[
          compact ? Typography.microCaps : Typography.caption,
          { color: status.fg, flexShrink: 1 },
        ]}
        numberOfLines={1}
      >
        {t(`auction.participation.demoSteps.${step}`)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radii.full,
    borderWidth: 1,
    marginBottom: 10,
  },
  chipCompact: {
    marginBottom: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 4,
  },
});

export default ParticipationDemoChip;
