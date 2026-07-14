# Production-Readiness Audit — Enderas Auction Mobile

**Repo:** https://github.com/RamexDev/mobile.git
**Stack found in `package.json`:** Expo SDK 57 (`expo ~57.0.4`), React Native 0.86.0, React 19.2.3, Reanimated 4.5.0, react-native-worklets 0.10.0, @gorhom/bottom-sheet 5.2.14, @shopify/flash-list 2.0.2, expo-image 57, react-native-reanimated-carousel 5.0.0-beta.5, react-native-gesture-handler 2.32, react-native-keyboard-controller 1.21.9.

> **Note on the repo's own `README.md` / `SUMMARY_REPORT.md`:** those docs still describe the project as SDK 56; the code is already on SDK 57. A prior performance/UX pass is documented in `SUMMARY_REPORT.md` and `WORKLOG.md`. I re-audited the *current* state of the code from scratch — some of the prior pass's claims no longer match what's on disk (specifically the claim that "all `expo-image` usages already had `recyclingKey`" — see **P-4** below).

**Out of scope (per instructions):** Onboarding flow (`app/(onboarding)/`) and splash screen (`src/components/splash-screen/`). Those still use RN's legacy `Animated` API; left untouched.

---

## Verified baseline before any changes

| Check | Result |
|---|---|
| `npx tsc --noEmit` | ✅ 0 errors |
| `npx expo lint` | ✅ 0 errors, 9 pre-existing warnings (all unused imports + 1 ref-cleanup nit) |
| SDK 57 / RN 0.86 / Reanimated 4.5 / Worklets 0.10 compatibility matrix | ✅ correct (Reanimated 4 extracted worklets — both packages required) |
| `babel.config.js` Reanimated plugin | ✅ correct — `react-native-reanimated/plugin` is a re-export of `react-native-worklets/plugin` in v4, so either path works |
| `@gorhom/bottom-sheet` v5 default flips (`enableDynamicSizing`, `stackBehavior`) | ✅ mitigated — custom `<Sheet>` explicitly sets `enableDynamicSizing={dynamicSizing}` (default `false`) |
| FlashList v2 `maintainVisibleContentPosition` default-on | ✅ mitigated — all 3 FlashLists set `{{ disabled: true }}` |

---

## Audit findings

### Dead code

| # | Location | Finding | Impact |
|---|---|---|---|
| **D-1** | `src/components/auction/AuctionAssetShowcaseCard.tsx` (entire file, 105 lines) | Component is **never imported anywhere** in `app/` or `src/`. Already flagged as pre-existing in `SUMMARY_REPORT.md`. | Clutter. Safe to delete. |
| **D-2** | `src/components/shared/ImageGallery.tsx` lines 58, 156 | `insideBottomSheet` prop is declared, destructured, defaulted — but **never read** anywhere in the component. The only caller that passes it (`AuctionAssetDetailModal.tsx:81`) does so for no effect. | Misleading API surface. |
| **D-3** | `src/components/auth/index.ts` line 2 | `BackgroundOrbs` is re-exported from the `auth` barrel — but every actual consumer imports it directly from `@/components/shell/BackgroundOrbs`. | Dead re-export. |
| **D-4** | `src/hooks/useAuctionParticipation.ts` — `removeLotBid` (lines 211–227, returned in the result object) | `removeLotBid` is exported from the hook but **never called** by any consumer. `clearLotSelection` (which does the same thing + lookup) is used instead. | Dead public API surface. |
| **D-5** | Lint warnings — 8 unused imports across `BidSummaryBar.tsx` (`Radii`), `OwnerAuctionOverview.tsx` (`Spacing`), `AuthSuccessModal.tsx` (`useEffect`, `useRef`, `Radii`), `KycRequiredModal.tsx` (`Radii`), `LanguageSelector.tsx` (`Radii`), `cpoReadinessUtils.ts` (`validateLotBid`). | Dead imports. Trivial cleanup. |
| **D-6** | `app/auction/[id]/buy-doc.tsx` — `kycModalVisible` state (lines 41, 266–273) | `kycModalVisible` is declared and a `KycRequiredModal` is rendered with it, but the state is **never set to `true`** by any code path (the early-return at line 63 handles the unverified case with its own always-visible modal). | Dead UI — the modal can never appear. Harmless but confusing. |
| **D-7** | `app/(tabs)/profile/_layout.tsx` comment | Comment says "The tab-state bug fix lives in `(tabs)/_layout.tsx` (`unmountOnBlur` on the profile Tabs.Screen)" — but `(tabs)/_layout.tsx` has no such option set. Stale comment. | Documentation drift. |
| **D-8** | `app.json` has `"experiments": { "typedRoutes": true }` enabled, but every dynamic-route `router.push(...)` is cast `as any` (24 occurrences across `app/` and `src/`). | Typed routes are effectively disabled at call sites. Not a runtime bug, but the experiment is paying its cost (stricter types) without its benefit. |

### Performance issues

| # | Location | Finding | Severity |
|---|---|---|---|
| **P-1** | `app/(tabs)/assets.tsx` — `renderItem` (lines 125–133) | `renderItem` is an **inline arrow function**, recreated on every parent render. FlashList v2 sees a new `renderItem` reference → re-renders all visible cells on every parent state change (e.g., when `showKycModal` toggles, when pull-to-refresh spinner flips, when `useMyAssets`/`useOwnedAuctions` re-render). Compare with `bids.tsx` and `dashboard.tsx`, which both correctly wrap `renderItem` in `useCallback`. | **High** — list scrolls/taps re-render every visible AssetCard on every parent re-render. |
| **P-2** | `app/(tabs)/assets.tsx` & `bids.tsx` — `listHeader` (assets lines 82–117, bids lines 66–91) | `listHeader` is an inline JSX `const` with **no `useMemo`**. It captures `colors`, `t`, `summary`, `filteredBids.length`, `tab`, etc. — so it's a fresh element on every parent render, and FlashList re-renders the whole header each time. Dashboard's `listHeader` IS memoized (line 100), so this is an inconsistency. | **Medium** — header re-renders on every parent state tick. |
| **P-3** | `app/(tabs)/assets.tsx` — `onRefresh` (line 139) and `handleAddAsset` (line 67) | `onRefresh` is an inline closure passed to FlashList's `onRefresh` (recreated per render, but FlashList only calls it on pull so impact is small). `handleAddAsset` is inline and passed to `GoldButton` — recreated per render. Minor. | Low. |
| **P-4** | `BrowseAuctionCard.tsx`, `AssetCard.tsx`, `BidCard.tsx`, `LotBidCard.tsx` — every list-card `expo-image` | **All four list-card components are missing `recyclingKey` on their `<Image>`**. The prior summary report claims "all other `expo-image` usages already had `cachePolicy="memory-disk"` + `recyclingKey`" — this is **incorrect**. `ProfileAvatar` and `ImageGallery` have it; the four list cards do not. Per the SDK 57 `expo-image` docs, `recyclingKey` is *“especially useful for recycling views like FlashList to prevent showing the previous source before the new one fully loads.”* Without it, recycled cells in the dashboard / bids / assets FlashLists show the previous auction's image for a frame when scrolling fast. | **High** — visible flicker of stale images during fast list scrolling. |
| **P-5** | `app/(tabs)/_layout.tsx` line 52 — `lazy: false` on the `<Tabs>` | All four tab screens mount on app cold start (dashboard, bids, assets, profile). Each mounts its own `AppHeader` → its own `NotificationBell` → its own `useNotifications` hook → its own 60s polling interval. So on cold start the app spins up **4 parallel notification polls**, 4 `BackgroundOrbs`-less-but-still-mounted `useTheme` subscribers, and the full dashboard FlashList — before the user has even seen the first screen. The `lazy: false` was likely added to avoid a "blank tab on first switch" feel, but the default `lazy: true` + `freezeOnBlur` is the modern recommendation. | **Medium** — slower cold start + 4× notification polling. |
| **P-6** | `useNotifications` hook (mounted once per `NotificationBell`, which is mounted once per `AppHeader`, which is mounted once per tab screen) | Because every tab screen renders its own `AppHeader` (no shared header), the notification state is not shared. Each tab has independent `notifications`, `unreadCount`, `loading`, and its own 60s timer. Marking a notification as read on the dashboard tab does NOT update the badge on the bids tab until that tab's next refresh window. | **Medium** — duplicated state, inconsistent badge across tabs, 4× backend polling load. The proper fix is to lift notifications into a global store (zustand) or React Query; that's a refactor, not a targeted fix. Flagging as a known architectural issue. |
| **P-7** | `src/components/shell/GoldenTabBar.tsx` — `handlePress` (line 91) and `TabCell.handlePressInternal` (line 172) | Neither is memoized. The outer `handlePress` is recreated on every render and a fresh closure is passed to each `TabCell` per render (`onPress={() => handlePress(i, tab.name)}`). 4 cells × every parent render = 4 fresh closures. Tab bar re-renders are rare (only on tab switch / theme change), so impact is small, but the pattern is inconsistent with the rest of the app which uses `useCallback` for press handlers. | Low. |
| **P-8** | `src/components/shell/NotificationBell.tsx` — `renderItem` (line 56) and `ItemSeparatorComponent` (line 169) | Both are inline arrow functions. FlatList will warn about the inline `ItemSeparatorComponent` and re-render the separator on every parent render. The FlatList here is inside a `SheetDropdown` (only mounted when the bell is open), so impact is bounded — but the warning is real and the re-renders happen while the user is looking at the dropdown. | Low–Medium. |
| **P-9** | `useAuctionParticipation` — `useFocusEffect` deps include `loading` (line 186) | The focus-effect callback identity changes whenever `loading` flips (true → false after the initial load). expo-router's `useFocusEffect` then re-invokes the callback once on the load-completion frame. At that moment `lastLoadedAtRef.current` is fresh so no refetch fires — but it's a wasted effect run + a wasted `useCallback` identity change that propagates to anything consuming this hook's other memoized returns. A `loadingRef` would avoid the churn. | Low. |
| **P-10** | `app/auction/[id]/bid.tsx` — `saveTimersRef` cleanup (lines 133–140) | The effect cleanup iterates `saveTimersRef.current` to clear pending bid-save timers. ESLint already warns about this (`react-hooks/exhaustive-deps`): the ref's `.current` could change between render and cleanup. In practice this is fine because the ref is stable, but the lint warning is real. The standard fix is `const timers = saveTimersRef.current;` captured at effect-run time. | Low (lint hygiene). |
| **P-11** | `app/(tabs)/dashboard.tsx` — `listHeader` useMemo deps (line 141) | Deps are `[colors, records.length, search, statusFilter, categoryFilter, t]` — but `categoryFilter` and `statusFilter` are only read inside `<FilterPills>` and `<CategoryFilter>` as props, and the search field reads `search` directly. The memo is correct, but `colors` is in deps and `useTheme()` returns a memoized object that only changes on theme switch — so this is fine. Just noting it's correct. | None — verified correct. |

### Bugs

| # | Location | Finding | Severity |
|---|---|---|---|
| **B-1** | `src/components/shared/ImageGallery.tsx` — `loop={false}` + carousel v5-beta | The carousel uses `loop={false}` (line 298). Per the `react-native-reanimated-carousel` v5-beta issue tracker (issues #837, #855, #668, #803), **non-loop mode is the buggiest path in the v5-beta series**. beta.5 specifically fixed "non-loop `scrollTo()` backward jumps rendering a blank frame" and "non-loop + `overscrollEnabled={false}` allowing right overdrag past bounds", but the non-loop code path is still the active bug surface. The project is already on beta.5 (the latest), and the visible symptoms the user reports — "drag/swipe doesn't feel responsive, possible dropped frames" — match the known non-loop beta issues. There is no silent fix we can apply here without upgrading to a stable v5 release (which doesn't exist yet) or downgrading to v4.0.3 (which is incompatible with Reanimated 4). | **Known risk** — not a code bug per se, but a dependency-stability risk. Flagging. |
| **B-2** | `src/components/auction/AuctionAssetDetailModal.tsx` — `if (!asset) return null;` placement (line 42) | The early return is AFTER `useState(INITIAL_GALLERY_WIDTH)` (line 40) but BEFORE `handleGalleryLayout` is defined. React's rules of hooks are technically satisfied (the early return is after all hook calls), **but** the component still renders `<Sheet visible={visible}>` only when `asset` is non-null. This means: when `visible` is true but `asset` is null, the Sheet is unmounted entirely instead of being dismissed with an animation. The parent (`bid.tsx`) toggles `setDetailAsset(bidSheetAsset)` and `setBidSheetAsset(null)` together — so when the user taps "View Photos" in the bid sheet, the bid sheet dismisses (animated) but the detail modal **pops in with no entrance animation** because the `<Sheet>` was previously unmounted, not just hidden. Same on close — if `setDetailAsset(null)` runs first, the Sheet is yanked off-screen without the dismiss animation. | **Medium** — the detail modal's enter/exit feels janky compared to other sheets. The fix is to keep `<Sheet>` mounted (with `visible={visible && asset != null}`) and move the `if (!asset) return null` inside the Sheet body. |
| **B-3** | `src/components/shell/ScreenShell.tsx` — `noFade` focus effect (line 105) | When `noFade` is true, `useFocusEffect` returns early WITHOUT calling `cancelAnimation` or setting `fade.value = 1`. The initial `useSharedValue(noFade ? 1 : 0)` correctly starts at 1, but if a parent ever passes `noFade={false}` then later `noFade={true}` on the same mounted instance (unlikely but possible during a hot reload or a conditional render path), `fade.value` could be stuck at whatever value the prior animation left it. The safe fix is `if (noFade) { fade.value = 1; return; }`. | Low — only matters across `noFade` prop toggles on a mounted instance, which doesn't happen in current usage. |
| **B-4** | `app/auction/[id]/bid.tsx` — `hydratedDraftIdsRef` never resets (line 81) | `hydratedDraftIdsRef` is a `Set<string>` that accumulates draft IDs that have been hydrated into `lotBids`. It's never cleared when the auction changes or on unmount. If the user navigates between two auctions' bid screens (which share the same hook instance via React's route reconciliation), drafts from auction A could be skipped on auction B if the draft IDs collide (unlikely with UUIDs, but the logic is still wrong — the set should be keyed by `auctionId + draftId` or cleared on `auctionId` change). | Low — practically unlikely to bite, but a latent correctness bug. |
| **B-5** | `app/kyc/index.tsx` — `useEffect` deps `[user?.status]` (line 175) | The mount effect captures `user` from the render closure but only lists `user?.status` in deps. If `user` changes in other fields (e.g., `profilePicture`, `email`) without `status` changing, the effect does NOT re-run — but the inline `refresh` function (defined OUTSIDE the effect, line 133) captures the new `user`. The effect's own inline logic also reads `user?.status` only, so this is actually fine. Not a bug — just confirming. | None — verified correct. |

### Outdated / deprecated APIs (relative to SDK 57)

| # | Location | Finding | Severity |
|---|---|---|---|
| **O-1** | `app/(auth)/*.tsx` — uses `TouchableOpacity` from `react-native` (core) | The auth screens (`login`, `register`, `forgot-password`, `verify-otp`, `verify-reset-otp`, `reset-password`) use RN's core `TouchableOpacity` instead of `Pressable` or RNGH's `TouchableOpacity`. Inside a `GestureHandlerRootView`, the RNGH variants are more responsive (especially on Android) and integrate with the gesture system. The rest of the app uses `Pressable`. **Not deprecated**, just inconsistent and slightly slower on Android. | Low — auth screens are not scrollable, impact is minimal. |
| **O-2** | `expo-image-picker` — `mediaTypes: ['images']` | ✅ **Correct for SDK 57.** `MediaTypeOptions` enum is deprecated; the `MediaType` string array (`['images']`) is the recommended API. No change needed. | None. |
| **O-3** | RN's legacy `Animated` API — only in onboarding + splash | ✅ **Out of scope.** Onboarding and splash are explicitly excluded. No other surface uses legacy `Animated`. | None. |
| **O-4** | `react-native-reanimated-carousel` v5.0.0-beta.5 | The only v5 line that supports Reanimated 4. Stable v4.0.3 requires Reanimated 3. **No upgrade path available** — must wait for stable v5 or stay on beta. Already pinned to the latest beta. | Known risk — see **B-1**. |
| **O-5** | `react-native-worklets` 0.10.0 + Reanimated 4.5.0 | ✅ **Correct combination.** Reanimated 4 extracted worklets into a separate package; both must be installed. Versions are compatible. | None. |
| **O-6** | Android Reanimated memory regression | Per the SDK 57 changelog, importing Reanimated inflates Android memory by ~25–30% (regression from Hermes changes in RN 0.85). The recommended workaround is **Worklets Bundle Mode**, but Reanimated issue #9817 reports it can crash at startup with certain Metro configs. **Not applying without testing on a real Android build.** Flagging as a known upstream issue. | Known risk — requires real-device testing to evaluate. |

---

## Priority ranking

**Fix now (high-impact, low-risk, in-scope):**
1. **P-4** — Add `recyclingKey` to all four list-card `expo-image` instances. Eliminates visible stale-image flicker during fast scrolling. ~4 one-line edits.
2. **P-1** — Wrap `assets.tsx` `renderItem` in `useCallback` (matches `bids.tsx` / `dashboard.tsx` pattern). Eliminates full-list re-renders on every parent state change.
3. **P-2** — Memoize `listHeader` in `assets.tsx` and `bids.tsx` (matches `dashboard.tsx` pattern).
4. **B-2** — Move `if (!asset) return null` inside `<Sheet>` in `AuctionAssetDetailModal` so enter/exit animations play. This is one of the user's known problem areas ("Place Bids bottom sheet" gallery feels janky).
5. **D-1, D-5** — Delete `AuctionAssetShowcaseCard.tsx`; remove the 8 unused imports. Clean lint, no behavior change.

**Fix if approved (medium-impact, targeted):**
6. **D-2** — Remove the unused `insideBottomSheet` prop from `ImageGallery` (drop from interface, destructure, and the one caller).
7. **D-4** — Remove the unused `removeLotBid` from `useAuctionParticipation`'s public surface (or mark private).
8. **D-3** — Remove the dead `BackgroundOrbs` re-export from `auth/index.ts`.
9. **P-7** — `useCallback` the tab-bar press handlers (consistency, minor).
10. **P-8** — Stabilize `NotificationBell`'s FlatList `ItemSeparatorComponent` and `renderItem`.
11. **P-9** — Switch `useAuctionParticipation`'s focus-effect `loading` dep to a ref.
12. **P-10** — Capture `saveTimersRef.current` into a local in the bid.tsx cleanup effect (resolves the lint warning).
13. **B-3** — Defensive fix: set `fade.value = 1` before early-return in `ScreenShell`'s noFade focus effect.

**Flag but don't fix (large refactor or upstream-blocked):**
14. **P-5 + P-6** — `lazy: false` and per-tab `NotificationBell` duplication. Proper fix = lift notifications to a global store + switch to `lazy: true`. This is a meaningful refactor that touches navigation + state architecture. Flagging for a follow-up.
15. **B-1 / O-4** — Carousel v5-beta non-loop mode is the active bug surface. No code fix possible — must wait for stable v5 or accept the beta risk.
16. **O-6** — Android Reanimated memory regression. Worklets Bundle Mode is the upstream recommendation but it can crash at startup; needs real-device validation. Not safe to apply blindly.
17. **D-8** — 24× `as any` on `router.push` defeats `typedRoutes: true`. Proper fix = use `router.push({ pathname, params })` shape everywhere. Larger mechanical refactor; flagging.
18. **O-1** — Auth screens' core `TouchableOpacity`. Cosmetic consistency fix; very low impact.

**Out of scope (explicitly excluded):**
- Onboarding legacy `Animated` API (`app/(onboarding)/index.tsx`).
- Splash screen (`src/components/splash-screen/`).

---

## What I will NOT touch (and why)

- **Onboarding + splash** — explicitly out of scope per the user's instructions.
- **Backend API logic / data models / business logic** — per the project's standing constraint (see `README.md` "Out of scope"). The audit found no backend-blocked UI fixes.
- **Carousel library version** — v5-beta.5 is the latest available; downgrading to v4.0.3 would break Reanimated 4 compatibility. Must wait for stable v5.
- **`lazy: false` on tabs** — flipping it requires testing all 4 tab screens for first-switch blank states, plus the notification-state-duplication issue (P-6) should be fixed first to avoid making the cold-start regression worse.
- **Worklets Bundle Mode** — can crash at startup per upstream issue #9817; needs real Android device testing.

---

*End of audit. Awaiting confirmation of priorities before making any code changes.*
