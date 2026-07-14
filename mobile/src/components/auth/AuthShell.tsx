import { useEffect, type ReactNode } from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  KeyboardAwareScrollView,
  KeyboardToolbar,
} from 'react-native-keyboard-controller';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { useKeyboardToolbarTheme } from '@/lib/keyboardToolbarTheme';
import { Duration } from '@/theme/motion';
import { BackgroundOrbs } from '@/components/shell/BackgroundOrbs';
import { useAuthStyles } from './authStyles';

/**
 * Shared auth screen shell — paints the golden glassmorphism canvas with
 * the same animated orbs + vignette used on the onboarding screens, then
 * layers a `KeyboardAwareScrollView` that smoothly scrolls only the
 * focused input into view (not the whole form) and a gold-themed
 * `KeyboardToolbar` with prev/next/done buttons.
 *
 * 2026 redesign
 * -------------
 *   - Entrance is 200ms (was 250ms) — snappier.
 *   - Slide-up is 16px (was 24) — subtler, more refined.
 *
 * Reanimated v3: entrance runs on the UI thread so first-paint isn't
 * blocked by the auth form's mount.
 */
export function AuthShell({
  children,
  keyboardAware = true,
}: {
  children: ReactNode;
  keyboardAware?: boolean;
}) {
  const authStyles = useAuthStyles();
  const toolbarTheme = useKeyboardToolbarTheme();
  const entrance = useSharedValue(0);

  useEffect(() => {
    entrance.value = withTiming(1, {
      duration: Duration.fast,
      easing: Easing.out(Easing.cubic),
    });
  }, [entrance]);

  const entranceStyle = useAnimatedStyle(() => ({
    opacity: entrance.value,
    transform: [{ translateY: 16 * (1 - entrance.value) }],
  }));

  return (
    <View style={authStyles.safeArea}>
      <SafeAreaView style={authStyles.container} edges={['top', 'bottom']}>
        <BackgroundOrbs />
        <View style={authStyles.keyboardAvoid}>
          <KeyboardAwareScrollView
            contentContainerStyle={
              keyboardAware
                ? authStyles.scrollContent
                : [authStyles.scrollContent, authStyles.scrollContentTop]
            }
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="interactive"
            bounces={false}
            alwaysBounceVertical={false}
            contentInsetAdjustmentBehavior="never"
            bottomOffset={12}
            mode="insets"
            enabled={keyboardAware}
            scrollEnabled={keyboardAware}
          >
            <Animated.View
              style={[{ width: '100%', alignItems: 'center' }, entranceStyle]}
            >
              {children}
            </Animated.View>
          </KeyboardAwareScrollView>
          {keyboardAware ? (
            <KeyboardToolbar theme={toolbarTheme}>
              <KeyboardToolbar.Prev />
              <KeyboardToolbar.Next />
              <KeyboardToolbar.Done />
            </KeyboardToolbar>
          ) : null}
        </View>
      </SafeAreaView>
    </View>
  );
}

export default AuthShell;
