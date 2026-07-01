import { type ReactNode, useCallback, useMemo, useRef } from 'react';
import { Animated, Easing, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import {
  KeyboardAwareScrollView,
  KeyboardToolbar,
} from 'react-native-keyboard-controller';

import { useTheme } from '@/lib/appStore';
import { useKeyboardToolbarTheme } from '@/lib/keyboardToolbarTheme';
import { Spacing, Typography } from '@/theme';
import { AppHeader } from './AppHeader';

interface ScreenShellProps {
  title: string;
  /** Dynamic page title shown below the header (e.g. item name on detail screens). */
  pageTitle?: string;
  eyebrow?: string;
  showBack?: boolean;
  onBack?: () => void;
  hideActions?: boolean;
  children: ReactNode;
  /** Bottom padding — defaults to ~100 to clear the floating tab bar. */
  bottomPadding?: number;
  /** Disable the content fade-in (e.g. when the parent already animates). */
  noFade?: boolean;
  /**
   * Scroll focused inputs into view when the keyboard opens.
   * Use on form-heavy screens (KYC, asset submission, etc.).
   */
  keyboardAware?: boolean;
  /** Show prev/next/done arrows above the keyboard (implies keyboardAware). */
  keyboardToolbar?: boolean;
  /** Show prev/next on the keyboard toolbar. When false, only Done is shown. */
  keyboardToolbarArrows?: boolean;
  /** Extra space between the focused field and the keyboard edge. */
  keyboardBottomOffset?: number;
  /** Pull-to-refresh state for scrollable shell screens. */
  refreshing?: boolean;
  onRefresh?: () => void | Promise<void>;
}

/**
 * Screen shell for every tab + sub screen.
 *
 * - Renders the fixed `AppHeader` at the top.
 * - Wraps the body in a scroll view whose background is transparent so
 *   the shared `BackgroundOrbs` layer (rendered once at the tabs layout
 *   level) shows through and persists during route transitions.
 * - Optional `keyboardAware` mode uses `KeyboardAwareScrollView` so
 *   focused inputs stay visible above the keyboard.
 * - Bottom padding reserves space for the floating tab bar.
 * - Content fades in on mount (180ms) to avoid the snap-in feel.
 */
export function ScreenShell({
  children,
  pageTitle,
  bottomPadding = 100,
  noFade,
  keyboardAware = false,
  keyboardToolbar = false,
  keyboardToolbarArrows = true,
  keyboardBottomOffset = 12,
  refreshing = false,
  onRefresh,
  ...header
}: ScreenShellProps) {
  const { colors } = useTheme();
  const toolbarTheme = useKeyboardToolbarTheme();
  const fade = useRef(new Animated.Value(noFade ? 1 : 0)).current;
  const useKeyboard = keyboardAware || keyboardToolbar;

  const refreshControl = useMemo(
    () =>
      onRefresh ? (
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={colors.goldBright}
          colors={[colors.goldBright]}
          progressBackgroundColor={colors.baseElevated}
        />
      ) : undefined,
    [colors.baseElevated, colors.goldBright, onRefresh, refreshing],
  );

  // Re-run on every focus: tab screens are frozen while inactive, which can
  // interrupt the native-driver fade and leave content stuck at opacity 0.
  useFocusEffect(
    useCallback(() => {
      if (noFade) return;
      fade.setValue(0);
      const animation = Animated.timing(fade, {
        toValue: 1,
        duration: 220,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      });
      animation.start();
      return () => animation.stop();
    }, [fade, noFade]),
  );

  // Subtle 6px slide-up paired with the fade for a softer entrance.
  const content = (
    <Animated.View
      style={{
        opacity: fade,
        transform: [{ translateY: fade.interpolate({ inputRange: [0, 1], outputRange: [6, 0] }) }],
      }}
    >
      {pageTitle ? (
        <Text style={[Typography.h1, styles.pageTitle, { color: colors.cream }]}>{pageTitle}</Text>
      ) : null}
      {children}
    </Animated.View>
  );
  const contentContainerStyle = {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: bottomPadding,
  };

  return (
    <View style={[styles.host, { backgroundColor: colors.base }]}>
      <AppHeader {...header} />
      {useKeyboard ? (
        <View style={styles.keyboardHost}>
          <KeyboardAwareScrollView
            style={styles.scroll}
            contentContainerStyle={contentContainerStyle}
            showsVerticalScrollIndicator={false}
            bounces
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="interactive"
            bottomOffset={keyboardBottomOffset}
            extraKeyboardSpace={keyboardToolbar ? 44 : 0}
            mode="insets"
            refreshControl={refreshControl}
          >
            {content}
          </KeyboardAwareScrollView>
          {keyboardToolbar ? (
            <KeyboardToolbar theme={toolbarTheme}>
              {keyboardToolbarArrows ? <KeyboardToolbar.Prev /> : null}
              {keyboardToolbarArrows ? <KeyboardToolbar.Next /> : null}
              <KeyboardToolbar.Done />
            </KeyboardToolbar>
          ) : null}
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={contentContainerStyle}
          showsVerticalScrollIndicator={false}
          bounces
          keyboardShouldPersistTaps="handled"
          refreshControl={refreshControl}
        >
          {content}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  pageTitle: {
    marginBottom: Spacing.sm2,
    letterSpacing: 0.2,
  },
  host: {
    flex: 1,
  },
  keyboardHost: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
});

export default ScreenShell;
