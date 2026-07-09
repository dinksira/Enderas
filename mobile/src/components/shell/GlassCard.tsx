import { type ReactNode, useCallback, useEffect, useRef } from 'react';
import { Animated, Easing } from 'react-native';
import { useFocusEffect } from 'expo-router';

import { GlassSurface, type GlassSurfaceProps } from './GlassSurface';

type GlassCardProps = Omit<GlassSurfaceProps, 'children'> & {
  children: ReactNode;
  /** Disable the entrance animation (e.g. inside FlatLists). */
  noAnimation?: boolean;
};

/**
 * Animated glass card — wraps `GlassSurface` with a short fade/slide-in.
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
  const anim = useRef(new Animated.Value(noAnimation ? 1 : 0)).current;
  const isFirstFocus = useRef(true);

  useEffect(() => {
    if (noAnimation) return;
    Animated.timing(anim, {
      toValue: 1,
      duration: 220,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [anim, noAnimation]);

  // Parent screens freeze while a child route is open. A mount-only fade can
  // stall at opacity 0 and leave card content invisible but still tappable.
  useFocusEffect(
    useCallback(() => {
      if (noAnimation) return;
      if (isFirstFocus.current) {
        isFirstFocus.current = false;
        return;
      }
      anim.stopAnimation((value) => {
        if (value < 1) {
          Animated.timing(anim, {
            toValue: 1,
            duration: 150,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }).start();
        }
      });
    }, [anim, noAnimation]),
  );

  return (
    <Animated.View
      style={{
        opacity: anim,
        transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) }],
      }}
    >
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
