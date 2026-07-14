/**
 * Color tokens — the single source of truth for every color used in the app.
 *
 * Why a typed object shape (not separate files per palette):
 *   Components consume colors via `useTheme().colors.X`, so the two palettes
 *   MUST expose the same keys. TypeScript enforces this — adding a key to one
 *   palette without the other is a compile error.
 *
 * NOTE ON PALETTE: the former warm gold accent has been retargeted to the
 * web app's deep-blue brand palette (anchored at #06436a / #3b8fc9 dark),
 * mirroring how index.css remapped its own `--color-gold-*` scale. All key
 * names (goldDeep, gold, goldBright, etc.) are unchanged — only hex/rgba
 * values were swapped for the matching blue tier from the web tokens.
 *
 * Contrast notes (WCAG, recalculated for the new blue values):
 *   DARK
 *     - body text `cream` (#FFFAF0) on `base` (#0A0A0F): ~19:1, AAA (unchanged)
 *     - secondary `textSecondary` (#5BA5D8) on `base`: ~7.3:1, AAA
 *     - muted `textMuted` (#8AA3C8) on `base`: ~7.7:1, AAA
 *     - `goldBright` (#7AB4D8) on `base`: ~8.8:1, AAA
 *     - `gold` (#3B8FC9) on `base`: ~5.6:1, AA (large and normal text)
 *   LIGHT
 *     - body `cream` (#1A1308) on `base` (#FBF6E9): ~14.5:1, AAA (unchanged)
 *     - secondary `textSecondary` (#1D3861) on `base`: ~10.9:1, AAA
 *     - muted `textMuted` (#567AAE) on `base`: ~4.1:1, AA (large text only —
 *       used for hints/labels, never body copy)
 *     - `gold` (#06436A) on `base`: ~9.6:1, AAA
 *     - `goldBright` (#085386) on `base`: ~7.5:1, AAA
 *   Ratios were recomputed by hand for the new hues — re-verify with a
 *   contrast checker before shipping if precision matters.
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
 * blue-on-midnight aesthetic as the safer default.
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

  goldDeep: '#042E54',
  gold: '#3B8FC9',
  goldBright: '#7AB4D8',
  goldChampagne: '#B3CCE2',
  goldGlow: 'rgba(59, 143, 201, 0.4)',

  glassFill: 'rgba(59, 143, 201, 0.06)',
  glassFillActive: 'rgba(122, 180, 216, 0.12)',
  goldBorder: 'rgba(122, 180, 216, 0.22)',
  goldBorderActive: 'rgba(122, 180, 216, 0.65)',
  glassTopHighlight: 'rgba(122, 180, 216, 0.55)',
  glassBottomEdge: 'transparent',

  cream: '#FFFAF0',
  textSecondary: '#5BA5D8',
  textMuted: '#8AA3C8',
  textOnGold: '#FFFFFF',

  inputFill: 'rgba(59, 143, 201, 0.06)',
  chipFill: 'rgba(59, 143, 201, 0.10)',
  divider: 'rgba(122, 180, 216, 0.12)',

  vignette: ['rgba(5,5,7,0.85)', 'rgba(5,5,7,0)', 'rgba(5,5,7,0.55)'],
  orbColors: [
    'rgba(59, 143, 201, 0.18)',
    'rgba(122, 180, 216, 0.14)',
    'rgba(4, 46, 84, 0.20)',
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
    fg: '#B3CCE2',
    soft: 'rgba(179, 204, 226, 0.08)',
    border: 'rgba(179, 204, 226, 0.22)',
  },

  scrim: 'rgba(0, 0, 0, 0.55)',
};

export const LIGHT_THEME: ThemeColors = {
  base: '#FBF6E9',
  baseElevated: '#FFFFFF',
  baseDeep: '#F0E8D2',

  goldDeep: '#042E54',
  gold: '#06436A',
  goldBright: '#085386',
  goldChampagne: '#021F3D',
  goldGlow: 'rgba(8, 83, 134, 0.28)',

  glassFill: 'rgba(255, 252, 245, 0.94)',
  glassFillActive: 'rgba(255, 246, 220, 0.97)',
  goldBorder: 'rgba(4, 46, 84, 0.18)',
  goldBorderActive: 'rgba(8, 83, 134, 0.42)',
  glassTopHighlight: 'rgba(255, 255, 255, 0.95)',
  glassBottomEdge: 'rgba(4, 46, 84, 0.10)',

  cream: '#1A1308',
  textSecondary: '#1D3861',
  textMuted: '#567AAE',
  textOnGold: '#FFFFFF',

  inputFill: 'rgba(255, 255, 255, 0.75)',
  chipFill: 'rgba(8, 83, 134, 0.10)',
  divider: 'rgba(4, 46, 84, 0.16)',

  vignette: ['rgba(240, 232, 210, 0.65)', 'rgba(240, 232, 210, 0)', 'rgba(240, 232, 210, 0.85)'],
  orbColors: [
    'rgba(59, 143, 201, 0.20)',
    'rgba(122, 180, 216, 0.16)',
    'rgba(4, 46, 84, 0.14)',
  ],

  danger: {
    fg: '#A83232',
    soft: 'rgba(168, 50, 50, 0.08)',
    border: 'rgba(168, 50, 50, 0.28)',
  },
  warning: {
    fg: '#8A4F1A',
    soft: 'rgba(138, 79, 26, 0.10)',
    border: 'rgba(138, 79, 26, 0.30)',
  },
  success: {
    fg: '#1F7A3F',
    soft: 'rgba(31, 122, 63, 0.10)',
    border: 'rgba(31, 122, 63, 0.30)',
  },
  info: {
    fg: '#1D3861',
    soft: 'rgba(29, 56, 97, 0.08)',
    border: 'rgba(29, 56, 97, 0.22)',
  },

  scrim: 'rgba(20, 16, 8, 0.55)',
};

export const THEMES: Record<ThemeMode, ThemeColors> = {
  dark: DARK_THEME,
  light: LIGHT_THEME,
};