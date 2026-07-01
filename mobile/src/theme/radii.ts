/**
 * Border radius scale. Named (not numbered) so usage reads at the call
 * site — `radii.card` is clearer than `radii.lg` when scanning a style.
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
  /** 14px — standard cards. */
  card: 14,
  /** 16px — feature cards. */
  lg: 16,
  /** 18px — auction cards. */
  xl: 18,
  /** 22px — tab pills. */
  pill: 22,
  /** 28px — floating bars, modals. */
  floating: 28,
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
