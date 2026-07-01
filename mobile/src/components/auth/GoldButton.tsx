import { useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { useTheme } from '@/lib/appStore';
import { useAuthStyles } from './authStyles';

type GoldButtonVariant = 'primary' | 'outline';

/**
 * Golden shimmering CTA button with gradient fill, sliding shimmer, and
 * spring-based press feedback.
 *
 * Variants:
 *   - 'primary' : full gold gradient fill (shimmer + glow)
 *   - 'outline' : transparent with gold border
 *
 * The gradient stops are pulled from the active theme's gold scale so
 * the button matches the rest of the UI in both light and dark mode.
 */
export function GoldButton({
  label,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  /** Remove bottom margin — use inside button rows or tight stacks. */
  compact = false,
}: {
  label: string;
  onPress: () => void;
  variant?: GoldButtonVariant;
  loading?: boolean;
  disabled?: boolean;
  compact?: boolean;
}) {
  const authStyles = useAuthStyles();
  const { colors } = useTheme();
  const scale = useRef(new Animated.Value(1)).current;
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(shimmer, {
        toValue: 1,
        duration: 2400,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [shimmer]);

  const shimmerTx = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: [-120, 360],
  });

  const onPressIn = () =>
    Animated.spring(scale, {
      toValue: 0.96,
      friction: 8,
      tension: 100,
      useNativeDriver: true,
    }).start();

  const onPressOut = () =>
    Animated.spring(scale, {
      toValue: 1,
      friction: 6,
      tension: 120,
      useNativeDriver: true,
    }).start();

  const isFilled = variant === 'primary';
  const isDisabled = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      disabled={isDisabled}
      style={{ width: '100%', alignSelf: 'stretch', opacity: isDisabled ? 0.55 : 1 }}
    >
      <Animated.View style={{ transform: [{ scale }], width: '100%' }}>
        <View
          style={[
            authStyles.submitButton,
            !isFilled && authStyles.submitButtonOutline,
            compact && styles.compactButton,
          ]}
        >
          {isFilled ? (
            <>
              <LinearGradient
                colors={[colors.goldDeep, colors.goldBright, colors.gold, colors.goldDeep]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={StyleSheet.absoluteFill}
              />
              <View style={authStyles.topHighlight} />
              <Animated.View
                style={[
                  authStyles.shimmerOverlay,
                  { transform: [{ translateX: shimmerTx }, { skewX: '-20deg' }] },
                ]}
              />
            </>
          ) : null}
          <View style={authStyles.submitButtonInner}>
            <Text
              style={[authStyles.submitButtonText, !isFilled && authStyles.submitButtonTextOutline]}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.75}
            >
              {loading ? '...' : label}
            </Text>
          </View>
        </View>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  compactButton: {
    marginBottom: 0,
  },
});

export default GoldButton;
