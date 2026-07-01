import { useEffect } from 'react';
import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
  interpolate,
} from 'react-native-reanimated';

import { useTheme } from '@/lib/appStore';

/**
 * `Skeleton` — a shimmering placeholder used by loading states.
 *
 * Renders a rounded rectangle with a subtle gold-tinted shimmer that
 * sweeps horizontally. The shimmer uses Reanimated 4.x on the UI
 * thread so it stays smooth even when the JS thread is busy.
 *
 * Usage:
 *   <Skeleton style={{ width: '100%', height: 16 }} />
 *   <Skeleton style={{ width: 80, height: 80, borderRadius: 40 }} />
 */
export interface SkeletonProps {
  style?: StyleProp<ViewStyle>;
  /** Override the shimmer speed (ms per sweep). Default 1200. */
  durationMs?: number;
}

export function Skeleton({ style, durationMs = 1200 }: SkeletonProps) {
  const { colors } = useTheme();
  const shimmer = useSharedValue(0);

  useEffect(() => {
    // Loop 0 → 1 indefinitely. withRepeat reverses direction for a
    // natural sweep-back-and-forth motion.
    shimmer.value = withRepeat(
      withTiming(1, { duration: durationMs, easing: Easing.inOut(Easing.sin) }),
      -1,
      true,
    );
  }, [durationMs, shimmer]);

  // The shimmer overlay shifts left-to-right across the skeleton.
  const overlayStyle = useAnimatedStyle(() => {
    const translateX = interpolate(shimmer.value, [0, 1], [-100, 100]);
    return { transform: [{ translateX: `${translateX}%` }] };
  });

  return (
    <Animated.View
      style={[
        styles.base,
        { backgroundColor: colors.glassFill, borderColor: colors.goldBorder },
        style,
      ]}
    >
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          overlayStyle,
          { backgroundColor: colors.glassFillActive },
        ]}
        pointerEvents="none"
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 8,
    borderWidth: 1,
    overflow: 'hidden',
  },
});

export default Skeleton;
