import { Easing } from 'react-native-reanimated';

/**
 * Motion tokens — animation durations and easings. Pulling these into
 * one module keeps transitions consistent: every UI animation is fast
 * (200–300ms) so it enhances perceived speed rather than dragging.
 *
 * Reference durations (Jakob Nielsen's response-time rules):
 *   - 100ms   : feels instantaneous
 *   - 200ms   : feels snappy (button press, tab switch)
 *   - 300ms   : upper bound for "feels responsive" (route transition)
 *   - 500ms+  : only for splash / onboarding choreography
 */
export const Duration = {
  /** 90ms — instant press feedback start. */
  instant: 90,
  /** 150ms — short fade. */
  micro: 150,
  /** 220ms — default entrance / fade. */
  fast: 220,
  /** 280ms — route transition. */
  normal: 280,
  /** 350ms — splash exit, modal dismiss. */
  slow: 350,
  /** 500ms — tagline / onboarding step. */
  choreographed: 500,
} as const;

/**
 * Easings — Reanimated's `Easing` re-exported with semantic names so
 * call sites don't have to import from 'react-native-reanimated' for
 * every animation.
 */
export const Easings = {
  /** Default out-cubic — most UI motion. */
  standardOut: Easing.out(Easing.cubic),
  /** Soft entry for springy entrances (Reanimated config object form). */
  spring: { damping: 16, stiffness: 90, mass: 1 },
  /** Snappy tactile press spring. */
  press: { damping: 14, stiffness: 200, mass: 0.8 },
  /** Decelerate into place — used for slide-ins. */
  decelerate: Easing.out(Easing.quad),
  /** Sine in-out — long, gentle loops (background orbs). */
  breathe: Easing.inOut(Easing.sin),
};

/**
 * expo-router / react-navigation animation duration (ms). Applied to
 * `Stack` and `Tabs` `screenOptions.animationDuration`.
 */
export const NAV_TRANSITION_MS = 280;
