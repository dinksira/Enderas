import { type ReactNode } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';

import { useTheme } from '@/lib/appStore';
import {
  glassSurfaceStyles,
  type GlassTone,
  type GlassElevationVariant,
} from '@/lib/glassStyles';

export interface GlassSurfaceProps {
  children: ReactNode;
  padding?: number;
  active?: boolean;
  flat?: boolean;
  tone?: GlassTone;
  variant?: GlassElevationVariant;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
}

/**
 * Frosted-glass surface shared by dark and light themes.
 *
 * Light mode is a single bordered panel (no shadow shell) so Android/iOS
 * never render the muddy double-frame halo. Dark mode keeps a soft shadow
 * on an outer shell only.
 */
export function GlassSurface({
  children,
  padding,
  active,
  flat,
  tone = 'default',
  variant = 'card',
  borderRadius,
  style,
  contentStyle,
}: GlassSurfaceProps) {
  const { colors, isDark } = useTheme();
  const glass = glassSurfaceStyles(colors, isDark, {
    active,
    flat,
    tone,
    variant,
    borderRadius,
  });

  const surface = (
    <View
      style={[
        glass.surface,
        padding != null && { padding },
        contentStyle,
      ]}
    >
      <View style={glass.topHighlight} pointerEvents="none" />
      {!isDark ? <View style={glass.bottomEdge} pointerEvents="none" /> : null}
      {children}
    </View>
  );

  if (!glass.useShadowShell) {
    return <View style={[glass.shell, style]}>{surface}</View>;
  }

  return (
    <View style={[glass.shell, style]}>
      {surface}
    </View>
  );
}

export default GlassSurface;
