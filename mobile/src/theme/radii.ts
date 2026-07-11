/**
 * Border radius scale. Named (not numbered) so usage reads at the call
 * site — `radii.card` is clearer than `radii.lg` when scanning a style.
 *
 * 2026 redesign
 * -------------
 *   - Slightly more generous radii across the board — modern apps lean
 *     toward softer corners (16–24px on cards, 28–32px on floating
 *     surfaces). The previous values were a bit tight; +2–4px per
 *     tier reads as more contemporary without going pill-shaped.
 *   - `floating` 28 → 32 so sheets/modals feel distinctly rounder than
 *     cards, reinforcing the elevation hierarchy.
 *   - `card` 14 → 16 so a default card reads softer against the
 *     typically hard-edged glass borders.
 */
export const Radii = {
  /** 0px */
  none: 0,
  /** 8px — small chips, status dots boxes. */
  xs: 8,
  /** 10px — icon wrappers, small buttons. */
  sm: 10,
  /** 12px — input fields, small cards. */
  input: 12,
  /** 16px — standard cards (was 14). */
  card: 16,
  /** 18px — feature cards (was 16). */
  lg: 18,
  /** 22px — auction cards (was 18). */
  xl: 22,
  /** 24px — tab pills (was 22). */
  pill: 24,
  /** 32px — floating bars, modals (was 28). */
  floating: 32,
  /** 9999px — fully rounded (circles, dots). */
  full: 9999,
} as const;

/**
 * Legacy aliases for backward compatibility with the old `GLASS_RADIUS`
 * object — kept so existing imports don't break during the refactor.
 * Prefer `Radii` directly in new code.
 */
export const GLASS_RADIUS = {
  card: Radii.lg,
  input: Radii.input,
  pill: Radii.xl,
  floating: Radii.floating,
} as const;
