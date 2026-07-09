import { useCallback, useEffect, useRef, type ReactNode } from 'react';
import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import { useFocusEffect } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
  Easing,
  interpolate,
} from 'react-native-reanimated';

/**
 * `PressableScale` — a drop-in replacement for `Pressable` that adds a
 * subtle spring scale-down on press for tactile feedback.
 *
 * Why a custom component instead of `Pressable`'s `style` function:
 *   - The `style={({ pressed }) => …}` API only supports opacity / color
 *     transitions via Animated. A scale spring needs a shared value
 *     driven by reanimated, so we wrap `Animated.View` ourselves.
 *   - The animation runs on the UI thread (Reanimated 4.x + worklets),
 *     so press feedback stays smooth even when the JS thread is busy.
 *
 * Usage:
 *   <PressableScale onPress={…} style={…}>…children</PressableScale>
 *
 * Props
 *   - `scaleTo`  : pressed scale factor (default 0.96 — gentle).
 *   - `noScale`  : disable the press animation (e.g. when disabled).
 */
export interface PressableScaleProps extends Omit<PressableProps, 'style'> {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Scale factor when pressed. Default 0.96. */
  scaleTo?: number;
  /** Disable the press animation (e.g. when disabled). */
  noScale?: boolean;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function PressableScale({
  children,
  style,
  scaleTo = 0.96,
  noScale,
  disabled,
  onPressIn,
  onPressOut,
  ...rest
}: PressableScaleProps) {
  const pressed = useSharedValue(0);

  const handlePressIn: PressableProps['onPressIn'] = (e) => {
    if (!noScale && !disabled) {
      pressed.value = withSpring(1, { damping: 14, stiffness: 200, mass: 0.8 });
    }
    onPressIn?.(e);
  };

  const handlePressOut: PressableProps['onPressOut'] = (e) => {
    if (!noScale && !disabled) {
      pressed.value = withSpring(0, { damping: 14, stiffness: 200, mass: 0.8 });
    }
    onPressOut?.(e);
  };

  const animatedStyle = useAnimatedStyle(() => {
    if (noScale) return {};
    const s = interpolate(pressed.value, [0, 1], [1, scaleTo]);
    return { transform: [{ scale: s }] };
  });

  return (
    <AnimatedPressable
      style={[style, animatedStyle]}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      {...rest}
    >
      {children}
    </AnimatedPressable>
  );
}

/**
 * `ListItemEntrance` — fades + slides a child up on mount. Used for
 * staggered FlatList / grid item entrances.
 *
 * Each item animates independently based on its `index` — the parent
 * doesn't have to coordinate shared values. The stagger is capped at
 * 8 items so long lists don't drag the entrance animation.
 */
export interface ListItemEntranceProps {
  children: ReactNode;
  /** Index of this item in the list (used to stagger). */
  index?: number;
  /** Stagger per item in ms (default 40). */
  staggerMs?: number;
  style?: StyleProp<ViewStyle>;
}

export function ListItemEntrance({
  children,
  index = 0,
  staggerMs = 40,
  style,
}: ListItemEntranceProps) {
  const progress = useSharedValue(0);
  const isFirstFocus = useRef(true);

  useEffect(() => {
    // Cap the stagger so a 20-item list doesn't take 800ms to finish.
    const cappedIndex = Math.min(index, 8);
    progress.value = withDelay(
      cappedIndex * staggerMs,
      withTiming(1, { duration: 280, easing: Easing.out(Easing.cubic) }),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Tab screens freeze while inactive (e.g. during auction detail / buy-doc
  // navigation). Reanimated entrance can stall at opacity 0 while children
  // remain touchable — mirror the ScreenShell focus-recovery pattern.
  useFocusEffect(
    useCallback(() => {
      if (isFirstFocus.current) {
        isFirstFocus.current = false;
        return;
      }
      if (progress.value < 1) {
        progress.value = withTiming(1, { duration: 150, easing: Easing.out(Easing.cubic) });
      }
    }, [progress]),
  );

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: interpolate(progress.value, [0, 1], [12, 0]) }],
  }));

  return <Animated.View style={[style, animatedStyle]}>{children}</Animated.View>;
}
