/**
 * Theme module entry point. Re-exports the full design-token system:
 *   - colors      : light/dark palettes + status semantics
 *   - typography  : font families, sizes, weights, presets
 *   - spacing     : spacing scale
 *   - radii       : border radius scale
 *   - shadows     : elevation system
 *   - motion      : durations, easings, transition defaults
 *   - categoryColors : asset/auction category gradients + icons
 *
 * Components should import tokens from `@/theme` (this file) rather than
 * reaching into individual modules — that way we can refactor any
 * individual module without touching call sites.
 */
export * from './colors';
export * from './typography';
export * from './spacing';
export * from './radii';
export * from './shadows';
export * from './motion';
export * from './categoryColors';
export * from './statusTones';
