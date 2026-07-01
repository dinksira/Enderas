import { useEffect, useRef, type ReactNode } from 'react';
import { Animated, Easing, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  KeyboardAwareScrollView,
  KeyboardToolbar,
} from 'react-native-keyboard-controller';

import { useKeyboardToolbarTheme } from '@/lib/keyboardToolbarTheme';
import { BackgroundOrbs } from '@/components/shell/BackgroundOrbs';
import { useAuthStyles } from './authStyles';

/**
 * Shared auth screen shell — paints the golden glassmorphism canvas with
 * the same animated orbs + vignette used on the onboarding screens, then
 * layers a `KeyboardAwareScrollView` that smoothly scrolls only the
 * focused input into view (not the whole form) and a gold-themed
 * `KeyboardToolbar` with prev/next/done buttons.
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
  const entrance = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(entrance, {
      toValue: 1,
      duration: 250,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [entrance]);

  const entranceOpacity = entrance;
  const entranceY = entrance.interpolate({ inputRange: [0, 1], outputRange: [24, 0] });

  return (
    <View style={authStyles.safeArea}>
      <SafeAreaView style={authStyles.container} edges={['top', 'bottom']}>
        <BackgroundOrbs />
        <View style={authStyles.keyboardAvoid}>
          <KeyboardAwareScrollView
            contentContainerStyle={authStyles.scrollContent}
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
              style={{
                width: '100%',
                alignItems: 'center',
                opacity: entranceOpacity,
                transform: [{ translateY: entranceY }],
              }}
            >
              {children}
            </Animated.View>
          </KeyboardAwareScrollView>
          <KeyboardToolbar theme={toolbarTheme}>
            <KeyboardToolbar.Prev />
            <KeyboardToolbar.Next />
            <KeyboardToolbar.Done />
          </KeyboardToolbar>
        </View>
      </SafeAreaView>
    </View>
  );
}

export default AuthShell;
