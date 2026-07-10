import { memo, useEffect, useRef } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { ImageGallery } from '@/components/shared/ImageGallery';
import { PressableScale } from '@/components/ui';
import { formatEtbAmount } from '@/lib/auctionUtils';
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
  onOpenDetail: () => void;
  onAutoFocusHandled?: () => void;
}

const THUMB_SIZE = 80;

function LotBidCardImpl({
  lot,
  selected,
  bidText,
  locked,
  feedback = { kind: 'hint' },
  autoFocus = false,
  onToggle,
  onBidChange,
  onOpenDetail,
  onAutoFocusHandled,
}: LotBidCardProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
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

  const reserveLabel = formatEtbAmount(lot.reservePrice);
  const inputBorderColor =
    feedback.kind === 'error'
      ? colors.danger.border
      : feedback.kind === 'valid'
        ? colors.success.border
        : colors.goldBorder;

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: selected ? colors.glassFillActive : colors.glassFill,
          borderColor: selected ? colors.goldBorderActive : colors.goldBorder,
          borderLeftColor: selected ? colors.goldBright : colors.goldBorder,
        },
      ]}
    >
      <View style={styles.topRow}>
        <PressableScale
          onPress={() => !locked && onOpenDetail()}
          disabled={locked}
          style={styles.bodyPressable}
          accessibilityRole="button"
          accessibilityLabel={t('auction.participation.viewAssetDetails', { title: lot.title })}
        >
          <ImageGallery
            imageUrls={lot.imageUrls}
            width={THUMB_SIZE}
            height={THUMB_SIZE}
            category={lot.category}
            mode="auto"
            showCounter={false}
            borderRadius={Radii.sm}
          />

          <View style={styles.copy}>
            <Text style={[Typography.bodyMedium, { color: colors.cream, fontWeight: '700' }]} numberOfLines={2}>
              {lot.title}
            </Text>
            {lot.tags?.length ? (
              <Text style={[Typography.caption, { color: colors.goldChampagne }]} numberOfLines={1}>
                {lot.tags.join(' · ')}
              </Text>
            ) : null}
            <View style={styles.metaRow}>
              <Text style={[Typography.caption, { color: colors.textMuted }]}>
                {categoryLabel}
              </Text>
              <Text style={[Typography.caption, { color: colors.textSecondary, fontWeight: '600' }]}>
                {t('auction.participation.reserve')}: {reserveLabel}
              </Text>
            </View>
          </View>
        </PressableScale>

        <PressableScale
          onPress={() => !locked && onToggle()}
          disabled={locked}
          hitSlop={10}
          style={styles.checkboxHit}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: selected }}
          accessibilityLabel={t('auction.participation.selectLotForBid', { title: lot.title })}
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
          <Pressable
            onPress={focusInput}
            disabled={locked}
            style={({ pressed }) => [
              styles.inputWrap,
              {
                borderColor: inputBorderColor,
                backgroundColor: pressed ? colors.baseElevated : colors.base,
                opacity: locked ? 0.65 : 1,
              },
            ]}
          >
            <Text style={[Typography.caption, { color: colors.textMuted, fontWeight: '600' }]}>ETB</Text>
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
              placeholder={t('auction.participation.bidPlaceholder', { reserve: reserveLabel })}
              placeholderTextColor={colors.textMuted}
              style={[styles.input, { color: colors.cream }]}
            />
            {feedback.kind === 'valid' ? (
              <MaterialCommunityIcons name="check-circle" size={18} color={colors.success.fg} />
            ) : feedback.kind === 'error' ? (
              <MaterialCommunityIcons name="alert-circle-outline" size={18} color={colors.danger.fg} />
            ) : null}
          </Pressable>
          {feedback.kind === 'error' && feedback.errorKey ? (
            <Text style={[Typography.caption, { color: colors.danger.fg }]}>
              {t(`auction.participation.bidErrors.${feedback.errorKey}`, { reserve: reserveLabel })}
            </Text>
          ) : feedback.kind === 'hint' ? (
            <Text style={[Typography.caption, { color: colors.textMuted }]}>
              {t('auction.participation.bidHint', { reserve: reserveLabel })}
            </Text>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: Spacing.sm,
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderLeftWidth: 3,
    padding: 12,
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
    gap: 10,
  },
  copy: {
    flex: 1,
    gap: 3,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 2,
  },
  checkboxHit: {
    paddingTop: 2,
    paddingLeft: 4,
  },
  checkbox: {
    width: 26,
    height: 26,
    borderRadius: 7,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bidSection: {
    marginTop: 10,
    gap: 4,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: Radii.input,
    paddingHorizontal: 12,
    minHeight: 48,
  },
  input: {
    flex: 1,
    fontSize: 17,
    fontWeight: '700',
    paddingVertical: 10,
    padding: 0,
  },
});

export const LotBidCard = memo(LotBidCardImpl);
export default LotBidCard;
