/**
 * Typography tokens — font families, size scale, weights, line heights,
 * and letter spacing. Centralized so every Text element uses a named
 * token instead of a magic number.
 *
 * Font loading
 * ------------
 * Fonts are loaded in `app/_layout.tsx` via `useFonts` from `expo-font`.
 * Until that resolves, the splash screen is held visible — no font fallback
 * flash. The families used here must match the loaders in `_layout.tsx`.
 *
 * Why three families
 * ------------------
 *   - Space Grotesk  → display/headings (geometric, distinctive)
 *   - Inter          → body, UI text (high x-height, screen-optimized)
 *   - JetBrains Mono → numeric/monospace tabs (stats, amounts, codes)
 * Each role is named so a future rebrand swaps one family without
 * touching every Text element.
 *
 * 2026 redesign
 * -------------
 *   - Slightly tighter letter-spacing on display sizes (0.4 → 0.2)
 *     so large headings read as a single shape, not as letterforms.
 *   - Tighter line-heights on captions and body small so dense
 *     auction lists pack more vertically without feeling cramped.
 *   - Larger display / hero sizes (30 → 32, 38 → 40) — a 2026 app
 *     leans more on confident hierarchy.
 *   - Introduced `sectionTitle` between `cardTitle` and `h1` so
 *     mid-level headings don't have to overload `cardTitle`.
 */

export const FontFamilies = {
  /** Headings / display. */
  display: 'SpaceGrotesk_600SemiBold',
  displayBold: 'SpaceGrotesk_700Bold',
  /** Body / UI. */
  body: 'Inter_400Regular',
  bodyMedium: 'Inter_500Medium',
  bodySemibold: 'Inter_600SemiBold',
  bodyBold: 'Inter_700Bold',
  /** Numeric / monospace. */
  mono: 'JetBrainsMono_400Regular',
  monoBold: 'JetBrainsMono_700Bold',
} as const;

/**
 * Size scale (px). 1.25× ratio around a 14px base — small enough to fit
 * dense auction cards, large enough to clear AA on small phones.
 */
export const FontSize = {
  /** 10px — eyebrow caps, status chips. */
  micro: 10,
  /** 11px — uppercase result labels, meta caps. */
  xs: 11,
  /** 12px — captions, hints, secondary chip text. */
  sm: 12,
  /** 13px — descriptions, secondary body. */
  bodySm: 13,
  /** 14px — primary body text, default. */
  body: 14,
  /** 15px — input text, primary body on dark surfaces. */
  bodyLg: 15,
  /** 16px — card titles. */
  md: 16,
  /** 17px — header titles. */
  lg: 17,
  /** 19px — stat values. */
  xl: 19,
  /** 22px — section headings. */
  xxl: 22,
  /** 32px — auth screen titles (was 30). */
  display: 32,
  /** 40px — splash brand name (was 38). */
  hero: 40,
} as const;

/** Named weights matching the loaded font variants. */
export const FontWeight = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  extrabold: '700',
  black: '900',
} as const;

/** Line heights paired to font sizes — keeps body copy readable. */
export const LineHeight = {
  tight: 16,
  body: 20,
  bodyLg: 22,
  heading: 26,
  display: 34,
} as const;

/** Letter spacing scale. Negative tightens large display; positive opens caps. */
export const LetterSpacing = {
  tight: -0.3,
  none: 0,
  subtle: 0.2,
  small: 0.4,
  medium: 0.6,
  large: 1.5,
  xl: 2,
} as const;

/**
 * Pre-assembled text style presets. Components can spread these into a
 * `Text` style array and only override color, keeping typography
 * consistent across the app.
 *
 * Example:
 *   <Text style={[typography.body, { color: colors.cream }]}>…</Text>
 */
export const Typography = {
  /** Hero brand text — splash only. */
  hero: {
    fontFamily: FontFamilies.displayBold,
    fontSize: FontSize.hero,
    fontWeight: FontWeight.extrabold,
    letterSpacing: 1.6,
    lineHeight: LineHeight.display,
  },
  /** Display heading — auth screen titles. */
  display: {
    fontFamily: FontFamilies.displayBold,
    fontSize: FontSize.display,
    fontWeight: FontWeight.bold,
    letterSpacing: 0.2,
    lineHeight: LineHeight.display,
  },
  /** Section heading. */
  h1: {
    fontFamily: FontFamilies.display,
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.semibold,
    letterSpacing: 0.2,
    lineHeight: LineHeight.heading,
  },
  /** Mid-level section title — between cardTitle and h1. */
  sectionTitle: {
    fontFamily: FontFamilies.display,
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    letterSpacing: 0.2,
    lineHeight: 22,
  },
  /** Header title — AppHeader center. */
  headerTitle: {
    fontFamily: FontFamilies.display,
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    letterSpacing: 0.2,
  },
  /** Card title. */
  cardTitle: {
    fontFamily: FontFamilies.display,
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    letterSpacing: 0.1,
    lineHeight: LineHeight.bodyLg,
  },
  /** Body text — default. */
  body: {
    fontFamily: FontFamilies.body,
    fontSize: FontSize.body,
    fontWeight: FontWeight.regular,
    lineHeight: LineHeight.body,
  },
  /** Body medium — primary copy on dark surfaces. */
  bodyMedium: {
    fontFamily: FontFamilies.bodyMedium,
    fontSize: FontSize.bodyLg,
    fontWeight: FontWeight.medium,
    lineHeight: LineHeight.body,
  },
  /** Body small — secondary descriptions. */
  bodySmall: {
    fontFamily: FontFamilies.body,
    fontSize: FontSize.bodySm,
    fontWeight: FontWeight.medium,
    lineHeight: 18,
  },
  /** Caption — hints, meta. */
  caption: {
    fontFamily: FontFamilies.body,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    lineHeight: 17,
  },
  /** Eyebrow caps — section labels above titles. */
  eyebrow: {
    fontFamily: FontFamilies.bodyBold,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.extrabold,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  /** Micro caps — status chips, result counts. */
  microCaps: {
    fontFamily: FontFamilies.bodyBold,
    fontSize: FontSize.micro,
    fontWeight: FontWeight.extrabold,
    letterSpacing: 1.1,
    textTransform: 'uppercase',
  },
  /** Stat value — numeric, mono. */
  statValue: {
    fontFamily: FontFamilies.bodyBold,
    fontSize: FontSize.xl,
    fontWeight: FontWeight.extrabold,
    letterSpacing: 0.2,
  },
  /** Button label — uppercase, wide. */
  button: {
    fontFamily: FontFamilies.bodyBold,
    fontSize: FontSize.bodySm,
    fontWeight: FontWeight.extrabold,
    letterSpacing: 1.8,
    textTransform: 'uppercase',
  },
} as const;
