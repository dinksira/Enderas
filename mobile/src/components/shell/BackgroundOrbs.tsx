import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, useWindowDimensions, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { useTheme } from '@/lib/appStore';

/**
 * Soft pulsing background — three large golden radial orbs that drift and
 * breathe to give the canvas depth and warmth. Always animating.
 *
 * Theme-aware: orb tints and vignette shift between dark and light modes
 * so the glassmorphism canvas stays cohesive in either palette.
 */
export function BackgroundOrbs() {
  const { colors } = useTheme();
  const { width, height } = useWindowDimensions();
  const orbs = useRef([
    { x: new Animated.Value(0), size: width * 0.9, top: -height * 0.2, left: -width * 0.3, dur: 5200 },
    { x: new Animated.Value(0), size: width * 0.7, top: height * 0.4, left: width * 0.5, dur: 6800 },
    { x: new Animated.Value(0), size: width * 0.5, top: height * 0.55, left: -width * 0.15, dur: 7600 },
  ]).current;

  useEffect(() => {
    const loops = orbs.map((o) => {
      o.x.setValue(0);
      return Animated.loop(
        Animated.sequence([
          Animated.timing(o.x, {
            toValue: 1,
            duration: o.dur,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(o.x, {
            toValue: 0,
            duration: o.dur,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ]),
      );
    });
    loops.forEach((l) => l.start());
    return () => loops.forEach((l) => l.stop());
  }, [orbs]);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {orbs.map((o, i) => {
        const ty = o.x.interpolate({ inputRange: [0, 1], outputRange: [0, 30] });
        const op = o.x.interpolate({
          inputRange: [0, 0.5, 1],
          outputRange: [0.35, 0.7, 0.35],
        });
        return (
          <Animated.View
            key={i}
            style={[
              styles.orb,
              {
                width: o.size,
                height: o.size,
                top: o.top,
                left: o.left,
                opacity: op,
                transform: [{ translateY: ty }],
                backgroundColor: colors.orbColors[i],
              },
            ]}
          />
        );
      })}
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
