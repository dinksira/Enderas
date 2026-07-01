import { type ViewStyle } from 'react-native';

import type { ThemeColors } from '@/theme/colors';
import { elevation as elevationToken, type ElevationVariant } from '@/theme/shadows';
import { Radii } from '@/theme/radii';

/**
 * Glass surface style builders. These wrap the lower-level `elevation`
 * token from `@/theme/shadows` with the glassmorphism recipe used
 * across the app:
 *
 *   Light mode: one layer — warm near-opaque fill + hairline border +
 *               top/bottom edge highlights (frosted panel, no shadow halo).
 *   Dark mode : shadow on an outer shell + border + translucent gold fill.
 *
 * `glassElevation` and `GLASS_RADIUS` are kept as named exports for
 * backwards compatibility — new code should import `elevation` from
 * `@/theme/shadows` and `Radii` from `@/theme/radii` directly.
 */

export type GlassElevationVariant = ElevationVariant;

/**
 * @deprecated Use `elevation` from `@/theme/shadows` directly.
 * Kept for backwards compatibility with existing call sites.
 */
export const GLASS_RADIUS = {
  card: Radii.lg,
  input: Radii.input,
  pill: Radii.xl,
  floating: Radii.floating,
} as const;

/**
 * @deprecated Use `elevation` from `@/theme/shadows` directly.
 */
export function glassElevation(
  isDark: boolean,
  variant: GlassElevationVariant = 'card',
): ViewStyle {
  return elevationToken(isDark, variant);
}

export type GlassTone = 'default' | 'danger';

export interface GlassSurfaceOptions {
  active?: boolean;
  flat?: boolean;
  tone?: GlassTone;
  variant?: GlassElevationVariant;
  borderRadius?: number;
}

/**
 * Build the style set for a glass surface. Returns four pieces so the
 * caller can compose them in the right structure (shell / surface /
 * top highlight / bottom edge) rather than collapsing into one style.
 */
export function glassSurfaceStyles(
  colors: ThemeColors,
  isDark: boolean,
  {
    active,
    flat,
    tone = 'default',
    variant = 'card',
    borderRadius = Radii.lg,
  }: GlassSurfaceOptions = {},
): {
  shell: ViewStyle;
  surface: ViewStyle;
  topHighlight: ViewStyle;
  bottomEdge: ViewStyle;
  useShadowShell: boolean;
} {
  const elevationVariant: GlassElevationVariant = active ? 'cardActive' : variant;
  const useShadowShell = isDark && !flat;

  const fill =
    tone === 'danger'
      ? colors.danger.soft
      : active
        ? colors.glassFillActive
        : colors.glassFill;

  const borderColor =
    tone === 'danger'
      ? colors.danger.border
      : active
        ? colors.goldBorderActive
        : colors.goldBorder;

  const surface: ViewStyle = {
    borderRadius,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: fill,
    borderColor,
  };

  return {
    useShadowShell,
    shell: useShadowShell
      ? { borderRadius, ...elevationToken(isDark, elevationVariant) }
      : { borderRadius },
    surface,
    topHighlight: {
      position: 'absolute',
      top: 0,
      left: 12,
      right: 12,
      height: 1,
      backgroundColor: colors.glassTopHighlight,
      zIndex: 1,
    },
    bottomEdge: {
      position: 'absolute',
      bottom: 0,
      left: 12,
      right: 12,
      height: 1,
      backgroundColor: colors.glassBottomEdge,
      zIndex: 1,
    },
  };
}
