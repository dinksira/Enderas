import type { ThemeColors } from '@/theme/colors';

/**
 * UI tones that map to theme status colors. Used by auction/bid/asset
 * cards to color their status chips and dots consistently.
 *
 * Each tone resolves to a `StatusPalette` from the active theme, so the
 * contrast is correct in both light and dark mode without per-card hex.
 */
export type UiTone = 'live' | 'ending' | 'won' | 'lost' | 'pending';

/**
 * Map a UI tone to the matching semantic status palette on the active
 * theme. The returned object exposes `fg` (icon/text color), `soft`
 * (translucent chip fill), and `border` (chip border).
 *
 *   live     → success (auction is active, bids are open)
 *   ending   → warning (auction ending soon)
 *   won      → success (user won the auction)
 *   lost     → danger  (user lost / auction closed without winning)
 *   pending  → info    (suspended or pending state)
 */
export function toneToStatus(
  tone: UiTone,
  colors: ThemeColors,
): { fg: string; soft: string; border: string } {
  switch (tone) {
    case 'live':
    case 'won':
      return colors.success;
    case 'ending':
      return colors.warning;
    case 'lost':
      return colors.danger;
    case 'pending':
    default:
      return colors.info;
  }
}
