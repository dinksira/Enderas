import { useCallback, useEffect, useMemo, useRef, type ComponentRef } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
  BottomSheetTextInput,
  type BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GoldButton } from '@/components/auth';
import { formatEtbAmount } from '@/lib/auctionUtils';
import { useTheme } from '@/lib/appStore';
import { GLASS_RADIUS } from '@/lib/glassStyles';
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
  const insets = useSafeAreaInsets();
  const sheetRef = useRef<BottomSheetModal>(null);
  const inputRef = useRef<ComponentRef<typeof BottomSheetTextInput>>(null);
  const pendingFocusRef = useRef(false);

  const snapPoints = useMemo(() => ['80%'], []);

  useEffect(() => {
    if (visible && asset) {
      pendingFocusRef.current = true;
      const timer = setTimeout(() => {
        sheetRef.current?.present();
      }, 100);
      return () => clearTimeout(timer);
    }

    pendingFocusRef.current = false;
    sheetRef.current?.dismiss();
  }, [visible, asset?.id]);

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.65} pressBehavior="close" />
    ),
    [],
  );

  const handleSheetChange = useCallback((index: number) => {
    if (index >= 0 && pendingFocusRef.current) {
      pendingFocusRef.current = false;
      setTimeout(() => inputRef.current?.focus(), 200);
    }
  }, []);

  const handleDismiss = useCallback(() => {
    pendingFocusRef.current = false;
    onClose();
  }, [onClose]);

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
  const canSave = feedbackKind === 'valid' && !locked;
  const inputBorderColor =
    feedbackKind === 'error'
      ? colors.danger.border
      : feedbackKind === 'valid'
        ? colors.success.border
        : colors.goldBorder;

  return (
    <BottomSheetModal
      ref={sheetRef}
      snapPoints={snapPoints}
      enablePanDownToClose
      keyboardBehavior="interactive"
      keyboardBlurBehavior="restore"
      android_keyboardInputMode="adjustResize"
      backdropComponent={renderBackdrop}
      onChange={handleSheetChange}
      onDismiss={handleDismiss}
      handleIndicatorStyle={{ backgroundColor: colors.divider, width: 36 }}
      backgroundStyle={{
        backgroundColor: colors.baseElevated,
        borderTopLeftRadius: GLASS_RADIUS.floating,
        borderTopRightRadius: GLASS_RADIUS.floating,
        borderWidth: 1.5,
        borderColor: colors.goldBorder,
        borderBottomWidth: 0,
      }}
    >
      {asset ? (
      <BottomSheetScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom, Spacing.md) + Spacing.sm },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.stepBanner}>
          <MaterialCommunityIcons name="numeric-2-circle" size={18} color={colors.goldChampagne} />
          <Text style={[Typography.caption, { color: colors.goldChampagne, fontWeight: '700', flex: 1 }]}>
            {t('auction.participation.bidSheetStepLabel')}
          </Text>
          {position != null && total != null && total > 1 ? (
            <View style={[styles.progressBadge, { backgroundColor: colors.glassFill, borderColor: colors.goldBorder }]}>
              <Text style={[Typography.caption, { color: colors.goldChampagne, fontWeight: '700', fontSize: 11 }]}>
                {t('auction.participation.bidSheetProgress', { current: position, total })}
              </Text>
            </View>
          ) : null}
        </View>

        <View style={styles.titleRow}>
          <Text style={[Typography.cardTitle, { color: colors.cream, flex: 1 }]} numberOfLines={2}>
            {asset.title}
          </Text>
          <Pressable
            onPress={() => sheetRef.current?.dismiss()}
            hitSlop={12}
            style={[styles.closeBtn, { backgroundColor: colors.glassFill, borderColor: colors.goldBorder }]}
            accessibilityRole="button"
            accessibilityLabel={t('common.close')}
          >
            <MaterialCommunityIcons name="close" size={18} color={colors.textMuted} />
          </Pressable>
        </View>

        <View style={[styles.reserveCard, { backgroundColor: colors.glassFill, borderColor: colors.goldBorder }]}>
          <View style={styles.reserveHeader}>
            <MaterialCommunityIcons name="shield-lock-outline" size={16} color={colors.goldChampagne} />
            <Text style={[Typography.caption, { color: colors.cream, fontWeight: '700' }]}>
              {t('auction.participation.bidSheetReserveTitle')}
            </Text>
          </View>
          <Text style={[styles.reserveAmount, { color: colors.goldBright }]}>{reserveLabel}</Text>
          <Text style={[Typography.caption, { color: colors.textSecondary, lineHeight: 17 }]}>
            {t('auction.participation.bidSheetReserveExplain')}
          </Text>
          {onViewPhotos ? (
            <Pressable onPress={onViewPhotos} hitSlop={8} style={styles.photosLink}>
              <MaterialCommunityIcons name="image-outline" size={14} color={colors.goldChampagne} />
              <Text style={[Typography.caption, { color: colors.goldChampagne, fontWeight: '600' }]}>
                {t('auction.participation.bidSheetViewPhotos')}
              </Text>
            </Pressable>
          ) : null}
        </View>

        <View style={styles.inputSection}>
          <Text style={[Typography.microCaps, { color: colors.goldChampagne, fontSize: 10 }]}>
            {t('auction.participation.yourBid')}
          </Text>
          <View
            style={[
              styles.inputWrap,
              {
                borderColor: inputBorderColor,
                backgroundColor: colors.base,
              },
            ]}
          >
            <Text style={[styles.currency, { color: colors.textMuted }]}>ETB</Text>
            <BottomSheetTextInput
              ref={inputRef}
              value={bidText}
              onChangeText={(text) => onBidChange(text.replace(/[^\d]/g, ''))}
              keyboardType="number-pad"
              editable={!locked}
              autoCorrect={false}
              autoCapitalize="none"
              returnKeyType="done"
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
              <MaterialCommunityIcons name="alert-circle-outline" size={16} color={colors.danger.fg} />
              <Text style={[Typography.caption, { color: colors.danger.fg, flex: 1, lineHeight: 17 }]}>
                {t(`auction.participation.bidErrors.${feedbackErrorKey}`, { reserve: reserveLabel })}
              </Text>
            </View>
          ) : feedbackKind === 'valid' ? (
            <View style={[styles.feedbackRow, { backgroundColor: colors.success.soft, borderColor: colors.success.border }]}>
              <MaterialCommunityIcons name="check-circle-outline" size={16} color={colors.success.fg} />
              <Text style={[Typography.caption, { color: colors.success.fg, flex: 1, lineHeight: 17 }]}>
                {t('auction.participation.bidValid')}
              </Text>
            </View>
          ) : (
            <Text style={[Typography.caption, { color: colors.textMuted, lineHeight: 17 }]}>
              {t('auction.participation.bidSheetInputHint', { reserve: reserveLabel })}
            </Text>
          )}

          <Text style={[Typography.caption, { color: colors.textMuted, lineHeight: 16, fontStyle: 'italic' }]}>
            {t('auction.participation.bidSheetAutoSaveHint')}
          </Text>
        </View>

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
      </BottomSheetScrollView>
      ) : null}
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.xs,
    gap: Spacing.sm,
  },
  stepBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  progressBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radii.full,
    borderWidth: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reserveCard: {
    borderRadius: Radii.lg,
    borderWidth: 1,
    padding: Spacing.sm2,
    gap: Spacing.xs,
  },
  reserveHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  reserveAmount: {
    fontSize: 22,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  photosLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  inputSection: {
    gap: Spacing.xs,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    borderWidth: 1.5,
    borderRadius: Radii.lg,
    paddingHorizontal: Spacing.md,
    minHeight: 58,
  },
  currency: {
    fontSize: 15,
    fontWeight: '700',
  },
  input: {
    flex: 1,
    fontSize: 26,
    fontWeight: '800',
    paddingVertical: 10,
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
  actions: {
    gap: Spacing.xs,
    paddingTop: Spacing.xs,
  },
});

export default BidEntrySheet;
