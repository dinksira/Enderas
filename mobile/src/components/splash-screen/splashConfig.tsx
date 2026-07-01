/**
 * Splash screen runtime configuration.
 *
 * Visual identity
 * ---------------
 * Colors are no longer hardcoded here — the SplashScreen reads from the
 * active theme tokens (`useTheme().colors`). The hex values that remain
 * below are the *native* splash colors (declared in `app.json`'s
 * `expo-splash-screen` plugin), kept here as documentation of the
 * contract between the native splash and the custom animated splash.
 *
 * Timing
 * ------
 * The choreography (hammer drop → strike → name reveal → tagline) runs
 * for ~2.0s. After that the splash stays visible at full opacity until
 * the navigator has mounted and laid out — no fixed post-animation hold.
 * The exit fade (~350ms) plays only once routes are ready.
 *
 * Timing contract
 * ---------------
 *   - `choreographyRuntime`: hard floor — routes mount ONLY after this
 *     elapses, so the choreography is never cut short.
 *   - `exitDuration`: the fade-out length once the parent sets `dismiss`.
 *
 * Total visible time = choreographyRuntime + (navigator load time) + exitDuration.
 */
export const splashConfig = {
  // ── Brand ──────────────────────────────────────────────────────────
  appName: 'Enderas',
  tagline: 'Bid. Win. Own.',

  // ── Native splash contract (must match app.json) ───────────────────
  // These are documentation-only — actual native splash is configured
  // via the `expo-splash-screen` plugin in app.json.
  nativeBackgroundColorDark: '#0A0A0F',
  nativeBackgroundColorLight: '#FBF6E9',

  // ── Timing ─────────────────────────────────────────────────────────
  /**
   * Full runtime of the choreography (hammer drop through tagline
   * fade-in + particle burst). The exit animation starts ONLY after
   * this elapses — guarantees the choreography is never cut short.
   *
   * Computed from the longest animation chain in SplashScreen.tsx:
   *   revealDelay (940) + name/hammer spring settle (~800) = 1740
   *   tagline chain: (940 + 150) + spring (~500) + opacity (400) = 1990
   * Rounded up to 2000 so springs on slower devices still finish.
   */
  choreographyRuntime: 2000,

  /** Exit fade-out duration — starts only after routes are ready. */
  exitDuration: 350,

  // ── Animation phase durations (ms) ─────────────────────────────────
  /** Hammer drop spring duration. */
  phaseHammerDrop: 500,
  /** Reserved for future strike-phase tuning. */
  phaseHammerStrike: 300,
  /** Reserved for future name-slide tuning. */
  phaseNameSlide: 600,
  /** Reserved for future tagline-slide tuning. */
  phaseTaglineSlide: 500,
};

/**
 * Minimum splash visible time (choreography + exit) when routes load instantly.
 * Actual time also includes however long the navigator takes to lay out.
 */
export const SPLASH_MIN_DURATION_MS =
  splashConfig.choreographyRuntime + splashConfig.exitDuration;
