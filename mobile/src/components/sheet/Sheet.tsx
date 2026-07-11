/**
 * Sheet — the single shared bottom-sheet primitive for the app, built on
 * `@gorhom/bottom-sheet`'s `BottomSheetModal`.
 *
 * Why one primitive
 * ------------------
 * Before the SDK-57 redesign, the app shipped four hand-rolled bottom
 * sheets (`CpoReadinessSheet`, `AuctionAssetDetailModal`, plus the
 * timer-hacky `BidEntrySheet`) and four RN `Modal`-based dialogs
 * (`AuthSuccessModal`, `KycRequiredModal`, `CpoUploadModal`, plus an
 * inline language picker in `settings.tsx`). Every one of them
 * reimplemented its own Animated entrance (scale or translateY with
 * varying 180/220/280ms timings), its own backdrop, its own safe-area
 * handling, and its own keyboard avoidance. Behavior was inconsistent
 * and the bid sheet used `setTimeout(100)` to present + `setTimeout(200)`
 * to focus the input — fragile.
 *
 * `Sheet` consolidates all of that onto `BottomSheetModal`:
 *   - consistent gold-themed backdrop (press-to-close)
 *   - consistent handle + background styling
 *   - consistent snap-point strategy (one or two snaps, last is "open")
 *   - keyboard-aware by default (`interactive` behavior on iOS, `adjustResize` on Android)
 *   - `onAnimate` callback fires exactly when the sheet reaches a snap
 *     point — used to replace the timer-based "wait then focus" pattern
 *     in the bid sheet.
 *
 * Two flavors
 * -----------
 *   - <Sheet>             : BottomSheetModal — for everything that slides up.
 *   - <SheetDropdown>     : A header-anchored dropdown variant for filters
 *                           and pickers (NotificationBell, LanguageSelector,
 *                           CategoryFilter). Uses the same backdrop + motion
 *                           language so the app feels coherent.
 *
 * Both are controlled by a single `visible` prop, so call sites don't
 * have to manage refs to `present()`/`dismiss()` themselves.
 */
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  type ReactNode,
} from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetView,
  type BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { useTheme } from '@/lib/appStore';
import { Radii, Spacing } from '@/theme';

export interface SheetProps {
  /** Controls visibility. When true, the sheet presents; when false, it dismisses. */
  visible: boolean;
  /** Snap points as % strings. Defaults to a single 70% snap. */
  snapPoints?: string[];
  /** Called when the sheet is dismissed (backdrop tap, swipe-down, or `visible=false`). */
  onDismiss: () => void;
  /** Fired the moment the sheet reaches a snap point — use to focus inputs. */
  onAnimate?: (index: number) => void;
  /** Allow swipe-down to dismiss. Defaults to true. */
  enablePanDownToClose?: boolean;
  /** Children — rendered inside a scrollable BottomSheetView by default. */
  children: ReactNode;
  /** When true, children render in a non-scrollable BottomSheetView. */
  static?: boolean;
  /** Hide the drag handle. Default false. */
  hideHandle?: boolean;
  /** Add a close (X) button in the top-right of the sheet header area. */
  showCloseButton?: boolean;
  /** Container padding for the body. Default = Spacing.md. */
  contentPadding?: number;
  /**
   * Size the sheet to its content instead of a fixed snap point. Ideal for
   * compact, single-purpose forms (e.g. the bid entry sheet) — the sheet
   * grows/shrinks with its content and lifts cleanly above the keyboard
   * with `keyboardBehavior="interactive"`. When true, `snapPoints` is
   * ignored and children render inside a content-measured `BottomSheetView`.
   */
  dynamicSizing?: boolean;
}

export function Sheet({
  visible,
  snapPoints,
  onDismiss,
  onAnimate,
  enablePanDownToClose = true,
  children,
  static: isStatic = false,
  hideHandle = false,
  showCloseButton = false,
  contentPadding = Spacing.md,
  dynamicSizing = false,
}: SheetProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const sheetRef = useRef<BottomSheetModal>(null);
  const isVisibleRef = useRef(false);

  const snaps = useMemo(() => (snapPoints?.length ? snapPoints : ['70%']), [snapPoints]);

  // Drive present/dismiss off the `visible` prop. `isVisibleRef` guards
  // against double-present / double-dismiss when the parent re-renders.
  useEffect(() => {
    if (visible && !isVisibleRef.current) {
      isVisibleRef.current = true;
      // `animateOnMount` would be cleaner but BottomSheetModal requires
      // the ref to be mounted first; presenting via ref is the
      // documented imperative pattern.
      sheetRef.current?.present();
    } else if (!visible && isVisibleRef.current) {
      isVisibleRef.current = false;
      sheetRef.current?.dismiss();
    }
  }, [visible]);

  const handleAnimate = useCallback(
    (fromIndex: number, toIndex: number) => {
      if (toIndex >= 0) onAnimate?.(toIndex);
    },
    [onAnimate],
  );

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
        opacity={0.65}
        pressBehavior="close"
      />
    ),
    [],
  );

  const bodyPadding = {
    paddingTop: hideHandle ? Spacing.sm : Spacing.xs,
    paddingHorizontal: contentPadding,
    paddingBottom: Math.max(insets.bottom, Spacing.md) + Spacing.xs,
  };

  const closeButton = showCloseButton ? (
    <Pressable
      onPress={() => sheetRef.current?.dismiss()}
      hitSlop={12}
      accessibilityRole="button"
      accessibilityLabel="Close"
      style={[
        styles.closeButton,
        { backgroundColor: colors.glassFill, borderColor: colors.goldBorder },
      ]}
    >
      <Animated.Text style={{ color: colors.textMuted, fontSize: 16, lineHeight: 18 }}>
        ×
      </Animated.Text>
    </Pressable>
  ) : null;

  return (
    <BottomSheetModal
      ref={sheetRef}
      snapPoints={dynamicSizing ? undefined : snaps}
      enablePanDownToClose={enablePanDownToClose}
      enableDynamicSizing={dynamicSizing}
      keyboardBehavior="interactive"
      keyboardBlurBehavior="restore"
      android_keyboardInputMode="adjustResize"
      backdropComponent={renderBackdrop}
      onChange={(index) => {
        if (index < 0) {
          handleDismiss();
        }
      }}
      onAnimate={handleAnimate}
      handleComponent={hideHandle ? () => null : undefined}
      handleIndicatorStyle={{
        backgroundColor: colors.divider,
        width: 36,
        height: 4,
        borderRadius: 2,
      }}
      backgroundStyle={{
        backgroundColor: colors.baseElevated,
        borderTopLeftRadius: Radii.floating,
        borderTopRightRadius: Radii.floating,
        borderWidth: 1.5,
        borderColor: colors.goldBorder,
        borderBottomWidth: 0,
      }}
    >
      {dynamicSizing ? (
        <BottomSheetView style={bodyPadding}>
          {closeButton}
          {children}
        </BottomSheetView>
      ) : (
        <View style={[styles.body, bodyPadding]}>
          {closeButton}
          {children}
        </View>
      )}
    </BottomSheetModal>
  );
}

/**
 * Header-anchored dropdown variant for filters / pickers. Slides in
 * from the top-right corner with the same backdrop language as `Sheet`.
 *
 * Used by:
 *   - NotificationBell
 *   - LanguageSelector
 *   - CategoryFilter
 *
 * Keeping these as dropdowns (rather than full sheets) preserves the
 * anchor-to-trigger affordance the user expects from a header button —
 * the panel "belongs" to the button that opened it.
 */
export interface SheetDropdownProps {
  visible: boolean;
  onDismiss: () => void;
  /** Top padding (from top of screen). Defaults to safe-area-top + 60. */
  topInset?: number;
  /** Right padding for the panel. Default 16. */
  rightInset?: number;
  /** Max width of the panel. Default 340. */
  maxWidth?: number;
  children: ReactNode;
}

export function SheetDropdown({
  visible,
  onDismiss,
  topInset,
  rightInset = 16,
  maxWidth = 340,
  children,
}: SheetDropdownProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const animatedVisible = useSharedValue(0);

  useEffect(() => {
    animatedVisible.value = withTiming(visible ? 1 : 0, {
      duration: 200,
      easing: Easing.out(Easing.cubic),
    });
  }, [visible, animatedVisible]);

  const panelStyle = useAnimatedStyle(() => ({
    opacity: animatedVisible.value,
    transform: [
      { translateY: (1 - animatedVisible.value) * -8 },
      { scale: 0.96 + animatedVisible.value * 0.04 },
    ],
  }));

  const top = topInset ?? insets.top + 60;

  if (!visible) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <Pressable
        style={[StyleSheet.absoluteFill, { backgroundColor: colors.scrim }]}
        onPress={onDismiss}
        accessibilityRole="button"
      />
      <Animated.View
        style={[
          styles.dropdown,
          {
            backgroundColor: colors.baseElevated,
            borderColor: colors.goldBorder,
            top,
            right: rightInset,
            maxWidth,
          },
          panelStyle,
        ]}
      >
        {children}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  body: {
    flex: 1,
  },
  closeButton: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.md,
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  dropdown: {
    position: 'absolute',
    borderRadius: Radii.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
});

export default Sheet;
