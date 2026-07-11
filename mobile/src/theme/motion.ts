import { Easing } from 'react-native-reanimated';

/**
 * Motion tokens — animation durations, easings, and shared spring configs.
 *
 * 2026 redesign principles
 * ------------------------
 *   - Every UI animation is fast (180–320ms). Anything longer than
 *     400ms feels laggy on a modern device.
 *   - Use spring for tactile feedback (press, snap), use easing for
 *     choreographed entrances (fade, slide).
 *   - One easing curve per motion "category" — components don't pick
 *     arbitrary curves, they pick a category.
 *
 * Reference durations (Jakob Nielsen's response-time rules):
 *   - 100ms   : feels instantaneous
 *   - 200ms   : feels snappy (button press, tab switch)
 *   - 300ms   : upper bound for "feels responsive" (route transition)
 *   - 500ms+  : only for splash / onboarding choreography
 */
export const Duration = {
  /** 80ms — instant press feedback start. */
  instant: 80,
  /** 140ms — short fade. */
  micro: 140,
  /** 200ms — default entrance / fade. */
  fast: 200,
  /** 280ms — route transition. */
  normal: 280,
  /** 340ms — splash exit, sheet dismiss. */
  slow: 340,
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
  /** Slightly snappier than standardOut — used for active-state cross-fades. */
  snappyOut: Easing.out(Easing.quad),
  /** Soft entry for springy entrances (Reanimated config object form). */
  spring: { damping: 18, stiffness: 110, mass: 1 },
  /** Snappy tactile press spring. */
  press: { damping: 14, stiffness: 220, mass: 0.8 },
  /** Bouncy active-state spring (tab pills, sheet snap points). */
  active: { damping: 12, stiffness: 140, mass: 0.9 },
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
