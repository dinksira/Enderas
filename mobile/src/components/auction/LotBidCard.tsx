import { useEffect, useRef } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Image } from 'expo-image';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { GlassCard } from '@/components/shell/GlassCard';
import { PressableScale } from '@/components/ui';
import { formatEtbAmount, getCategoryTheme } from '@/lib/auctionUtils';
import { useTheme } from '@/lib/appStore';
import { Typography, Spacing, Radii } from '@/theme';
import type { AuctionLot } from '@/types/auctionParticipation';
import type { LotBidFeedbackKind } from '@/lib/auctionParticipationUtils';

interface LotBidFeedback {
  kind: LotBidFeedbackKind;
  errorKey?: string;
}

interface LotBidCardProps {
  lot: AuctionLot;
  selected: boolean;
  bidText: string;
  locked: boolean;
  feedback?: LotBidFeedback;
  autoFocus?: boolean;
  onToggle: () => void;
  onBidChange: (text: string) => void;
  onAutoFocusHandled?: () => void;
}

export function LotBidCard({
  lot,
  selected,
  bidText,
  locked,
  feedback = { kind: 'hint' },
  autoFocus = false,
  onToggle,
  onBidChange,
  onAutoFocusHandled,
}: LotBidCardProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const theme = getCategoryTheme(lot.category);
  const thumbnailUri = lot.imageUrls[0];
  const categoryLabel = t(`dashboard.categories.${lot.category}`, { defaultValue: lot.category });
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (!autoFocus || !selected || locked) return;
    const timer = setTimeout(() => {
      inputRef.current?.focus();
      onAutoFocusHandled?.();
    }, 120);
    return () => clearTimeout(timer);
  }, [autoFocus, locked, onAutoFocusHandled, selected]);

  const handleBidTextChange = (text: string) => {
    onBidChange(text.replace(/[^\d]/g, ''));
  };

  const focusInput = () => {
    if (locked) return;
    inputRef.current?.focus();
  };

  const handleBodyPress = () => {
    if (locked) return;
    if (!selected) {
      onToggle();
      return;
    }
    focusInput();
  };

  const handleCheckboxPress = () => {
    if (locked) return;
    onToggle();
  };

  const reserveLabel = formatEtbAmount(lot.reservePrice);
  const inputBorderColor =
    feedback.kind === 'error'
      ? colors.danger.border
      : feedback.kind === 'valid'
        ? colors.success.border
        : colors.goldBorder;

  return (
    <GlassCard
      padding={14}
      active={selected}
      style={styles.card}
      noAnimation
    >
      <View style={styles.topRow}>
        <PressableScale
          onPress={handleBodyPress}
          disabled={locked}
          style={styles.bodyPressable}
        >
          <View style={styles.thumb}>
            {thumbnailUri ? (
              <Image source={{ uri: thumbnailUri }} style={StyleSheet.absoluteFill} contentFit="cover" />
            ) : (
              <LinearGradient colors={theme.colors} style={StyleSheet.absoluteFill} />
            )}
            {!thumbnailUri ? (
              <MaterialCommunityIcons name={theme.icon} size={22} color="rgba(255,250,240,0.45)" />
            ) : null}
          </View>

          <View style={styles.copy}>
            <Text style={[Typography.microCaps, { color: colors.goldChampagne }]}>{lot.lotLabel}</Text>
            <Text style={[Typography.cardTitle, { color: colors.cream }]} numberOfLines={2}>
              {lot.title}
            </Text>
            <Text style={[Typography.caption, { color: colors.textMuted }]} numberOfLines={2}>
              {lot.description}
            </Text>
            <Text style={[Typography.caption, { color: colors.textSecondary, marginTop: 4 }]}>
              {categoryLabel} · {t('auction.participation.reserve')}: {formatEtbAmount(lot.reservePrice)}
            </Text>
          </View>
        </PressableScale>

        <PressableScale
          onPress={handleCheckboxPress}
          disabled={locked}
          hitSlop={10}
          style={styles.checkboxHit}
        >
          <View
            style={[
              styles.checkbox,
              {
                borderColor: selected ? colors.goldBright : colors.goldBorder,
                backgroundColor: selected ? colors.goldBright : 'transparent',
              },
            ]}
          >
            {selected ? (
              <MaterialCommunityIcons name="check" size={14} color={colors.textOnGold} />
            ) : null}
          </View>
        </PressableScale>
      </View>

      {selected ? (
        <View style={styles.bidSection}>
          <Text style={[Typography.microCaps, { color: colors.goldChampagne }]}>
            {t('auction.participation.yourBid')}
          </Text>
          <Pressable
            onPress={focusInput}
            disabled={locked}
            style={({ pressed }) => [
              styles.inputWrap,
              {
                borderColor: inputBorderColor,
                backgroundColor: pressed ? colors.glassFillActive : colors.glassFill,
                opacity: locked ? 0.65 : 1,
              },
            ]}
          >
            <Text style={[Typography.bodyMedium, { color: colors.textMuted }]}>ETB</Text>
            <TextInput
              ref={inputRef}
              value={bidText}
              onChangeText={handleBidTextChange}
              keyboardType="number-pad"
              editable={!locked}
              showSoftInputOnFocus
              autoCorrect={false}
              autoCapitalize="none"
              returnKeyType="done"
              placeholder={t('auction.participation.bidPlaceholder', {
                reserve: reserveLabel,
              })}
              placeholderTextColor={colors.textMuted}
              style={[styles.input, { color: colors.cream }]}
            />
            {feedback.kind === 'valid' ? (
              <MaterialCommunityIcons name="check-circle" size={20} color={colors.success.fg} />
            ) : null}
          </Pressable>
          {feedback.kind === 'error' && feedback.errorKey ? (
            <View style={styles.feedbackRow}>
              <MaterialCommunityIcons name="alert-circle-outline" size={14} color={colors.danger.fg} />
              <Text style={[Typography.caption, styles.feedbackText, { color: colors.danger.fg }]}>
                {t(`auction.participation.bidErrors.${feedback.errorKey}`, {
                  reserve: reserveLabel,
                })}
              </Text>
            </View>
          ) : null}
          {feedback.kind === 'valid' ? (
            <View style={styles.feedbackRow}>
              <MaterialCommunityIcons name="check-circle-outline" size={14} color={colors.success.fg} />
              <Text style={[Typography.caption, styles.feedbackText, { color: colors.success.fg }]}>
                {t('auction.participation.bidValid')}
              </Text>
            </View>
          ) : null}
          {feedback.kind === 'hint' ? (
            <Text style={[Typography.caption, { color: colors.textMuted }]}>
              {t('auction.participation.bidHint', { reserve: reserveLabel })}
            </Text>
          ) : null}
        </View>
      ) : null}
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: Spacing.sm,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  bodyPressable: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  thumb: {
    width: 72,
    height: 72,
    borderRadius: Radii.input,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: {
    flex: 1,
    gap: 2,
  },
  checkboxHit: {
    paddingTop: 2,
    paddingLeft: 4,
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bidSection: {
    marginTop: 12,
    gap: 6,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: Radii.input,
    paddingHorizontal: 14,
    minHeight: 52,
  },
  input: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    paddingVertical: 12,
    padding: 0,
  },
  feedbackRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
  },
  feedbackText: {
    flex: 1,
  },
});

export default LotBidCard;
