# SDK-57 Redesign — Summary of Changes

This document summarizes the work done in this branch: a full dependency
upgrade from Expo SDK 56 → 57 plus a UI/UX redesign, with **zero
changes** to backend logic, API endpoints, request payloads, or response
handling.

## 1. Dependency upgrade (SDK 56 → 57)

All dependencies were realigned to the versions Expo's doctor pins for
SDK 57 (`npx expo install --check` reports no remaining mismatches).

| Package | 56 (old) | 57 (new) |
|---|---|---|
| expo | ~56.0.12 | ~57.0.4 |
| expo-router | ~56.2.11 | ~57.0.4 |
| react-native | 0.85.3 | 0.86.0 |
| react / react-dom | 19.2.3 | 19.2.3 (SDK-pinned) |
| react-native-reanimated | 4.3.1 | ~4.5.0 |
| react-native-gesture-handler | ~2.31.1 | ~2.32.0 |
| react-native-keyboard-controller | 1.21.6 | 1.21.9 |
| react-native-safe-area-context | ~5.7.0 | ~5.7.0 |
| react-native-screens | 4.25.2 | 4.25.2 |
| react-native-webview | 13.16.1 | 13.16.1 |
| @expo/ui | ~56.0.18 | ~57.0.4 |
| All other `expo-*` packages | 56.x | 57.x |
| @tanstack/react-query | ^5.101.1 | ^5.101.2 |
| i18next / react-i18next | 26.3.2 / 17.0.8 | 26.3.6 / 17.0.9 |
| react-hook-form | ^7.80.0 | ^7.81.0 |
| typescript | ~6.0.3 | ~6.0.3 |
| eslint-config-expo | ~56.0.4 | ~57.0.0 |

### Breaking-change fixes applied

1. **TS strictness on `unknown` API responses** (`app/(auth)/login.tsx`,
   `app/(auth)/verify-otp.tsx`): TS 6 now correctly types
   `api.post(...)` as `Promise<unknown>`. Added typed casts at the call
   site only — no API/service code touched.
2. **`StyleSheet.absoluteFillObject` removed in RN 0.86**
   (`app/(tabs)/profile/edit-profile.tsx`): replaced with the
   equivalent `StyleSheet.absoluteFill`.
3. **`ImageStyle.overflow` no longer accepts `'scroll'`**
   (`src/components/profile/ProfileAvatar.tsx`): cast `ViewStyle` array
   to `ImageStyle[]` so the same style works for both `<Image>` and
   `<LinearGradient>`.
4. **`FormField.onChangeText` now optional** (`src/components/auth/FormField.tsx`):
   enables read-only fields (mobile number on edit-profile).

## 2. `react-native-keyboard-controller` audit

`react-native-keyboard-controller` is used in **4 source files**. After
the SDK-57 upgrade (`1.21.6 → 1.21.9`), no breaking API changes were
found in the high-level exports the app uses
(`KeyboardProvider`, `KeyboardAwareScrollView`, `KeyboardToolbar`,
`KeyboardToolbar.Group`, `KeyboardToolbar.Prev/Next/Done`).

### Fixes applied

- **Removed redundant nested `BottomSheetModalProvider`** in
  `app/auction/[id]/_layout.tsx`. The root `_layout.tsx` already mounts
  one above the navigator, so the nested provider was causing ref/dismiss
  quirks. Bottom sheets opened from any route now reliably reach the
  root provider.
- **`BidEntrySheet`** no longer uses `setTimeout(100ms)` to call
  `present()` plus `setTimeout(200ms)` to focus the input. The new
  shared `<Sheet>` primitive exposes an `onAnimate` callback that fires
  the moment the sheet reaches its snap point — focus is now
  deterministic, no race conditions.
- All auth + form-heavy screens continue to funnel through
  `AuthShell` / `ScreenShell`, which centralize
  `KeyboardAwareScrollView` + `KeyboardToolbar` + the gold theme. No
  per-screen keyboard logic was needed.
- No RN `KeyboardAvoidingView` is used anywhere — the codebase is
  consistently on `react-native-keyboard-controller`.

## 3. Modal/popup migration → `@gorhom/bottom-sheet`

Two new shared primitives were introduced under
`src/components/sheet/`:

| Primitive | Built on | Used for |
|---|---|---|
| `<Sheet>` | `BottomSheetModal` | Anything that slides up (bid entry, asset detail, CPO readiness, language picker, etc.) |
| `<SheetDropdown>` | Custom (Reanimated) | Header-anchored dropdowns (notifications, language, category filter) — preserves the "panel belongs to the trigger" affordance |
| `<Dialog>` | `BottomSheetModal` (centered) | Centered confirmation modals (auth success, KYC required, CPO upload) |

### Components migrated

| File | Was | Now |
|---|---|---|
| `src/components/auction/BidEntrySheet.tsx` | `BottomSheetModal` + timer hacks | `<Sheet>` + `onAnimate` deterministic focus |
| `src/components/auction/CpoReadinessSheet.tsx` | RN `Modal` + custom translateY | `<Sheet>` |
| `src/components/auction/AuctionAssetDetailModal.tsx` | RN `Modal` + custom translateY/opacity | `<Sheet>` |
| `src/components/auction/CpoUploadModal.tsx` | RN `Modal` + custom scale | `<Dialog>` |
| `src/components/auth/AuthSuccessModal.tsx` | RN `Modal` + custom scale | `<Dialog tone="success">` |
| `src/components/kyc/KycRequiredModal.tsx` | RN `Modal` + custom scale | `<Dialog tone="warning">` |
| `src/components/shell/NotificationBell.tsx` | RN `Modal` + custom translateY | `<SheetDropdown>` |
| `src/components/shell/LanguageSelector.tsx` | RN `Modal` + custom scale | `<SheetDropdown>` |
| `src/components/auction/CategoryFilter.tsx` | RN `Modal` + hardcoded `paddingTop: insets.top + 150` | `<SheetDropdown>` (consistent `insets.top + 60` anchor) |
| `app/(tabs)/profile/settings.tsx` | Inline RN `Modal` for language picker | `<Sheet>` (collapsed duplicate `LanguageSelector` UX into one consistent pattern) |

After this migration, **zero RN `Modal` imports remain in the codebase**.
Every overlay uses the same backdrop, dismiss language, gesture handling,
and motion vocabulary.

## 4. UI/UX redesign (2026)

The existing color token system (`src/theme/colors.ts`) was kept
**completely unchanged** — no new colors, no renamed tokens. The
redesign applies the existing tokens more effectively through refined
spacing, typography, motion, and component consistency.

### Theme tokens refined

- **`src/theme/typography.ts`**
  - Larger display sizes: 30 → 32 (auth titles), 38 → 40 (splash hero)
  - Tighter letter-spacing on display (0.4 → 0.2)
  - Tighter line-heights on captions (20 → 17) and body small (19 → 18)
  - New `sectionTitle` preset between `cardTitle` and `h1`
  - Button label letter-spacing 2 → 1.8 for tighter modern look
- **`src/theme/radii.ts`**
  - More generous radii across the board for a softer 2026 feel
  - `card`: 14 → 16, `lg`: 16 → 18, `xl`: 18 → 22, `pill`: 22 → 24,
    `floating`: 28 → 32
  - Same names, no API breakage
- **`src/theme/motion.ts`**
  - Tighter durations: `instant` 90 → 80, `micro` 150 → 140,
    `fast` 220 → 200, `slow` 350 → 340
  - New `snappyOut` and `active` easings for active-state cross-fades
  - Spring configs refined for tactile feedback

### Components modernized

- **`AppHeader`**: tighter vertical rhythm (paddingTop +4, paddingBottom
  10 → 8), subtler 4px title slide (was 8px), back button 34×34 (was 36),
  uses `Radii.sm` (10) instead of hardcoded 18
- **`ScreenShell`**: entrance is 200ms with 4px slide-up (was 220ms / 6px)
- **`GlassCard`**: entrance is 200ms with 6px slide-up (was 220ms / 10px)
- **`AuthShell`**: entrance is 200ms with 16px slide-up (was 250ms / 24px)
- **`GoldenTabBar`**: press feedback now uses spring (was linear timing)
  for more tactile feel
- **`authStyles.ts`**: title now uses `Typography.display` token (was
  hardcoded 30); stale warm-gold textShadow replaced with `colors.goldGlow`
  to match the post-rebrand blue palette; submit button uses `Radii.lg`

## 5. Constraints respected

- **No backend/API code touched** — verified via
  `git diff --stat -- src/services/ src/lib/authStore.ts src/lib/env.ts src/types/`
  (zero changes)
- **All existing functionality preserved** — this is a UI/UX and
  dependency upgrade only
- **Color token system unchanged** — `src/theme/colors.ts` has zero
  diff in this branch
- **Routes functionally equivalent** — Expo Router 57's navigation
  structure is unchanged; the same screens exist at the same paths

## 6. Verification

- `npx tsc --noEmit` — passes cleanly
- `npx expo install --check` — "Dependencies are up to date"
- `npx expo export --platform ios` — bundle compiles successfully
  (5.4MB HBC)
