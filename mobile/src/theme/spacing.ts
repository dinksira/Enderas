/**
 * Spacing scale — every padding, margin, and gap in the app uses one of
 * these named values. A 4px base means tokens compose cleanly
 * (e.g. `lg = md + sm`) and the layout rhythm stays consistent.
 *
 * Usage:
 *   padding: spacing.md
 *   gap: spacing.sm
 *   marginBottom: spacing.xl
 */
export const Spacing = {
  /** 0px */
  none: 0,
  /** 2px — hairline gaps. */
  xxxs: 2,
  /** 4px — tight inline gaps. */
  xxs: 4,
  /** 6px — icon-to-text gap. */
  xxs2: 6,
  /** 8px — small gaps between related items. */
  xs: 8,
  /** 10px — medium-tight gap. */
  xs2: 10,
  /** 12px — default gap inside cards. */
  sm: 12,
  /** 14px — list item separator. */
  sm2: 14,
  /** 16px — default screen padding. */
  md: 16,
  /** 18px — section spacing. */
  md2: 18,
  /** 20px — section header spacing. */
  lg: 20,
  /** 24px — between distinct sections. */
  xl: 24,
  /** 28px — auth screen horizontal padding. */
  xl2: 28,
  /** 32px — large empty-state padding. */
  xxl: 32,
  /** 40px — top of scroll content. */
  xxxl: 40,
  /** 48px — empty-state vertical padding. */
  huge: 48,
  /** 56px — section break. */
  massive: 56,
  /** 72px — page-level vertical breath. */
  gigantic: 72,
  /** 110px — bottom padding to clear the floating tab bar. */
  tabBarClearance: 110,
} as const;
