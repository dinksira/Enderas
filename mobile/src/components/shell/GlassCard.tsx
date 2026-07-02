import { type ReactNode, useEffect, useRef } from 'react';
import { Animated, Easing } from 'react-native';

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

  useEffect(() => {
    if (noAnimation) return;
    Animated.timing(anim, {
      toValue: 1,
      duration: 220,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [anim, noAnimation]);

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
