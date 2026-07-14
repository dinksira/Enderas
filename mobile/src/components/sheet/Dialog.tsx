/**
 * Dialog — centered confirmation modal built on `@gorhom/bottom-sheet`.
 *
 * Used for:
 *   - AuthSuccessModal (OTP sent / verified / password updated)
 *   - KycRequiredModal (warning when user lacks KYC)
 *   - CpoUploadModal (centered CPO upload form)
 *
 * Implementation note
 * --------------------
 * Rather than re-implement a center-screen Modal, we use a
 * `BottomSheetModal` with `enableDynamicSizing` and a single auto-sized
 * snap, wrapped in a centered container. This gives us:
 *
 *   - consistent backdrop + dismiss language across every overlay
 *   - swipe-down to dismiss (matches user expectation from sheets)
 *   - keyboard-aware behavior for any input the dialog might contain
 *   - no need to maintain a parallel "Modal" animation system
 *
 * For users who prefer the centered "dialog" feel over a slide-up
 * sheet, the body is centered vertically via `flex:1` + content max
 * width — it reads as a dialog, not a sheet.
 */
import {
  useCallback,
  useEffect,
  useRef,
  type ReactNode,
} from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  type BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/lib/appStore';
import { Radii, Spacing } from '@/theme';

export interface DialogProps {
  visible: boolean;
  onDismiss: () => void;
  /** Center card max width. Default 360. */
  maxWidth?: number;
  /** Status tone — controls the icon badge color and border accent. */
  tone?: 'default' | 'success' | 'warning' | 'danger';
  children: ReactNode;
}

export function Dialog({
  visible,
  onDismiss,
  maxWidth = 360,
  tone = 'default',
  children,
}: DialogProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const ref = useRef<BottomSheetModal>(null);
  const isVisibleRef = useRef(false);

  useEffect(() => {
    if (visible && !isVisibleRef.current) {
      isVisibleRef.current = true;
      ref.current?.present();
    } else if (!visible && isVisibleRef.current) {
      isVisibleRef.current = false;
      ref.current?.dismiss();
    }
  }, [visible]);

  const handleDismiss = useCallback(() => {
    isVisibleRef.current = false;
    onDismiss();
  }, [onDismiss]);

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.7}
        pressBehavior="close"
      />
    ),
    [],
  );

  const borderColor =
    tone === 'success'
      ? colors.success.border
      : tone === 'warning'
        ? colors.warning.border
        : tone === 'danger'
          ? colors.danger.border
          : colors.goldBorder;

  return (
    <BottomSheetModal
      ref={ref}
      snapPoints={[`100%`]}
      // Must stay OFF. This "dialog" is a full-height transparent sheet whose
      // card is centered by the `flex: 1` host below. Dynamic sizing would
      // size the sheet to its content instead — and since the host is
      // `flex: 1` (no intrinsic height), that collapses the sheet to ~0px and
      // it presents invisibly (the "no KYC feedback" bug).
      enableDynamicSizing={false}
      enablePanDownToClose
      keyboardBehavior="interactive"
      keyboardBlurBehavior="restore"
      android_keyboardInputMode="adjustResize"
      backdropComponent={renderBackdrop}
      onChange={(index) => {
        if (index < 0) handleDismiss();
      }}
      handleComponent={() => null}
      backgroundStyle={{ backgroundColor: 'transparent' }}
      style={{ flex: 1 }}
    >
      <View
        style={[
          styles.host,
          {
            paddingTop: insets.top + Spacing.xl,
            paddingBottom: insets.bottom + Spacing.xl,
          },
        ]}
        pointerEvents="box-none"
      >
        {/* Tap-outside-to-dismiss. At the 100% snap the sheet content fully
            covers gorhom's backdrop, so backdrop presses never register —
            this transparent layer behind the card restores that behavior.
            Dismiss via the ref (not `handleDismiss`) so gorhom runs its close
            animation and fires `onChange(-1)`; calling `handleDismiss` here
            would flip `isVisibleRef` early and the effect would skip the
            actual `dismiss()`. */}
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={() => ref.current?.dismiss()}
          accessibilityRole="button"
          accessibilityLabel="Close"
        />
        <View
          style={[
            styles.card,
            {
              backgroundColor: colors.baseElevated,
              borderColor,
              maxWidth,
            },
          ]}
        >
          {children}
        </View>
      </View>
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  host: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl2,
  },
  card: {
    width: '100%',
    borderRadius: Radii.floating,
    borderWidth: 1.5,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xxl,
    paddingBottom: Spacing.lg,
  },
});

export default Dialog;
