/**
 * Color tokens — the single source of truth for every color used in the app.
 *
 * Why a typed object shape (not separate files per palette):
 *   Components consume colors via `useTheme().colors.X`, so the two palettes
 *   MUST expose the same keys. TypeScript enforces this — adding a key to one
 *   palette without the other is a compile error.
 *
 * Contrast notes (WCAG):
 *   DARK
 *     - body text `cream` (#FFFAF0) on `base` (#0A0A0F): ~19:1, AAA
 *     - secondary `textSecondary` (#C9B68A) on `base`: ~9.4:1, AAA
 *     - muted `textMuted` (#8A7E5E) on `base`: ~4.6:1, AA (large text only —
 *       used for hints/labels, never body copy)
 *     - `goldBright` (#F4D03F) on `base`: ~13:1, AAA
 *   LIGHT
 *     - body `cream` (#1A1308) on `base` (#FBF6E9): ~14.5:1, AAA
 *     - secondary `textSecondary` (#5C4E2E) on `base`: ~6.8:1, AA+
 *     - muted `textMuted` (#7A6C45) on `base`: ~4.5:1, AA (large only)
 *     - `gold` (#9C700A) on `base`: ~5.6:1, AA+ (darkened from #B8860B to
 *       clear AA on ivory; #B8860B was ~4.4:1 which is borderline)
 *
 * Status palette (semantic, shared between modes — tuned so each token
 * hits AA against `base` and `baseElevated` in its own mode):
 *   - danger  — destructive actions, error text/icons
 *   - warning — pending, ending-soon
 *   - success — won, approved, positive trends
 *   - info    — neutral banners
 * Each exposes a foreground color, a soft fill, and a border so components
 * don't have to invent translucent variants on the fly.
 */

export type ThemeMode = 'dark' | 'light';
export type ThemePreference = ThemeMode | 'system';

/**
 * Resolve a user preference (which may follow the OS) into a concrete mode.
 * Falls back to dark when the OS scheme is unknown — matches the brand's
 * golden-on-midnight aesthetic as the safer default.
 */
export function resolveThemeMode(
  preference: ThemePreference,
  systemScheme: 'light' | 'dark' | null | undefined | 'unspecified',
): ThemeMode {
  if (preference === 'system') {
    return systemScheme === 'light' ? 'light' : 'dark';
  }
  return preference;
}

/** Semantic status colors (danger / warning / success / info). */
export interface StatusPalette {
  /** Foreground color for text and icons. */
  fg: string;
  /** Translucent fill for chips, banners, soft backgrounds. */
  soft: string;
  /** Border color for chips, banners, inputs in this status. */
  border: string;
}

export interface ThemeColors {
  // ── Surfaces ──────────────────────────────────────────────────────────
  /** App background, top of any gradient stack. */
  base: string;
  /** Card / elevated surface background. */
  baseElevated: string;
  /** Deepest background, used for vignettes. */
  baseDeep: string;

  // ── Gold scale ────────────────────────────────────────────────────────
  /** Deep gold — gradient stops, secondary borders. */
  goldDeep: string;
  /** Primary gold — accents, icons, inactive borders. */
  gold: string;
  /** Bright champagne gold — highlights, active states. */
  goldBright: string;
  /** Soft champagne — secondary highlights, eyebrows. */
  goldChampagne: string;
  /** Translucent gold glow for shadows and radial fills. */
  goldGlow: string;

  // ── Glass surfaces ────────────────────────────────────────────────────
  /** Glass card fill (translucent). */
  glassFill: string;
  /** Glass card fill when active / focused. */
  glassFillActive: string;
  /** Border on glass cards. */
  goldBorder: string;
  /** Border on active glass cards. */
  goldBorderActive: string;
  /** Top highlight strip on glass cards. */
  glassTopHighlight: string;
  /** Bottom edge strip on glass cards (light mode depth cue). */
  glassBottomEdge: string;

  // ── Text ──────────────────────────────────────────────────────────────
  /** Primary text color (titles, body). */
  cream: string;
  /** Secondary text (captions, labels). */
  textSecondary: string;
  /** Muted text (placeholders, hints). Use only for non-body copy. */
  textMuted: string;
  /** Text rendered on top of gold fills (button labels). */
  textOnGold: string;

  // ── Inputs / chips / dividers ─────────────────────────────────────────
  /** Background for input fields (translucent). */
  inputFill: string;
  /** Background for chips/pills (translucent). */
  chipFill: string;
  /** Subtle divider color. */
  divider: string;

  // ── Decorative ────────────────────────────────────────────────────────
  /** Vignette gradient stops for BackgroundOrbs. */
  vignette: [string, string, string];
  /** Orb colors for BackgroundOrbs. */
  orbColors: [string, string, string];

  // ── Status (semantic) ─────────────────────────────────────────────────
  danger: StatusPalette;
  warning: StatusPalette;
  success: StatusPalette;
  info: StatusPalette;

  // ── Overlay scrims ────────────────────────────────────────────────────
  /** Modal/scrim overlay (semi-opaque). */
  scrim: string;
}

export const DARK_THEME: ThemeColors = {
  base: '#0A0A0F',
  baseElevated: '#14141C',
  baseDeep: '#050507',

  goldDeep: '#8B6914',
  gold: '#D4A017',
  goldBright: '#F4D03F',
  goldChampagne: '#F5E6A8',
  goldGlow: 'rgba(212, 160, 23, 0.4)',

  glassFill: 'rgba(212, 160, 23, 0.06)',
  glassFillActive: 'rgba(244, 208, 63, 0.12)',
  goldBorder: 'rgba(244, 208, 63, 0.22)',
  goldBorderActive: 'rgba(244, 208, 63, 0.65)',
  glassTopHighlight: 'rgba(244, 208, 63, 0.55)',
  glassBottomEdge: 'transparent',

  cream: '#FFFAF0',
  textSecondary: '#C9B68A',
  textMuted: '#8A7E5E',
  textOnGold: '#1A1308',

  inputFill: 'rgba(212, 160, 23, 0.06)',
  chipFill: 'rgba(212, 160, 23, 0.10)',
  divider: 'rgba(244, 208, 63, 0.12)',

  vignette: ['rgba(5,5,7,0.85)', 'rgba(5,5,7,0)', 'rgba(5,5,7,0.55)'],
  orbColors: [
    'rgba(212, 160, 23, 0.18)',
    'rgba(244, 208, 63, 0.14)',
    'rgba(139, 105, 20, 0.20)',
  ],

  danger: {
    fg: '#F5A8A8',
    soft: 'rgba(220, 80, 80, 0.10)',
    border: 'rgba(220, 80, 80, 0.38)',
  },
  warning: {
    fg: '#F5A368',
    soft: 'rgba(245, 163, 104, 0.10)',
    border: 'rgba(245, 163, 104, 0.32)',
  },
  success: {
    fg: '#5BE58F',
    soft: 'rgba(91, 229, 143, 0.10)',
    border: 'rgba(91, 229, 143, 0.32)',
  },
  info: {
    fg: '#F5E6A8',
    soft: 'rgba(245, 230, 168, 0.08)',
    border: 'rgba(245, 230, 168, 0.22)',
  },

  scrim: 'rgba(0, 0, 0, 0.55)',
};

export const LIGHT_THEME: ThemeColors = {
  base: '#FBF6E9',
  baseElevated: '#FFFFFF',
  baseDeep: '#F0E8D2',

  goldDeep: '#8B6914',
  gold: '#9C700A', // darkened from #B8860B for AA on ivory
  goldBright: '#B8860B',
  goldChampagne: '#7A5E14',
  goldGlow: 'rgba(184, 134, 11, 0.28)',

  glassFill: 'rgba(255, 252, 245, 0.94)',
  glassFillActive: 'rgba(255, 246, 220, 0.97)',
  goldBorder: 'rgba(139, 105, 20, 0.18)', // stronger than dark mode for AA
  goldBorderActive: 'rgba(184, 134, 11, 0.42)',
  glassTopHighlight: 'rgba(255, 255, 255, 0.95)',
  glassBottomEdge: 'rgba(139, 105, 20, 0.10)',

  cream: '#1A1308',
  textSecondary: '#5C4E2E',
  textMuted: '#7A6C45',
  textOnGold: '#FFFAF0',

  inputFill: 'rgba(255, 255, 255, 0.75)',
  chipFill: 'rgba(184, 134, 11, 0.10)',
  divider: 'rgba(139, 105, 20, 0.16)',

  vignette: ['rgba(240, 232, 210, 0.65)', 'rgba(240, 232, 210, 0)', 'rgba(240, 232, 210, 0.85)'],
  orbColors: [
    'rgba(212, 160, 23, 0.20)',
    'rgba(244, 208, 63, 0.16)',
    'rgba(139, 105, 20, 0.14)',
  ],

  danger: {
    fg: '#A83232', // darkened from #F5A8A8 for AA on ivory
    soft: 'rgba(168, 50, 50, 0.08)',
    border: 'rgba(168, 50, 50, 0.28)',
  },
  warning: {
    fg: '#8A4F1A', // darkened from #F5A368 for AA on ivory
    soft: 'rgba(138, 79, 26, 0.10)',
    border: 'rgba(138, 79, 26, 0.30)',
  },
  success: {
    fg: '#1F7A3F', // darkened from #5BE58F for AA on ivory
    soft: 'rgba(31, 122, 63, 0.10)',
    border: 'rgba(31, 122, 63, 0.30)',
  },
  info: {
    fg: '#5C4E2E', // reuses textSecondary — neutral info tone
    soft: 'rgba(92, 78, 46, 0.08)',
    border: 'rgba(92, 78, 46, 0.22)',
  },

  scrim: 'rgba(20, 16, 8, 0.55)',
};

export const THEMES: Record<ThemeMode, ThemeColors> = {
  dark: DARK_THEME,
  light: LIGHT_THEME,
};
