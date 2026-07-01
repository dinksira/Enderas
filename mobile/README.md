# Enderas Auction — Mobile

Expo SDK 56 (React Native 0.85.x, React 19.2.x) auction app with a
golden glassmorphism design system, light/dark mode, EN/AM i18n, and
file-based routing via `expo-router`.

## Get started

```bash
npm install
npx expo start
```

Open in a development build, Android emulator, iOS simulator, or Expo
Go. Edit files under `app/` for routes, `src/components/` for UI, and
`src/theme/` for design tokens.

## Project structure

```
app/                      # expo-router file-based routes
  _layout.tsx             # Root layout — splash + theme bootstrap
  (tabs)/                 # Main tab group (dashboard, bids, assets, profile)
  (auth)/                 # Login / register / verify-otp
  (onboarding)/           # First-run onboarding
  auction/[id].tsx        # Auction detail
  kyc/index.tsx           # KYC submission
  assets/submit.tsx       # Asset submission wizard

src/
  theme/                  # Design tokens (single source of truth)
    colors.ts             # Light/dark palettes + status semantics
    typography.ts         # Font families, sizes, weights, presets
    spacing.ts            # Spacing scale
    radii.ts              # Border radius scale
    shadows.ts            # Elevation system
    motion.ts             # Animation durations + easings
    categoryColors.ts     # Asset category gradients + icons
    statusTones.ts        # UI tone → status palette mapping
    index.ts              # Re-exports

  components/
    ui/                   # Reusable primitives (PressableScale, Skeleton…)
    shell/                # AppHeader, GoldenTabBar, ScreenShell, GlassCard…
    splash-screen/        # Branded animated splash
    auth/                 # AuthShell, FormField, GoldButton, OtpInput…
    auction/              # AuctionCard, BrowseAuctionCard, StatCard…
    bids/                 # BidCard, BidFilterPills
    assets/               # AssetCard, AssetPhotoPicker, AssetSubmitWizard…
    kyc/                  # KycFileUpload, KycRequiredModal, banner…
    onboarding/           # onboardingStyles hook

  lib/                    # App utilities (store, i18n, env, glassStyles…)
  hooks/                  # React Query / data hooks
  services/               # API clients (axios)
  types/                  # Shared TypeScript types
  data/                   # Mock data (will be replaced by live API)
  locales/                # en.json / am.json
  utils/                  # Pure helpers (mobile-utils)

assets/                   # Icons + splash images
```

## Architecture decisions & trade-offs

### Theme system
- **Centralized in `src/theme/`** — colors, typography, spacing, radii,
  shadows, motion, and category gradients each live in their own module
  and are re-exported from `src/theme/index.ts`. Components import tokens
  from `@/theme` only.
- **Semantic status palette** — `colors.danger`, `colors.warning`,
  `colors.success`, `colors.info` each expose `fg` / `soft` / `border`.
  Components consume these via `toneToStatus(tone, colors)` so chips,
  banners, and status dots share one tone system across the app.
- **WCAG AA contrast** — light-mode tokens were darkened from the
  original palette (e.g. `gold` from `#B8860B` to `#9C700A`) to clear
  AA on the ivory base. Contrast ratios documented in `colors.ts` JSDoc.
- **Backwards-compat re-export** — `src/lib/theme.ts` still re-exports
  color tokens so any unmigrated import keeps working. New code imports
  from `@/theme`.

### Theme flicker fix
- The native splash is held via `preventAutoHideAsync` until **both**
  fonts are loaded (`useFonts`) AND the persisted store has hydrated
  (`useHydrated` from the zustand persist `onRehydrateStorage` hook).
- Only then does `_layout.tsx` compute the resolved theme, push its base
  color to `SystemUI.setBackgroundColorAsync`, hide the native splash,
  and mount the navigator. The first frame is therefore already the
  correct theme — no flash.
- The custom animated splash screen renders on top of the navigator
  (which is already mounted underneath) so when it fades out, the first
  screen is fully ready — no second flash.

### Folder reorganization
- Moved top-level `components/` → `src/components/` to match the
  existing `src/hooks/`, `src/lib/`, `src/services/` convention.
- Moved `app/(auth)/AuthStyles.tsx` → `src/components/auth/authStyles.ts`
  and `app/(onboarding)/OnBoardingStyles.tsx` →
  `src/components/onboarding/onboardingStyles.ts` so style hooks live
  next to the components that consume them, not inside route groups.
- Updated `tsconfig.json` path aliases so `@/components/*` now resolves
  to `./src/components/*`.
- All `app/` route files now import via `@/…` aliases instead of
  fragile `../../` relative paths.

### Dashboard redesign
- Replaced the single-column FlatList with a responsive 2-column grid
  (3 columns on screens ≥ 640px) using `FlatList numColumns`.
- `BrowseAuctionCard` gains a `compact` variant (smaller thumbnail,
  fewer description lines, tighter padding) so cards fit cleanly in
  the grid without overflow.
- Staggered entrance animation via `ListItemEntrance` (caps the
  stagger at 8 items so long lists don't drag the entrance).
- Loading state uses a `Skeleton` placeholder (gold-tinted shimmer)
  instead of a centered spinner.

### Navigation transitions
- `Stack` root uses `animation: 'fade'` with `animationDuration: 280`
  (matches the global motion token) so groups (auth/tabs/onboarding)
  cross-dissolve cleanly.
- Forward navigation (auction detail, KYC, asset submit) uses
  `slide_from_right` at the same 280ms.
- `(tabs)` layout uses `animation: 'fade'` between tab switches so the
  shared `BackgroundOrbs` layer stays put (single continuous canvas).
- Verified: the project uses `expo-router` only — no direct
  `@react-navigation/*` imports, so SDK 56's expo-doctor check passes.

### Micro-animations
- New `src/components/ui/` primitives:
  - `PressableScale` — drop-in `Pressable` replacement with a spring
    scale-down on press. All cards use this instead of the inline
    `style={({ pressed }) => ({ opacity: … })}` pattern.
  - `ListItemEntrance` — staggered fade + slide-up on mount.
  - `Skeleton` — shimmering placeholder for loading states.
- All animations use `react-native-reanimated` 4.x with
  `react-native-worklets` 0.8.x (SDK 56 split). Animations run on the
  UI thread so the JS thread stays free for navigation.

### Performance
- Cards (`BrowseAuctionCard`, `AssetCard`, `BidCard`, `AuctionCard`,
  `StatCard`) wrapped in `React.memo` — props are primitives or stable
  callbacks, so the default shallow compare is cheap and effective.
- Dashboard binds `onPress` via `useCallback` so the memoized cards
  don't re-render every parent render.
- Splash duration reduced from 5.5s → ~2.2s so cold starts feel snappy.

### SDK 56 compatibility
- `package.json` already targets SDK 56 (`expo ~56.0.12`, RN `0.85.3`,
  React `19.2.3`). Confirmed `react-native-reanimated 4.3.1` paired
  with `react-native-worklets 0.8.3` — required since SDK 56 split the
  worklets runtime into a separate package.
- `app.json` updated with both `light` and `dark` native splash config
  so the OS-native splash matches the user's system theme (the custom
  animated splash then takes over theme-aware).

## Out of scope (per project constraints)
- Site/marketing content & copy
- Backend API endpoints, request/response logic, business logic
- Existing data models or API contracts

## Known pre-existing issues
- `app/(auth)/login.tsx` and `app/(auth)/verify-otp.tsx` have ~30
  TypeScript errors of the form `'session' is of type 'unknown'`. These
  are pre-existing on the original repo's `HEAD` (verified via
  `git stash`) and are caused by missing return type annotations on
  `authApi.login` / `authApi.verifyOtp`. They're out of scope per the
  "no backend API logic" constraint — fixing them properly would
  require typing the auth API response contract, which touches the API
  surface.

## Scripts

```bash
npm start              # expo start
npm run android        # expo start --android
npm run ios            # expo start --ios
npm run web            # expo start --web
npm run lint           # expo lint
npm run typecheck      # tsc --noEmit
npm run reset-project  # move starter code aside for a fresh app dir
```
