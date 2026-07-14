import { type ReactNode, useCallback, useEffect, useRef } from 'react';
import { useFocusEffect } from 'expo-router';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { Duration } from '@/theme/motion';
import { GlassSurface, type GlassSurfaceProps } from './GlassSurface';

type GlassCardProps = Omit<GlassSurfaceProps, 'children'> & {
  children: ReactNode;
  /** Disable the entrance animation (e.g. inside FlatLists). */
  noAnimation?: boolean;
};

/**
 * Animated glass card — wraps `GlassSurface` with a short fade/slide-in.
 *
 * 2026 redesign: entrance is 200ms with a 6px slide-up (was 220ms / 10px)
 * for a snappier, subtler entrance.
 *
 * Reanimated v3 implementation: the entrance runs on the UI thread so
 * long lists of cards (dashboard, bids) don't hop the JS thread for
 * every card's fade-in.
 */
export function GlassCard({
  children,
  padding = 16,
  active,
  flat,
  tone,
  variant,
  borderRadius,
  style,
  contentStyle,
  noAnimation,
}: GlassCardProps) {
  const progress = useSharedValue(noAnimation ? 1 : 0);
  const isFirstFocus = useRef(true);

  useEffect(() => {
    if (noAnimation) return;
    progress.value = withTiming(1, {
      duration: Duration.fast,
      easing: Easing.out(Easing.cubic),
    });
  }, [progress, noAnimation]);

  // Parent screens freeze while a child route is open. A mount-only fade can
  // stall at opacity 0 and leave card content invisible but still tappable.
  useFocusEffect(
    useCallback(() => {
      if (noAnimation) return;
      if (isFirstFocus.current) {
        isFirstFocus.current = false;
        return;
      }
      // On refocus, restart the fade from the current value (in case it
      // stalled mid-animation while the screen was frozen).
      cancelAnimation(progress);
      progress.value = withTiming(1, {
        duration: Duration.micro,
        easing: Easing.out(Easing.cubic),
      });
    }, [progress, noAnimation]),
  );

  const animStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: 6 * (1 - progress.value) }],
  }));

  return (
    <Animated.View style={animStyle}>
      <GlassSurface
        padding={padding}
        active={active}
        flat={flat}
        tone={tone}
        variant={variant}
        borderRadius={borderRadius}
        style={style}
        contentStyle={contentStyle}
      >
        {children}
      </GlassSurface>
    </Animated.View>
  );
}

export default GlassCard;
