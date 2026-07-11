import { useCallback, useRef, type ComponentRef } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { BottomSheetTextInput } from '@gorhom/bottom-sheet';

import { GoldButton } from '@/components/auth';
import { Sheet } from '@/components/sheet';
import { formatEtbAmount } from '@/lib/auctionUtils';
import { useTheme } from '@/lib/appStore';
import { Typography, Spacing, Radii } from '@/theme';
import type { AuctionLot } from '@/types/auctionParticipation';
import type { LotBidFeedbackKind } from '@/lib/auctionParticipationUtils';

interface BidEntrySheetProps {
  visible: boolean;
  asset: AuctionLot | null;
  bidText: string;
  feedbackKind: LotBidFeedbackKind;
  feedbackErrorKey?: string;
  locked: boolean;
  position?: number;
  total?: number;
  hasNext?: boolean;
  onBidChange: (text: string) => void;
  onSave: () => void;
  onSaveAndNext?: () => void;
  onClose: () => void;
  onViewPhotos?: () => void;
}

/**
 * Bid amount entry sheet.
 *
 * Keyboard handling (SDK-57)
 * --------------------------
 * The sheet uses @gorhom/bottom-sheet's `keyboardBehavior="interactive"`,
 * which lifts the whole sheet above the keyboard. The amount input sits at
 * the top and the actions directly below, so both stay visible in the
 * lifted sheet — no extra `KeyboardStickyView` (which double-lifted the
 * buttons on top of the input). "Done" on the keyboard saves via
 * `onSubmitEditing`, and focus is deferred to the sheet's `onAnimate`.
 */
export function BidEntrySheet({
  visible,
  asset,
  bidText,
  feedbackKind,
  feedbackErrorKey,
  locked,
  position,
  total,
  hasNext = false,
  onBidChange,
  onSave,
  onSaveAndNext,
  onClose,
  onViewPhotos,
}: BidEntrySheetProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const inputRef = useRef<ComponentRef<typeof BottomSheetTextInput>>(null);
  const pendingFocusRef = useRef(false);

  const handleAnimate = useCallback((index: number) => {
    if (index >= 0 && pendingFocusRef.current) {
      pendingFocusRef.current = false;
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, []);

  if (visible && !pendingFocusRef.current) {
    pendingFocusRef.current = true;
  }

  const canSave = feedbackKind === 'valid' && !locked;

  const handleSave = useCallback(() => {
    if (feedbackKind !== 'valid' || locked) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onSave();
  }, [feedbackKind, locked, onSave]);

  const handleSaveAndNext = useCallback(() => {
    if (feedbackKind !== 'valid' || locked) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSaveAndNext?.();
  }, [feedbackKind, locked, onSaveAndNext]);

  const reserveLabel = asset ? formatEtbAmount(asset.reservePrice) : '';
  const inputBorderColor =
    feedbackKind === 'error'
      ? colors.danger.border
      : feedbackKind === 'valid'
        ? colors.success.border
        : colors.goldBorder;

  return (
    <Sheet
      visible={visible && asset != null}
      snapPoints={['85%']}
      onDismiss={onClose}
      onAnimate={handleAnimate}
      enablePanDownToClose
    >
      {asset ? (
        <View style={styles.content}>
          <View style={styles.header}>
            <View style={styles.headerCopy}>
              <Text style={[Typography.microCaps, { color: colors.goldChampagne, fontSize: 10 }]}>
                {position != null && total != null && total > 1
                  ? t('auction.participation.bidSheetProgress', { current: position, total })
                  : t('auction.participation.yourBid')}
              </Text>
              <Text style={[Typography.cardTitle, { color: colors.cream }]} numberOfLines={2}>
                {asset.title}
              </Text>
            </View>
            {onViewPhotos ? (
              <Pressable
                onPress={onViewPhotos}
                hitSlop={8}
                style={[styles.photosLink, { backgroundColor: colors.glassFill, borderColor: colors.goldBorder }]}
                accessibilityRole="button"
              >
                <MaterialCommunityIcons name="image-multiple-outline" size={14} color={colors.goldChampagne} />
                <Text style={[Typography.caption, { color: colors.goldChampagne, fontWeight: '600' }]}>
                  {t('auction.participation.bidSheetViewPhotos')}
                </Text>
              </Pressable>
            ) : null}
          </View>

          <View
            style={[
              styles.inputWrap,
              { borderColor: inputBorderColor, backgroundColor: colors.base },
            ]}
          >
            <Text style={[styles.currency, { color: colors.textMuted }]}>ETB</Text>
            <BottomSheetTextInput
              ref={inputRef}
              value={bidText}
              onChangeText={(text) => onBidChange(text.replace(/[^\d]/g, ''))}
              onSubmitEditing={handleSave}
              keyboardType="number-pad"
              editable={!locked}
              autoCorrect={false}
              autoCapitalize="none"
              returnKeyType="done"
              submitBehavior="blurAndSubmit"
              placeholder={t('auction.participation.bidPlaceholder', { reserve: reserveLabel })}
              placeholderTextColor={colors.textMuted}
              style={[styles.input, { color: colors.cream }]}
            />
            {feedbackKind === 'valid' ? (
              <MaterialCommunityIcons name="check-circle" size={22} color={colors.success.fg} />
            ) : feedbackKind === 'error' ? (
              <MaterialCommunityIcons name="alert-circle-outline" size={22} color={colors.danger.fg} />
            ) : null}
          </View>

          {feedbackKind === 'error' && feedbackErrorKey ? (
            <View style={[styles.feedbackRow, { backgroundColor: colors.danger.soft, borderColor: colors.danger.border }]}>
              <MaterialCommunityIcons name="alert-circle-outline" size={15} color={colors.danger.fg} />
              <Text style={[Typography.caption, { color: colors.danger.fg, flex: 1, lineHeight: 17 }]}>
                {t(`auction.participation.bidErrors.${feedbackErrorKey}`, { reserve: reserveLabel })}
              </Text>
            </View>
          ) : feedbackKind === 'valid' ? (
            <View style={[styles.feedbackRow, { backgroundColor: colors.success.soft, borderColor: colors.success.border }]}>
              <MaterialCommunityIcons name="check-circle-outline" size={15} color={colors.success.fg} />
              <Text style={[Typography.caption, { color: colors.success.fg, flex: 1, lineHeight: 17 }]}>
                {t('auction.participation.bidValid')}
              </Text>
            </View>
          ) : (
            <View style={styles.reserveRow}>
              <MaterialCommunityIcons name="shield-lock-outline" size={15} color={colors.goldChampagne} />
              <Text style={[Typography.caption, { color: colors.textSecondary, flex: 1, lineHeight: 17 }]}>
                {t('auction.participation.bidSheetInputHint', { reserve: reserveLabel })}
              </Text>
            </View>
          )}

          <View style={styles.actions}>
            {hasNext && onSaveAndNext ? (
              <GoldButton
                label={t('auction.participation.bidSheetSaveAndNext')}
                onPress={handleSaveAndNext}
                disabled={!canSave}
                compact
              />
            ) : null}
            <GoldButton
              label={t('auction.participation.bidSheetSave')}
              onPress={handleSave}
              disabled={!canSave}
              variant={hasNext ? 'outline' : 'primary'}
              compact
            />
          </View>

          <Text style={[Typography.caption, styles.autoSaveHint, { color: colors.textMuted }]}>
            {t('auction.participation.bidSheetAutoSaveHint')}
          </Text>
        </View>
      ) : null}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: Spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },
  headerCopy: {
    flex: 1,
    gap: 3,
  },
  photosLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radii.full,
    borderWidth: 1,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    borderWidth: 1.5,
    borderRadius: Radii.lg,
    paddingHorizontal: Spacing.md,
    minHeight: 60,
  },
  currency: {
    fontSize: 15,
    fontWeight: '700',
  },
  input: {
    flex: 1,
    fontSize: 28,
    fontWeight: '800',
    paddingVertical: 12,
    padding: 0,
    fontVariant: ['tabular-nums'],
  },
  feedbackRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    padding: Spacing.sm,
    borderRadius: Radii.input,
    borderWidth: 1,
  },
  reserveRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    paddingHorizontal: 2,
  },
  actions: {
    gap: Spacing.xs,
    paddingTop: Spacing.xxs,
  },
  autoSaveHint: {
    textAlign: 'center',
    lineHeight: 16,
    fontStyle: 'italic',
  },
});

export default BidEntrySheet;
