/**
 * Backwards-compat re-export. The canonical theme system now lives in
 * `@/theme` (split into colors / typography / spacing / radii / shadows /
 * motion / categoryColors). This file re-exports the color tokens so
 * existing imports (`@/lib/theme`) keep working while we migrate call
 * sites. New code should import from `@/theme` directly.
 *
 * TODO: remove this file once every consumer imports from `@/theme`.
 */
export {
  type ThemeMode,
  type ThemePreference,
  type ThemeColors,
  type StatusPalette,
  resolveThemeMode,
  THEMES,
  DARK_THEME,
  LIGHT_THEME,
} from '@/theme/colors';
