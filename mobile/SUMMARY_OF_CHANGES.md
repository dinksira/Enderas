# Production-Readiness Pass — Summary of Changes

**Repo:** https://github.com/RamexDev/mobile.git
**Stack:** Expo SDK 57 (`expo ~57.0.4`), React Native 0.86.0, React 19.2.3, Reanimated 4.5.0, react-native-worklets 0.10.0, @gorhom/bottom-sheet 5.2.14, @shopify/flash-list 2.0.2, expo-image 57, react-native-reanimated-carousel 5.0.0-beta.5, react-native-gesture-handler 2.32, react-native-keyboard-controller 1.21.9.

**Scope:** performance optimization + bug fixing only. No new features. No visual/design changes. No backend / API / data-model changes. Onboarding flow and splash screen untouched (per instruction).

---

## 1. Verification after all fixes

| Check | Before | After |
|---|---|---|
| `npx tsc --noEmit` | 0 errors | **0 errors** |
| `npx expo lint` | 0 errors, 9 warnings | **0 errors, 0 warnings** |
| `npx expo export --platform android` | 5.8 MB bundle, success | **5.8 MB bundle, success** |
| `npx expo export --platform ios` | 5.5 MB bundle, success | **5.6 MB bundle, success** |

Lint went from 9 pre-existing warnings → 0. No regressions in bundle size.

---

## 2. What was fixed

### 2.1 Image flicker during fast list scrolling (P-4) — **highest visual impact**

**Files:** `src/components/auction/BrowseAuctionCard.tsx`, `src/components/assets/AssetCard.tsx`, `src/components/bids/BidCard.tsx`, `src/components/auction/LotBidCard.tsx`

**Problem:** All four list-card components used `expo-image` with `cachePolicy="memory-disk"` but **without `recyclingKey`**. The prior `SUMMARY_REPORT.md` claimed "all `expo-image` usages already had `cachePolicy` + `recyclingKey`" — this was incorrect. Only `ProfileAvatar` and `ImageGallery` had it; the four list cards did not.

Per the SDK 57 `expo-image` docs, `recyclingKey` is *"especially useful for recycling views like FlashList to prevent showing the previous source before the new one fully loads."* Without it, recycled cells in the dashboard / bids / assets FlashLists showed the previous auction's image for a frame when scrolling fast — a visible flicker.

**Fix:** Added `recyclingKey={uri}` to all four list-card `<Image>` instances. ~4 one-line edits.

### 2.2 List re-render storms on the Assets tab (P-1, P-2)

**Files:** `app/(tabs)/assets.tsx`, `app/(tabs)/bids.tsx`

**Problem:** `assets.tsx`'s `renderItem` was an inline arrow function — FlashList saw a new `renderItem` reference on every parent state change (every `setShowKycModal`, every pull-to-refresh spinner flip, every `useMyAssets`/`useOwnedAuctions` re-render) and re-rendered all visible AssetCards. `bids.tsx` had the same problem on `renderItem` but it was already `useCallback`-wrapped; both screens had **non-memoized `listHeader`** (dashboard's was memoized — inconsistency).

**Fix:**
- Wrapped `assets.tsx` `renderItem` in `useCallback` (matches the pattern already used in `bids.tsx` and `dashboard.tsx`).
- Memoized `listHeader` in both `assets.tsx` and `bids.tsx` with `useMemo` (matches `dashboard.tsx`).
- Also wrapped `handleAddAsset` and the per-owned-auction press handler in `useCallback` so the memoized `listHeader`'s deps stay stable.

### 2.3 AuctionAssetDetailModal enter/exit animations (B-2) — **one of the user's known problem areas**

**File:** `src/components/auction/AuctionAssetDetailModal.tsx`

**Problem:** The component did `if (!asset) return null;` *before* mounting `<Sheet>`. When the user tapped "View Photos" in the bid sheet, the parent did `setDetailAsset(bidSheetAsset); setBidSheetAsset(null);` — so the detail modal went from "unmounted" to "mounted with `visible=true`" in one frame. The Sheet's entrance animation never ran; it just popped in. Same on close — if `setDetailAsset(null)` ran first, the Sheet was yanked off-screen without the dismiss animation. This is one of the user's explicitly-called-out problem areas ("Place Bids bottom sheet" gallery).

**Fix:** Removed the early return. `<Sheet>` is now always mounted; the `asset && theme` gate is inside the Sheet body. The Sheet's enter/exit animations now run normally and the body just renders nothing during the brief gap. Also dropped the dead `insideBottomSheet` prop from the `<ImageGallery>` call here (it was a no-op — see D-2).

### 2.4 Dead code removal (D-1 through D-5)

| Item | File | Action |
|---|---|---|
| D-1 | `src/components/auction/AuctionAssetShowcaseCard.tsx` | **Deleted.** 105-line component, never imported anywhere. Already flagged as pre-existing in the prior `SUMMARY_REPORT.md`. |
| D-2 | `src/components/shared/ImageGallery.tsx` | Removed the unused `insideBottomSheet` prop from the interface and the destructurer. The only caller (`AuctionAssetDetailModal.tsx`) was passing it for no effect. |
| D-3 | `src/components/auth/index.ts` | Removed the dead `BackgroundOrbs` re-export. Every actual consumer imports it directly from `@/components/shell/BackgroundOrbs`. |
| D-4 | `src/hooks/useAuctionParticipation.ts` | Removed the unused `removeLotBid` from the hook's public surface. `clearLotSelection` (which does the same thing + lookup) is what every consumer actually uses. |
| D-5 | 6 files | Removed all 8 unused imports that were producing lint warnings: `Radii` from `BidSummaryBar`, `Spacing` from `OwnerAuctionOverview`, `useEffect`/`useRef`/`Radii` from `AuthSuccessModal`, `Radii` from `KycRequiredModal`, `Radii` from `LanguageSelector`, `validateLotBid` from `cpoReadinessUtils`. |

### 2.5 Stability fixes (P-7, P-8, P-9, P-10, B-3)

| Item | File | Fix |
|---|---|---|
| P-7 | `src/components/shell/GoldenTabBar.tsx` | Wrapped `handlePress` in `useCallback`. Tab-bar re-renders are rare but this matches the rest of the app's pattern. |
| P-8 | `src/components/shell/NotificationBell.tsx` | Wrapped `renderItem` and `iconForKind` in `useCallback`. Extracted a stable `NotifSeparator` component (was an inline arrow that FlatList warned about and re-mounted on every parent render). |
| P-9 | `src/hooks/useAuctionParticipation.ts` | Mirrored `loading` into a `loadingRef` so the `useFocusEffect` callback identity stays stable across the initial-load `true→false` flip. Was causing a wasted effect run + a callback identity change that propagated to consumers on every auction screen mount. |
| P-10 | `app/auction/[id]/bid.tsx` | Captured `saveTimersRef.current` into a local `timers` variable inside the cleanup effect. Resolves the `react-hooks/exhaustive-deps` warning about the ref value potentially changing between render and cleanup. |
| B-3 | `src/components/shell/ScreenShell.tsx` | Defensive: when `noFade` is true, the focus effect now sets `fade.value = 1` before returning. Previously it just returned, which left `fade.value` at whatever the prior animation left it — fine for current usage but a latent bug if the prop ever toggled on a mounted instance. |

---

## 3. What was intentionally left alone (and why)

### 3.1 Onboarding flow + splash screen
Explicitly out of scope per the user's instructions. Both still use RN's legacy `Animated` API. The legacy usages all use `useNativeDriver: true` for transform/opacity so they already run on the native thread — no user-visible jank to fix.

### 3.2 Image gallery carousel (`react-native-reanimated-carousel` v5-beta) — B-1
The `ImageGallery` component uses `loop={false}` on carousel v5-beta. Per the project's own GitHub issue tracker (issues #837, #855, #668, #803), **non-loop mode is the buggiest path in the v5-beta series**. beta.5 (the version installed) specifically fixed several non-loop bugs, but the non-loop code path is still the active bug surface. The user's reported symptoms — "drag/swipe doesn't feel responsive, possible dropped frames" — match the known non-loop beta issues.

**No code fix is possible here.** Options are:
1. Wait for stable v5 release (not yet available).
2. Downgrade to v4.0.3 (incompatible with Reanimated 4 — would require also downgrading Reanimated to v3, which is a much larger change).
3. Replace the carousel with a hand-rolled `FlatList`-based pager (would re-introduce the exact problems the prior pass migrated away from).

Recommendation: pin to `^5.0.0-beta.5` and monitor https://github.com/dohooo/react-native-reanimated-carousel for the first stable v5 release, then upgrade.

### 3.3 Per-tab `NotificationBell` duplication (P-5, P-6)
Each of the 4 tab screens renders its own `AppHeader` → its own `NotificationBell` → its own `useNotifications` hook → its own 60s polling interval. So the app spins up 4 parallel notification polls on cold start, and marking a notification as read on one tab does NOT update the badge on the other tabs until that tab's next refresh window.

The proper fix is to lift notifications into a global store (zustand) or React Query. That's a meaningful refactor that touches navigation + state architecture — flagged for a follow-up, not done blindly in this pass. The `<Tabs lazy={false}>` setting (P-5) compounds this by mounting all 4 tabs at cold start; flipping it to `lazy: true` without first fixing the notification duplication would just delay (not eliminate) the problem and could introduce blank-first-switch states that need testing on a real device.

### 3.4 Android Reanimated memory regression (O-6)
Per the SDK 57 changelog, importing Reanimated inflates Android memory by ~25–30% (regression from Hermes changes in RN 0.85). The recommended workaround is **Worklets Bundle Mode**, but Reanimated issue #9817 reports it can crash at startup with `RangeError: Maximum call stack size exceeded` on certain Metro configs. **Not applying without real-device testing** — flagging as a known upstream issue.

### 3.5 `typedRoutes: true` defeated by 24× `as any` (D-8)
`app.json` has `"experiments": { "typedRoutes": true }` enabled, but every dynamic-route `router.push(...)` is cast `as any` (24 occurrences across `app/` and `src/`). The experiment is paying its cost (stricter types) without its benefit. The proper fix is to use `router.push({ pathname, params })` shape everywhere — a larger mechanical refactor that's out of scope for a fix/optimize pass.

### 3.6 Auth screens' core `TouchableOpacity` (O-1)
The auth screens use RN's core `TouchableOpacity` instead of `Pressable` or RNGH's `TouchableOpacity`. The rest of the app uses `Pressable`. Not deprecated, just inconsistent and slightly slower on Android. Auth screens aren't scrollable so impact is minimal — flagging as a cosmetic consistency fix for a future pass.

### 3.7 Dead `kycModalVisible` state in `buy-doc.tsx` (D-6)
`kycModalVisible` is declared and a `KycRequiredModal` is rendered with it, but the state is never set to `true` by any code path (the early-return at line 63 handles the unverified case with its own always-visible modal). Harmless — leaving it to avoid touching auth-gate logic that could have subtle flow implications.

### 3.8 `hydratedDraftIdsRef` not keyed by auction (B-4)
The `Set<string>` accumulates draft IDs and is never cleared on auction change. If a user navigated between two auctions' bid screens with colliding draft IDs, drafts from auction A could be skipped on auction B. Practically unlikely (UUIDs), latent correctness bug. Leaving alone — fixing requires touching bid-draft hydration logic that's adjacent to business logic.

---

## 4. Remaining risks / recommended follow-ups

1. **Carousel v5-beta** — monitor for stable v5 release; the non-loop mode is the active bug surface and is exactly the path the image galleries use. (B-1)
2. **Notification architecture refactor** — lift `useNotifications` into a global store (zustand or React Query) so the 4 tab bells share state and there's only one polling timer. Then flip `<Tabs lazy={false}>` to `lazy: true` (default) for faster cold start. (P-5, P-6)
3. **Worklets Bundle Mode** — evaluate on a real Android device for the 25–30% memory regression. Watch for the startup-crash issue (#9817). (O-6)
4. **`typedRoutes` cleanup** — replace the 24× `router.push(... as any)` with the typed `{ pathname, params }` shape so the `typedRoutes: true` experiment actually pays off. (D-8)
5. **Carousel inside bottom-sheet interaction** — the `ImageGallery` `onConfigurePanGesture` already separates horizontal carousel swipes from vertical sheet pans, but the v5-beta's `resolvedSize` SharedValue measurement can interact poorly inside a dynamically-sized bottom sheet (both measure on the UI thread). If you still see jank in the `AuctionAssetDetailModal` gallery after this pass, the next thing to investigate is whether the sheet's `enableDynamicSizing` is causing layout thrash. The custom `<Sheet>` primitive defaults `enableDynamicSizing={false}`, but `AuctionAssetDetailModal` uses a fixed `['90%']` snap so this should be fine — flagging just in case.

---

## 5. Files changed

```
app/(tabs)/assets.tsx                              # P-1, P-2: useCallback renderItem + useMemo listHeader + useCallback handleAddAsset/handleOwnedAuctionPress
app/(tabs)/bids.tsx                                # P-2: useMemo listHeader
app/auction/[id]/bid.tsx                           # P-10: saveTimersRef cleanup lint fix
src/components/assets/AssetCard.tsx                # P-4: recyclingKey
src/components/auction/AuctionAssetDetailModal.tsx # B-2: move null check inside Sheet; drop dead insideBottomSheet prop
src/components/auction/BidSummaryBar.tsx           # D-5: remove unused Radii import
src/components/auction/BrowseAuctionCard.tsx       # P-4: recyclingKey
src/components/auction/LotBidCard.tsx              # P-4: recyclingKey
src/components/auction/OwnerAuctionOverview.tsx    # D-5: remove unused Spacing import
src/components/auth/AuthSuccessModal.tsx           # D-5: remove unused useEffect/useRef/Radii imports
src/components/auth/index.ts                       # D-3: remove dead BackgroundOrbs re-export
src/components/bids/BidCard.tsx                    # P-4: recyclingKey
src/components/kyc/KycRequiredModal.tsx            # D-5: remove unused Radii import
src/components/shell/GoldenTabBar.tsx              # P-7: useCallback handlePress
src/components/shell/LanguageSelector.tsx          # D-5: remove unused Radii import
src/components/shell/NotificationBell.tsx          # P-8: useCallback renderItem/iconForKind + stable NotifSeparator
src/components/shell/ScreenShell.tsx               # B-3: defensive noFade fade.value = 1
src/components/shared/ImageGallery.tsx             # D-2: remove dead insideBottomSheet prop
src/hooks/useAuctionParticipation.ts               # D-4: remove unused removeLotBid; P-9: loadingRef for focus-effect
src/lib/cpoReadinessUtils.ts                       # D-5: remove unused validateLotBid import
```

**Deleted:**
- `src/components/auction/AuctionAssetShowcaseCard.tsx` (D-1, never imported)

**Added (audit/report only, no code):**
- `AUDIT.md` — full pre-fix audit (kept for reference)
- `SUMMARY_OF_CHANGES.md` — this file

**22 files changed, 1 file deleted, 0 backend files touched, 0 onboarding/splash files touched.**

---

## 6. Docs consulted

- **Expo SDK 57 changelog** (via search-corroborated quotes — the expo.dev/changelog page is React-SSR and doesn't extract via reader): SDK 57 = RN 0.86 + Reanimated 4.5 + Worklets 0.10 + Gesture Handler 2.32; deliberately small release; Android Reanimated memory regression ~25–30%.
- **`expo-image` SDK 57** (https://docs.expo.dev/versions/v57.0.0/sdk/image/): `recyclingKey` docs — "especially useful for recycling views like FlashList to prevent showing the previous source before the new one fully loads."
- **`react-native-reanimated-carousel`** GitHub issues #837, #855, #668, #803, #902: non-loop mode is the active bug surface in v5-beta; beta.5 fixed several non-loop bugs but the path is still buggy.
- **`@gorhom/bottom-sheet` v5** (gorhom.dev blog + deepwiki migration): `enableDynamicSizing` default flipped to `true` in v5 — mitigated here by the custom `<Sheet>` primitive which explicitly sets `enableDynamicSizing={dynamicSizing}` (default `false`).
- **FlashList v2 known issues** (https://shopify.github.io/flash-list/docs/known-issues/): `maintainVisibleContentPosition` defaults to enabled — mitigated here by all 3 FlashLists setting `{{ disabled: true }}`.
- **Reanimated 4 + Worklets 0.10**: confirmed correct combination (Reanimated 4 extracted worklets into a separate package; both must be installed). Babel plugin at `react-native-reanimated/plugin` is a re-export of `react-native-worklets/plugin` in v4 — current `babel.config.js` is correct.
