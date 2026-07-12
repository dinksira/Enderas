# Frontend Design

The Enderas system has three client applications: a bidder-facing frontend, an admin panel, and a mobile app. The frontend and admin share a common code layer while the mobile app is an independent implementation.

## Shared Code Layer (`@enderass/shared`)

Both the frontend and admin panels import from a shared directory aliased as `@enderass/shared` in their Vite configs:

```js
// vite.config.js
resolve: {
  alias: { '@enderass/shared': path.resolve(__dirname, 'src/shared') }
}
```

**Shared modules:**
- `auth/` — Zustand auth store, `ProtectedRoute`, `PermissionGate`, `PermissionProvider`
- `api/` — `fetch`-based API wrapper with Bearer token injection
- `services/` — 20+ API service files (auctions, bids, KYC, payments, etc.)
- `config/` — Routes, navigation, modules, actions, page registry
- `hooks/` — `useAuth`, `usePaginatedResource`, `useOtpTimer`
- `i18n/` — i18next setup with English and Amharic locales
- `ui/` — Reusable components (Button, Card, FileUpload, ImageViewer, etc.)
- `ui-admin/` — Admin-specific components (DataTable, Drawer, StatusPill, etc.)
- `utils/` — Permission checks, mobile utils, auction utils, display utils

---

## Frontend (Bidder App)

| Aspect | Detail |
|--------|--------|
| Location | `frontend/` |
| Framework | React 19.1 (JSX, no TypeScript) |
| Build tool | Vite 6.3 |
| Dev port | 5173 |
| Routing | react-router-dom 7.6 (declarative) |
| State | Zustand 5 (in-memory) |
| API | Native `fetch` with custom wrapper |
| i18n | i18next 25 + react-i18next 15 |
| Deployment | Vercel (static SPA) |

### Route Structure

```
/                          # Public landing page
/login                     # Login/register (tabbed)
/verify-otp                # OTP verification
/complete-profile          # Profile completion (KYC pending)
/kyc-under-review          # KYC review status
/kyc-rejected              # KYC rejection status
/app                       # Authenticated shell (RoleLayout)
├── /app/browse-auctions   # Browse published auctions (bidder default)
├── /app/auctions/:id      # Auction detail
├── /app/my-bids           # Bid management
├── /app/my-assets         # Asset management
├── /app/kyc               # KYC submission
├── /app/payments          # Payment management
├── /app/cpo               # CPO management
├── /app/notifications     # Notification center
├── /app/profile           # User profile
└── /app/access-denied     # Permission denied page
/track/:token              # Public auction tracking
```

### State Management

**Zustand auth store** (`shared/auth/auth-store.js`):
- `status` — idle / hydrating / authenticated / unauthenticated
- `accessToken` — in-memory only (never localStorage)
- `user` — id, roleId, roleCode, userType, displayName, mobileNumber, status
- `permissions` — roleCode, wildcard, modules[], actions[], routes[], moduleActions{}
- Actions: `setSession()`, `clearSession()`, `can()`, `requiresKYC()`

**CPO wizard store** (`shared/stores/cpo-wizard.store.js`):
- Multi-step wizard for bid + CPO document submission
- Tracks step, bids[], receiptUrl, transactionRef, depositAmount

### Authentication Flow

```
/login → authApi.login() → setSession() → redirect to /app
  ↓ (if mobile unverified)
/verify-otp → authApi.verifyOtp() → setSession()
  ↓ (if KYC not complete)
/complete-profile → submit KYC → /kyc-under-review
  ↓ (after CSO approval)
/app (authenticated, active status)
```

**Protected routes** enforce:
1. Authentication status (redirect to `/login` if unauthenticated)
2. KYC status routing for non-staff users
3. Module-level RBAC via `canAccess(permissions, module, action)`

### Layout System

| Layout | Purpose |
|--------|---------|
| `PublicLayout` | Minimal wrapper for public pages |
| `AuthLayout` | Legacy auth page wrapper |
| `RoleLayout` → `DashboardShell` | Primary authenticated shell |

**DashboardShell** (508 lines):
- Floating icon dock sidebar (collapsible)
- Header with search bar, language toggle (en/am), theme toggle, notification bell
- `<Outlet />` for page content
- Logout modal, KYC status banner
- SVG icon map for 25+ navigation items

### Navigation by Role

| Role | Default Route | Nav Groups |
|------|--------------|------------|
| `bidder` | `/app/browse-auctions` | bidder, owner, account |
| `super_admin` | `/app/auctions` | admin, auction, operations, finance, main, account |
| `auction_manager` | `/app/auctions` | auction, operations, account |
| `evaluation_officer` | `/app/evaluations` | operations, account |
| `finance_officer` | `/app/payments` | finance, account |
| `customer_service_officer` | `/app/users` | admin, operations, account |

### Internationalization

- **Languages:** English (`en`), Amharic (`am`)
- **Locale files:** `shared/i18n/locales/en.json` (2,388 lines), `am.json`
- **Usage:** `useTranslation()` hook + `t('key')` throughout components
- **Persistence:** `localStorage` key `preferredLanguage`, synced with user profile on login

---

## Admin Panel

| Aspect | Detail |
|--------|--------|
| Location | `admin/` |
| Framework | React 19.1 (JSX, no TypeScript) |
| Build tool | Vite 6.3 |
| Dev port | 5174 |
| Routing | react-router-dom 7.6 |
| State | Zustand 5 (shared store) |
| API | Same shared `@enderass/shared` layer |
| Deployment | Vercel (static SPA) |

### Route Structure

```
/                            # Redirects to /login
/login                       # Admin login
/app                         # Authenticated admin shell
├── /app/auctions            # Auction management (default)
├── /app/create-auction      # Create new auction
├── /app/assets              # Asset management
├── /app/evaluations         # Evaluation management
├── /app/bids                # Bid management
├── /app/winners             # Winner management
├── /app/payments            # Payment verification
├── /app/cpo                 # CPO management
├── /app/users               # User management
├── /app/staff               # Staff management
├── /app/roles               # Audit trail
├── /app/kyc                 # KYC review
├── /app/organizations       # Organization management
├── /app/share-links         # Share link management
├── /app/documents           # Document management
├── /app/reports             # Analytics & reports
├── /app/notifications       # Notification center
├── /app/settings            # System settings
└── /app/profile             # Admin profile
```

### Admin-Specific UI Components

| Component | File | Purpose |
|-----------|------|---------|
| `AdminDataTable` | `shared/ui-admin/AdminDataTable.jsx` | Full-featured table with tabs, search, pagination, loading/empty states, footer summary |
| `AdminDetailDrawer` | `shared/ui-admin/AdminDetailDrawer.jsx` | Slide-in drawer with sections, loading, error, footer actions |
| `PaginationBar` | `shared/ui-admin/PaginationBar.jsx` | Prev/next pagination controls |
| `StatusPill` | `shared/ui-admin/StatusPill.jsx` | Colored status badge |
| `DateRangeFilter` | `shared/ui-admin/DateRangeFilter.jsx` | Date range picker |
| `ApproveConfirmModal` | `shared/ui-admin/ApproveConfirmModal.jsx` | Approval confirmation dialog |
| `RejectReasonModal` | `shared/ui-admin/RejectReasonModal.jsx` | Rejection reason textarea modal |

### Role-Based Dashboards

Each staff role has a dedicated dashboard view:

| Role | Dashboard Component |
|------|-------------------|
| `super_admin` | `SuperAdminDashboardView` |
| `auction_manager` | `AuctionManagerDashboardView` |
| `evaluation_officer` | `EvaluationOfficerDashboardView` |
| `finance_officer` | `FinanceOfficerDashboardView` |
| `customer_service_officer` | `CustomerServiceDashboardView` |
| `bidder` | `BidderDashboardView` |

Dashboards fetch metrics from `dashboardService.getMetrics()` and display role-specific KPIs.

### Admin Layout

**DashboardShell** (528 lines) — Traditional sidebar layout:
- Collapsible sidebar with navigation icons
- Header: page title, search bar, language toggle, notification bell
- `AdminUnreadNotificationsBanner` + `KYCStatusBanner`
- SVG icon map for 25+ navigation items

---

## Mobile App

| Aspect | Detail |
|--------|--------|
| Location | `mobile/` |
| Framework | React Native 0.85.3 + Expo SDK 56 |
| Language | TypeScript |
| Routing | Expo Router 56 (file-based) |
| State | Zustand 5 (persisted to SecureStore) |
| API | Native `fetch` with typed wrapper |
| i18n | i18next 26 + react-i18next 17 |
| Deployment | EAS (Expo Application Services) |

### File-Based Routing

```
app/
├── _layout.tsx              # Root layout (Stack navigator)
├── index.tsx                # Entry redirect → onboarding or tabs
├── (onboarding)/
│   ├── _layout.tsx          # Onboarding stack
│   └── index.tsx            # Onboarding screen
├── (auth)/
│   ├── _layout.tsx          # Auth stack
│   ├── login.tsx            # Login
│   ├── register.tsx         # Register
│   └── verify-otp.tsx       # OTP verification
├── (tabs)/
│   ├── _layout.tsx          # Tab navigator (GoldenTabBar)
│   ├── dashboard.tsx        # Browse auctions grid
│   ├── bids.tsx             # My bids
│   ├── assets.tsx           # My assets
│   └── profile/             # Profile sub-stack
├── auction/[id]/            # Auction detail (dynamic route)
├── kyc/index.tsx            # KYC verification
└── document-viewer.tsx      # In-app document viewer
```

### Startup Sequence

The root layout (`app/_layout.tsx`, 244 lines) orchestrates a sophisticated startup:

1. Hold native splash via `preventAutoHideAsync`
2. Load custom fonts (Inter, JetBrains Mono, Space Grotesk)
3. Wait for Zustand store hydration from SecureStore
4. Resolve theme mode and apply SystemUI background color
5. Play custom branded splash (hammer strike + brand reveal, ~2s)
6. Mount navigator only after splash choreography completes
7. Wrap in `GestureHandlerRootView` + `KeyboardProvider`

### State Management

**Two Zustand stores, both persisted with SecureStore:**

| Store | Purpose | Persistence |
|-------|---------|-------------|
| `appStore` | UI state: language, theme mode, onboarding complete | `expo-secure-store` |
| `authStore` | Auth: status, tokens, user, OTP state | `expo-secure-store` |

### Shell Components

| Component | Purpose |
|-----------|---------|
| `AppHeader` | Top header bar with title, back button, action icons |
| `GoldenTabBar` | Custom glassmorphism tab bar (golden theme) |
| `BackgroundOrbs` | Decorative animated background orbs |
| `GlassCard` | Glassmorphism card component |
| `GlassSurface` | Glass surface component |
| `ScreenShell` | Standard screen wrapper |
| `LanguageSelector` | Language picker |
| `NotificationBell` | Notification icon with badge |

### Mobile vs Web Differences

| Aspect | Web (Frontend/Admin) | Mobile |
|--------|---------------------|--------|
| State persistence | In-memory (Zustand) | SecureStore (encrypted) |
| Language sync | localStorage | SecureStore + SystemUI |
| Theme | CSS variables + class toggle | JS theme objects + SystemUI |
| Navigation | React Router (URL-based) | Expo Router (file-based) |
| Auth token | In-memory (refresh on reload) | SecureStore (survives restart) |
| i18n | i18next 25 | i18next 26 + compatibilityJSON v4 |
| Shared code | `@enderass/shared` | Independent implementation |

### API Layer

Same backend endpoints as web apps, typed with TypeScript:

```typescript
// src/services/api.ts
async function apiRequest<T>(method, path, body?): Promise<T> {
  // Bearer token from authStore
  // Auto-logout on 401
  // Custom ApiError class
}
```

**Service files:** `authApi.ts`, `auctionApi.ts`, `assetApi.ts`, `bidApi.ts`, `bidDraftApi.ts`, `cpoApi.ts`, `fileUploadApi.ts`, `kycApi.ts`, `notificationApi.ts`, `paymentApi.ts`

### Custom Hooks

| Hook | Purpose |
|------|---------|
| `useBrowseAuctions` | Fetch + normalize auction list with filters |
| `useAuctionParticipation` | Auction participation status |
| `useAuctionActionGate` | Guards auction actions |
| `useMyBids` | User's bid list |
| `useMyAssets` | User's asset list |
| `useAssetDetail` | Single asset detail |
| `useNotifications` | Notification list |
| `useOtpTimer` | OTP countdown |
| `useRefreshSession` | Pull-to-refresh `/auth/me` |
| `useSubmitBidWithCpo` | Bid + CPO submission |
