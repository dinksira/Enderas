import { Platform, type ViewStyle } from 'react-native';

/**
 * Elevation / shadow system. Each variant is a complete platform-aware
 * style (iOS shadow props + Android elevation) tuned for the glass
 * material language.
 *
 * Why dark-mode-only:
 *   On light backgrounds, a colored shadow reads as a muddy halo. Light
 *   mode uses hairline borders + top/bottom edge strips for depth
 *   instead — see `glassSurfaceStyles` in `glassStyles.ts`.
 *
 * Variants
 * --------
 *   - card       : standard glass card
 *   - cardActive : card with focused/active state (gold glow)
 *   - header     : top AppHeader (lighter, shorter throw)
 *   - floating   : tab bar, modals (heaviest, longest throw)
 */
export type ElevationVariant = 'card' | 'cardActive' | 'header' | 'floating';

const DARK_ELEVATION: Record<ElevationVariant, ViewStyle> = {
  card: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOpacity: 0.20,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 3 },
    },
    android: { elevation: 3 },
  }) ?? {},
  cardActive: Platform.select({
    ios: {
      shadowColor: '#D4A017',
      shadowOpacity: 0.26,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 2 },
    },
    android: { elevation: 5 },
  }) ?? {},
  header: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOpacity: 0.16,
      shadowRadius: 6,
      shadowOffset: { width: 0, height: 2 },
    },
    android: { elevation: 2 },
  }) ?? {},
  floating: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOpacity: 0.24,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 5 },
    },
    android: { elevation: 6 },
  }) ?? {},
};

/**
 * Returns the elevation style for the given variant. Returns `{}` in
 * light mode — light surfaces use borders, not shadows.
 */
export function elevation(
  isDark: boolean,
  variant: ElevationVariant = 'card',
): ViewStyle {
  if (!isDark) return {};
  return DARK_ELEVATION[variant];
}
