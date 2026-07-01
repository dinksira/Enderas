import { useEffect, useMemo, useRef } from 'react';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withDelay,
  withSpring,
  Easing,
} from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@/lib/appStore';
import { splashConfig } from './splashConfig';

/**
 * Branded animated splash — hammer strike + name reveal.
 *
 * Lifecycle
 * ---------
 * 1. The native splash is held visible by `app/_layout.tsx` until fonts
 *    and the persisted theme are ready (see the theme-flicker fix).
 * 2. Once ready, the native splash is hidden and THIS screen mounts on
 *    a blank themed canvas — the navigator is NOT mounted yet so the
 *    choreography can run without route-loading contention.
 * 3. When choreography finishes, `onChoreographyComplete` mounts the
 *    navigator. The splash stays at full opacity until the parent
 *    sets `dismiss` (navigator has laid out), then the exit fade plays.
 *
 * Why all shared values (not Animated from RN)
 * --------------------------------------------
 * Reanimated 4.x runs animations on the UI thread when paired with
 * `react-native-worklets` (already a dep). That keeps the choreography
 * smooth even if the JS thread is busy mounting the navigator underneath.
 *
 * Theme awareness
 * ---------------
 * Every color is read from `useTheme().colors` — no hardcoded hex. The
 * splash reads correctly in both light and dark mode.
 */
interface SplashScreenProps {
  /** Called once the choreography has finished — parent should mount routes. */
  onChoreographyComplete?: () => void;
  /** When true, the exit fade begins (parent sets this once routes are ready). */
  dismiss?: boolean;
  /** Called after the exit fade completes — safe to remove the splash overlay. */
  onFinish?: () => void;
}

const SplashScreen = ({ onChoreographyComplete, dismiss = false, onFinish }: SplashScreenProps) => {
  const onChoreographyCompleteRef = useRef(onChoreographyComplete);
  const onFinishRef = useRef(onFinish);
  const exitStartedRef = useRef(false);
  onChoreographyCompleteRef.current = onChoreographyComplete;
  onFinishRef.current = onFinish;
  const { colors, isDark } = useTheme();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();

  // ── Style sheet (rebuilt only when theme/dimensions change) ────────
  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: colors.base,
          justifyContent: 'center',
          alignItems: 'center',
          overflow: 'hidden',
        },
        bgGradientOrb: {
          position: 'absolute',
          width: screenWidth * 1.4,
          height: screenWidth * 1.4,
          borderRadius: screenWidth * 0.7,
          backgroundColor: colors.goldDeep,
          opacity: isDark ? 0.06 : 0.08,
          top: screenHeight * 0.15,
          left: -screenWidth * 0.2,
        },
        topCircle: {
          position: 'absolute',
          width: 350,
          height: 350,
          borderRadius: 175,
          top: -160,
          right: -100,
          opacity: isDark ? 0.03 : 0.05,
          backgroundColor: colors.gold,
        },
        bottomCircle: {
          position: 'absolute',
          width: 280,
          height: 280,
          borderRadius: 140,
          bottom: -120,
          left: -90,
          opacity: isDark ? 0.03 : 0.05,
          backgroundColor: colors.gold,
        },
        cornerAccent: {
          position: 'absolute',
          width: 120,
          height: 120,
          borderTopWidth: 1,
          borderRightWidth: 1,
          borderColor: colors.goldBorder,
          top: 50,
          right: 30,
        },
        bottomLine: {
          position: 'absolute',
          bottom: 60,
          width: screenWidth * 0.25,
          height: 1,
          backgroundColor: colors.divider,
        },
        poweredBy: {
          position: 'absolute',
          bottom: 82,
          fontSize: 10,
          color: colors.textMuted,
          letterSpacing: 1.5,
        },
        contentContainer: {
          width: screenWidth,
          height: 120,
          justifyContent: 'center',
          alignItems: 'center',
          position: 'relative',
        },
        textSection: {
          position: 'absolute',
          justifyContent: 'center',
          alignItems: 'flex-end',
          width: 220,
        },
        title: {
          fontSize: 38,
          fontWeight: '800',
          color: colors.cream,
          letterSpacing: 2,
          textShadowColor: isDark ? colors.goldGlow : 'transparent',
          textShadowOffset: { width: 0, height: 2 },
          textShadowRadius: isDark ? 16 : 0,
        },
        subtitle: {
          fontSize: 12,
          color: colors.textSecondary,
          marginTop: 6,
          letterSpacing: 4.5,
          textTransform: 'uppercase' as const,
          fontWeight: '600',
        },
        hammerSection: {
          position: 'absolute',
          justifyContent: 'center',
          alignItems: 'center',
          width: 80,
          height: 80,
        },
        hammerIconWrapper: {
          justifyContent: 'center',
          alignItems: 'center',
          width: 70,
          height: 70,
          zIndex: 3,
        },
        hammerGlow: {
          position: 'absolute',
          width: 90,
          height: 90,
          borderRadius: 45,
          backgroundColor: colors.goldGlow,
          zIndex: 1,
        },
        strikeFlash: {
          position: 'absolute',
          width: 100,
          height: 100,
          borderRadius: 50,
          backgroundColor: isDark
            ? 'rgba(245, 208, 107, 0.25)'
            : 'rgba(212, 160, 23, 0.18)',
          zIndex: 1,
        },
        ripple: {
          position: 'absolute',
          width: 50,
          height: 50,
          borderRadius: 25,
          borderWidth: 1.5,
          borderColor: colors.gold,
          zIndex: 2,
        },
        particle: {
          position: 'absolute',
          justifyContent: 'center',
          alignItems: 'center',
        },
        sparkle: {
          width: 6,
          height: 6,
          borderRadius: 3,
          backgroundColor: colors.goldBright,
          shadowColor: colors.goldBright,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: isDark ? 0.8 : 0.45,
          shadowRadius: 5,
        },
        sparkleSmall: { width: 4, height: 4, borderRadius: 2 },
        sparkleTiny: { width: 3, height: 3, borderRadius: 1.5 },
      }),
    [colors, isDark, screenHeight, screenWidth],
  );

  // ─── Phase 1: Hammer drop ───
  const hammerTranslateY = useSharedValue(-150);
  const hammerOpacity = useSharedValue(0);
  const glowOpacity = useSharedValue(0);
  const glowScale = useSharedValue(0.4);

  // ─── Phase 2: Hammer strike & dynamic tilt ───
  const hammerRotation = useSharedValue(45);
  const rippleScale = useSharedValue(0);
  const rippleOpacity = useSharedValue(0);
  const shakeX = useSharedValue(0);
  const strikeFlashOpacity = useSharedValue(0);

  // ─── Phase 3 & 4: Symmetrical split reveal ───
  const hammerTranslateX = useSharedValue(0);
  const nameTranslateX = useSharedValue(-100);
  const nameOpacity = useSharedValue(0);
  const taglineTranslateY = useSharedValue(20);
  const taglineOpacity = useSharedValue(0);

  // ─── Particles ───
  const particle1Scale = useSharedValue(0);
  const particle1Opacity = useSharedValue(0);
  const particle2Scale = useSharedValue(0);
  const particle2Opacity = useSharedValue(0);
  const particle3Scale = useSharedValue(0);
  const particle3Opacity = useSharedValue(0);

  // ─── Exit ───
  const exitOpacity = useSharedValue(1);
  const exitScale = useSharedValue(1);

  useEffect(() => {
    // NOTE: The native splash is hidden by `app/_layout.tsx` (deferred
    // one frame after the custom splash mounts) — no need to call
    // `hideAsync` here. Removing the duplicate call avoids a race
    // where the native splash could hide before the custom splash's
    // first paint, causing a brief blank frame.
    //
    // This effect intentionally runs once on mount. Callbacks are read
    // from refs so parent re-renders (e.g. when the navigator mounts
    // underneath during exit) never restart the choreography mid-flight.

    const timeouts: ReturnType<typeof setTimeout>[] = [];
    const schedule = (fn: () => void, ms: number) => {
      const id = setTimeout(fn, ms);
      timeouts.push(id);
      return id;
    };

    // Phase 1: Hammer drops in (spring).
    hammerOpacity.value = withTiming(1, { duration: 200 });
    hammerTranslateY.value = withSpring(0, {
      damping: 14,
      stiffness: 100,
      mass: 1.2,
    });

    // Glow expands behind the hammer.
    glowOpacity.value = withDelay(120, withTiming(1, { duration: 300 }));
    glowScale.value = withDelay(120, withSpring(1, { damping: 12, stiffness: 90 }));

    const strikeDelay = splashConfig.phaseHammerDrop;

    // Phase 2: Hammer tilts through strike (rotate sequence).
    hammerRotation.value = withDelay(
      strikeDelay,
      withSequence(
        withTiming(-25, { duration: 140, easing: Easing.in(Easing.quad) }),
        withTiming(5, { duration: 90 }),
        withTiming(-12, { duration: 110 }),
      ),
    );

    const impactDelay = strikeDelay + 140;

    // Strike flash — quick bright pulse.
    strikeFlashOpacity.value = withDelay(
      impactDelay,
      withSequence(withTiming(0.7, { duration: 40 }), withTiming(0, { duration: 280 })),
    );

    // Ripple — expanding ring.
    rippleOpacity.value = withDelay(
      impactDelay,
      withSequence(withTiming(0.9, { duration: 40 }), withTiming(0, { duration: 600 })),
    );
    rippleScale.value = withDelay(
      impactDelay,
      withSequence(
        withTiming(1, { duration: 40 }),
        withTiming(4.0, { duration: 600, easing: Easing.out(Easing.cubic) }),
      ),
    );

    // Shake — subtle horizontal jitter on impact.
    shakeX.value = withDelay(
      impactDelay,
      withSequence(
        withTiming(-8, { duration: 25 }),
        withTiming(8, { duration: 25 }),
        withTiming(-5, { duration: 25 }),
        withTiming(5, { duration: 25 }),
        withTiming(-2, { duration: 25 }),
        withTiming(0, { duration: 25 }),
      ),
    );

    // Particles — three sparkles bursting from the impact.
    particle1Scale.value = withDelay(impactDelay, withSpring(1, { damping: 5, stiffness: 70 }));
    particle1Opacity.value = withDelay(
      impactDelay,
      withSequence(withTiming(1, { duration: 180 }), withTiming(0, { duration: 800 })),
    );
    particle2Scale.value = withDelay(impactDelay + 60, withSpring(1, { damping: 5, stiffness: 70 }));
    particle2Opacity.value = withDelay(
      impactDelay + 60,
      withSequence(withTiming(1, { duration: 180 }), withTiming(0, { duration: 800 })),
    );
    particle3Scale.value = withDelay(impactDelay + 120, withSpring(1, { damping: 5, stiffness: 70 }));
    particle3Opacity.value = withDelay(
      impactDelay + 120,
      withSequence(withTiming(1, { duration: 180 }), withTiming(0, { duration: 800 })),
    );

    // Phase 3: Hammer slides right, name slides in from left.
    const revealDelay = impactDelay + 300;
    hammerTranslateX.value = withDelay(
      revealDelay,
      withSpring(120, { damping: 16, stiffness: 80, mass: 1 }),
    );
    nameTranslateX.value = withDelay(
      revealDelay,
      withSpring(-50, { damping: 16, stiffness: 80, mass: 1 }),
    );
    nameOpacity.value = withDelay(
      revealDelay,
      withTiming(1, { duration: 400, easing: Easing.out(Easing.ease) }),
    );

    // Phase 4: Tagline fades up.
    taglineTranslateY.value = withDelay(revealDelay + 150, withSpring(0, { damping: 14, stiffness: 90 }));
    taglineOpacity.value = withDelay(revealDelay + 150, withTiming(1, { duration: 400 }));

    // Choreography complete — ask the parent to mount routes. The splash
    // stays at full opacity until the parent sets `dismiss`.
    schedule(() => {
      onChoreographyCompleteRef.current?.();
    }, splashConfig.choreographyRuntime);

    return () => {
      timeouts.forEach(clearTimeout);
    };
  }, []);

  // Exit fade — only after the parent confirms routes are ready (`dismiss`).
  useEffect(() => {
    if (!dismiss || exitStartedRef.current) return;
    exitStartedRef.current = true;

    exitOpacity.value = withTiming(0, {
      duration: splashConfig.exitDuration,
      easing: Easing.out(Easing.quad),
    });
    exitScale.value = withTiming(0.95, {
      duration: splashConfig.exitDuration,
      easing: Easing.out(Easing.quad),
    });

    const id = setTimeout(() => {
      onFinishRef.current?.();
    }, splashConfig.exitDuration);

    return () => clearTimeout(id);
  }, [dismiss, exitOpacity, exitScale]);

  // ── Animated styles ────────────────────────────────────────────────
  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeX.value }],
  }));

  const hammerStyle = useAnimatedStyle(() => ({
    opacity: hammerOpacity.value,
    transform: [
      { translateX: hammerTranslateX.value },
      { translateY: hammerTranslateY.value },
      { rotate: `${hammerRotation.value}deg` },
    ],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
    transform: [{ scale: glowScale.value }],
  }));

  const rippleStyle = useAnimatedStyle(() => ({
    opacity: rippleOpacity.value,
    transform: [{ scale: rippleScale.value }],
  }));

  const strikeFlashStyle = useAnimatedStyle(() => ({
    opacity: strikeFlashOpacity.value,
  }));

  const nameStyle = useAnimatedStyle(() => ({
    opacity: nameOpacity.value,
    transform: [{ translateX: nameTranslateX.value }],
  }));

  const taglineStyle = useAnimatedStyle(() => ({
    opacity: taglineOpacity.value,
    transform: [{ translateY: taglineTranslateY.value }],
  }));

  const particle1Style = useAnimatedStyle(() => ({
    opacity: particle1Opacity.value,
    transform: [{ scale: particle1Scale.value }, { translateX: -35 }, { translateY: -40 }],
  }));
  const particle2Style = useAnimatedStyle(() => ({
    opacity: particle2Opacity.value,
    transform: [{ scale: particle2Scale.value }, { translateX: 45 }, { translateY: -20 }],
  }));
  const particle3Style = useAnimatedStyle(() => ({
    opacity: particle3Opacity.value,
    transform: [{ scale: particle3Scale.value }, { translateX: -15 }, { translateY: 35 }],
  }));

  const exitStyle = useAnimatedStyle(() => ({
    opacity: exitOpacity.value,
    transform: [{ scale: exitScale.value }],
  }));

  return (
    <Animated.View style={[styles.container, exitStyle]}>
      <View style={styles.bgGradientOrb} />
      <View style={styles.topCircle} />
      <View style={styles.bottomCircle} />
      <View style={styles.cornerAccent} />

      <Animated.View style={[styles.contentContainer, containerStyle]}>
        <Animated.View style={[styles.textSection, nameStyle]}>
          <Animated.Text style={styles.title}>{splashConfig.appName}</Animated.Text>
          <Animated.View style={taglineStyle}>
            <Animated.Text style={styles.subtitle}>{splashConfig.tagline}</Animated.Text>
          </Animated.View>
        </Animated.View>

        <Animated.View style={[styles.hammerSection, hammerStyle]}>
          <Animated.View style={[styles.hammerGlow, glowStyle]} />
          <Animated.View style={[styles.strikeFlash, strikeFlashStyle]} />
          <Animated.View style={[styles.ripple, rippleStyle]} />
          <View style={styles.hammerIconWrapper}>
            <MaterialCommunityIcons name="gavel" size={56} color={colors.goldBright} />
          </View>
        </Animated.View>

        <Animated.View style={[styles.particle, particle1Style]}>
          <View style={styles.sparkle} />
        </Animated.View>
        <Animated.View style={[styles.particle, particle2Style]}>
          <View style={[styles.sparkle, styles.sparkleSmall]} />
        </Animated.View>
        <Animated.View style={[styles.particle, particle3Style]}>
          <View style={[styles.sparkle, styles.sparkleTiny]} />
        </Animated.View>
      </Animated.View>

      <Text style={styles.poweredBy}>Powered By Mager Software PLC.</Text>
      <View style={styles.bottomLine} />
    </Animated.View>
  );
};

export default SplashScreen;
