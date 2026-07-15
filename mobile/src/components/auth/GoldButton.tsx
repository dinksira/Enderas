import { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

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
 *
 * Reanimated v3 implementation: the shimmer loop and press-feedback
 * spring both run on the UI thread, so the JS thread stays free for
 * form handling, navigation, etc.
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
  const scale = useSharedValue(1);
  const shimmer = useSharedValue(0);

  useEffect(() => {
    shimmer.value = 0;
    shimmer.value = withRepeat(
      withTiming(1, { duration: 2400, easing: Easing.linear }),
      -1,
    );
    return () => cancelAnimation(shimmer);
  }, [shimmer]);

  const shimmerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: -120 + 480 * shimmer.value }, { skewX: '-20deg' }],
  }));

  const scaleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const onPressIn = () => {
    scale.value = withSpring(0.96, { damping: 8, stiffness: 200 });
  };

  const onPressOut = () => {
    scale.value = withSpring(1, { damping: 6, stiffness: 240 });
  };

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
      <Animated.View style={[{ width: '100%' }, scaleStyle]}>
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
                style={[StyleSheet.absoluteFill, styles.gradientLayer]}
              />
              <View style={[authStyles.topHighlight, styles.gradientLayer]} />
              <Animated.View
                style={[
                  authStyles.shimmerOverlay,
                  styles.gradientLayer,
                  shimmerStyle,
                ]}
                pointerEvents="none"
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
  gradientLayer: {
    zIndex: 0,
  },
});

export default GoldButton;
