import { useEffect, useMemo } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { useTheme } from '@/lib/appStore';

type OrbConfig = {
  size: number;
  top: number;
  left: number;
  duration: number;
  color: string;
};

/**
 * Soft pulsing background — three large golden radial orbs that drift and
 * breathe to give the canvas depth and warmth. Always animating.
 *
 * Theme-aware: orb tints and vignette shift between dark and light modes
 * so the glassmorphism canvas stays cohesive in either palette.
 *
 * Reanimated v3 implementation: each orb is driven by a single
 * SharedValue on the UI thread, animated via `withRepeat(withSequence(...))`
 * so the loop never bridges to JS. This keeps the background breathing
 * smoothly even when the JS thread is busy (e.g. parsing a long auction
 * list, navigating between tabs, etc.).
 */
function Orb({ config }: { config: OrbConfig }) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = 0;
    const half = withTiming(1, { duration: config.duration, easing: Easing.inOut(Easing.sin) });
    const halfBack = withTiming(0, { duration: config.duration, easing: Easing.inOut(Easing.sin) });
    progress.value = withRepeat(withSequence(half, halfBack), -1);
    return () => cancelAnimation(progress);
  }, [config.duration, progress]);

  // Translate the orb vertically by up to 30px and pulse its opacity
  // between 0.35 and 0.7, both driven by the same SharedValue so they
  // stay perfectly in phase.
  const animStyle = useAnimatedStyle(() => ({
    opacity: 0.35 + 0.35 * Math.sin(progress.value * Math.PI),
    transform: [{ translateY: 30 * progress.value }],
  }));

  return (
    <Animated.View
      style={[
        styles.orb,
        {
          width: config.size,
          height: config.size,
          top: config.top,
          left: config.left,
          backgroundColor: config.color,
        },
        animStyle,
      ]}
    />
  );
}

export function BackgroundOrbs() {
  const { colors } = useTheme();
  const { width, height } = useWindowDimensions();

  const orbs = useMemo<OrbConfig[]>(
    () => [
      { size: width * 0.9, top: -height * 0.2, left: -width * 0.3, duration: 5200, color: colors.orbColors[0] },
      { size: width * 0.7, top: height * 0.4, left: width * 0.5, duration: 6800, color: colors.orbColors[1] },
      { size: width * 0.5, top: height * 0.55, left: -width * 0.15, duration: 7600, color: colors.orbColors[2] },
    ],
    [width, height, colors.orbColors],
  );

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {orbs.map((orb, i) => (
        <Orb key={i} config={orb} />
      ))}
      {/* Vignette to anchor the canvas */}
      <LinearGradient
        colors={colors.vignette}
        locations={[0, 0.45, 1]}
        style={StyleSheet.absoluteFill}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  orb: {
    position: 'absolute',
    borderRadius: 9999,
  },
});

export default BackgroundOrbs;
