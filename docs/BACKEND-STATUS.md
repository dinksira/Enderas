# Backend Status — Enderass Auction System

**Last updated:** 2026-06-25  
**Source of truth:** Code under `backend/` and `docs/enderass_auction.sql`  
**Purpose:** Technical reference for developers — what exists, what works, what is stubbed, and what is missing.

---

## 1. System Overview

### What the backend does

The backend is a REST API for the Enderass Auction Management System. It currently provides:

- **User registration and authentication** (mobile + password, OTP verification, JWT access tokens, opaque refresh token issuance)
- **Role-based access control (RBAC)** on all `/api/v1/*` domain routes
- **KYC verification** (submit, resubmit, staff review, approve/reject, audit trail, tabbed listing with stats)
- **Asset requests** (submit, CSO review, approve/reject)
- **Evaluations** (schedule, complete, approve/reject; asset status transitions)
- **Auction management** (staff CRUD, publish/suspend/reactivate/close, bidder browse)
- **Payments** (manual submission, finance approve/reject)
- **CPO** (request, staff approve/reject; bid gate)
- **Bids** (place bid with CPO/auction validation; staff invalidation)
- **Winners** (manual/auto select on auction close, confirm/decline)
- **Notifications** (in-app persistence, read/unread)
- **User & staff admin** (CRUD, status management)
- **System settings** (`system_settings` table)
- **Audit trail** (`GET /api/v1/audit-logs`)
- **Dashboard metrics & reports** (real SQL aggregations, CSV export)
- **File upload** (local disk storage via Multer)
- **Audit logging** across all domain mutations

**Still stubbed or incomplete:** `documents` module, Addis Pay integration, SMS/email delivery, refresh token endpoint, background jobs.

The full auction lifecycle is **implemented end-to-end** in code; production integrations (Addis Pay, SMS) remain phase 2.

### Tech stack

| Layer | Technology | Version / notes |
|-------|------------|-----------------|
| Runtime | Node.js (ESM, `"type": "module"`) | No `engines` field or `.nvmrc` in repo; uses `node --env-file=.env` |
| Web framework | Express | `^5.1.0` |
| ORM | Sequelize | `^6.37.7` |
| Database driver | mysql2 | `^3.14.1` |
| Cache | Redis via ioredis | `^5.6.1` — required in `.env` (`REDIS_URL`); graceful fallback for OTP and RBAC cache |
| Auth | jsonwebtoken + bcrypt | Access JWT (default 15m); refresh tokens stored hashed in DB |
| File upload | multer | In-memory buffer → local filesystem |
| i18n | i18n | Error messages via `res.__()` |
| Migrations | sequelize-cli | Migrations 016–023 in repo; base schema from SQL dump |

### Architecture pattern

**Modular monolith** with layered request handling:

```
server.js → app.js → /api → routes/index.js
                              ├── /auth  → modules/auth/   (public auth)
                              └── /v1    → routes/v1.routes.js (RBAC-protected domain API)
```

Per-request chain on `/api/v1/*` routes:

1. `authenticate` — validates Bearer JWT, attaches `req.auth` and `req.user`
2. `attachDataScope(module)` — attaches `req.dataScope` for row-level filtering (where used)
3. `authorize({ module, action })` — checks JWT-embedded permissions via policy engine
4. Optional `requireKYCVerified` — blocks non-active external users on participation endpoints
5. Controller or stub handler

RBAC logic lives in `backend/src/core/authorization/`. Business logic for implemented domains is in `backend/src/services/` and `backend/src/modules/auth/`.

**Entry points:**

| File | Role |
|------|------|
| `backend/server.js` | DB connect, HTTP listen |
| `backend/app.js` | CORS, JSON body, i18n, static `/api/uploads`, `/health`, error middleware |
| `backend/src/routes/index.js` | Mounts `/auth` and `/v1` |

---

## 2. Database

### Sequelize models (implemented in code)

Only **16 models** exist under `backend/src/models/`. The `documents` table and `auction_documents` remain unused (docs stored in `auctions.document_files` JSON).

#### `users` — `backend/src/models/user.model.js`

| Field | Type | Notes |
|-------|------|-------|
| `id` | CHAR(36) PK | UUID |
| `role_id` | CHAR(36) FK → roles | Default role on register: `bidder` |
| `user_type` | ENUM `individual`, `organization` | |
| `mobile_number` | STRING(20), unique | Login identifier |
| `email` | STRING(255), unique, nullable | |
| `password` | STRING(255) | bcrypt hash; excluded from default scope |
| `national_id_number` | STRING(50), unique, nullable | Set on KYC submit (individual) |
| `tin_number` | STRING(50), unique, nullable | Set on KYC submit (organization) |
| `first_name`, `last_name` | STRING(100), nullable | |
| `organization_name` | STRING(255), nullable | |
| `preferred_language` | ENUM `en`, `am` | Default `en` |
| `is_mobile_verified` | BOOLEAN | Set `true` after OTP |
| `is_email_verified` | BOOLEAN | Not used in flows yet |
| `status` | ENUM see below | Paranoid (`deleted_at`) |
| `last_login_at` | DATE, nullable | |
| `failed_login_attempts` | INTEGER | Incremented on bad password |
| `created_at`, `updated_at`, `deleted_at` | | Paranoid soft delete |

**`users.status` values (migration 017):**  
`pending` → `kyc_pending` → `kyc_under_review` → `active` | `kyc_rejected` | `suspended` | `deactivated`

#### `roles` — `backend/src/models/role.model.js`

| Field | Type | Notes |
|-------|------|-------|
| `id` | CHAR(36) PK | |
| `name` | STRING(100), unique | |
| `code` | STRING(50), unique | e.g. `bidder`, `super_admin` |
| `description` | TEXT | JSON string: permissions matrix |
| `is_active` | BOOLEAN | |
| `created_at`, `updated_at` | | Not paranoid |

#### `staff` — `backend/src/models/staff.model.js`

| Field | Type | Notes |
|-------|------|-------|
| `id` | CHAR(36) PK | |
| `user_id` | CHAR(36) FK → users, unique | One staff profile per user |
| `role_id` | CHAR(36) FK → roles | **Overrides** user `role_id` for RBAC |
| `employee_id` | STRING(50), unique, nullable | |
| `department` | STRING(100), nullable | |
| `is_active` | BOOLEAN | |
| `activated_at`, `deactivated_at` | DATE, nullable | |
| `created_by_staff_id` | CHAR(36), nullable | |
| `created_at`, `updated_at`, `deleted_at` | | Paranoid |

#### `refresh_tokens` — `backend/src/models/refreshToken.model.js`

| Field | Type | Notes |
|-------|------|-------|
| `id` | CHAR(36) PK | |
| `user_id` | CHAR(36) FK → users | |
| `family_id` | CHAR(36) | Token rotation family |
| `token_hash` | STRING(64), unique | SHA-256 of opaque token |
| `expires_at` | DATE | Default TTL from `JWT_REFRESH_EXPIRES_IN` (30d) |
| `revoked_at` | DATE, nullable | Not used — no refresh endpoint |
| `replaced_by` | CHAR(36), nullable | Not used |
| `ip_address` | STRING(45), nullable | |
| `user_agent` | STRING(512), nullable | |
| `created_at`, `updated_at` | | |

#### `audit_logs` — `backend/src/models/auditLog.model.js`

| Field | Type | Notes |
|-------|------|-------|
| `id` | CHAR(36) PK | |
| `user_id` | CHAR(36), nullable | |
| `staff_id` | CHAR(36), nullable | |
| `action` | STRING(100) | e.g. `LOGIN`, `APPROVE`, `ACCESS_DENIED` |
| `entity_type` | STRING(100), nullable | e.g. `KYCVerification`, `User` |
| `entity_id` | CHAR(36), nullable | |
| `ip_address` | STRING(45), nullable | |
| `user_agent` | STRING(500), nullable | |
| `old_values`, `new_values`, `metadata` | JSON, nullable | |
| `created_at` | DATE | No `updated_at` |

#### `kyc_verifications` — `backend/src/models/kyc.model.js`

| Field | Type | Notes |
|-------|------|-------|
| `id` | CHAR(36) PK | |
| `user_id` | CHAR(36) FK → users | |
| `document_type` | ENUM | `national_id`, `passport`, `driving_license`, `trade_license`, `tin_certificate`, `business_registration`, `other` |
| `document_number` | STRING(100), nullable | |
| `document_front_url`, `document_back_url` | STRING(500), nullable | Often base64 data URLs from frontend |
| `trade_license_url`, `tin_certificate_url`, `business_registration_url` | STRING(500), nullable | Organization docs |
| `status` | ENUM `pending`, `approved`, `rejected` | KYC record status (not user status) |
| `reviewed_by_staff_id` | CHAR(36) FK → staff, nullable | |
| `reviewed_at` | DATE, nullable | |
| `rejection_reason` | TEXT, nullable | |
| `review_notes` | TEXT, nullable | |
| `under_review_at` | DATE, nullable | **Migration 018** — staff “under review” tab |
| `created_at`, `updated_at`, `deleted_at` | | Paranoid |

#### `auctions` — `backend/src/models/auction.model.js` *(migration 019)*

| Field | Type | Notes |
|-------|------|-------|
| `id` | CHAR(36) PK | UUID |
| `asset_id` | CHAR(36) FK → assets, nullable | Optional after migration 019; no asset workflow yet |
| `created_by_staff_id` | CHAR(36) FK → staff | Required; staff-only creation |
| `title` | STRING(255) | |
| `category` | ENUM | `vehicles`, `machinery`, `buildings`, `land`, `equipment`, `salvage_assets`, `other_assets` |
| `description` | TEXT, nullable | |
| `auction_conditions` | TEXT, nullable | **Migration 019** |
| `image_urls` | JSON, nullable | Array of URL strings; **Migration 019** |
| `document_files` | JSON, nullable | Array of `{ name, url, size }`; **Migration 019** (not `auction_documents` table) |
| `start_date`, `end_date` | DATE | |
| `reserve_price` | DECIMAL(18,2) | |
| `document_price` | DECIMAL(18,2) | Participation document fee; default `0` |
| `cpo_percentage` | DECIMAL(5,2) | 1–100; **Migration 019** |
| `currency` | STRING(3) | Default `ETB` |
| `status` | ENUM | `draft`, `pending_approval`, `published`, `suspended`, `closed`, `cancelled` |
| `published_at`, `closed_at` | DATE, nullable | Set on publish/close |
| `created_at`, `updated_at`, `deleted_at` | | Paranoid soft delete |

**API display mapping** (`auction.service.js`): `published`→`ACTIVE`, `draft`/`pending_approval`→`PENDING`, `suspended`→`SUSPENDED`, `closed`/`cancelled`→`CLOSED`.

### Model associations — `backend/src/models/index.js`

```
User ──belongsTo──► Role
Role ──hasMany────► User

Staff ──belongsTo──► User
User ──hasOne──────► Staff (as staffProfile)

Staff ──belongsTo──► Role
Role ──hasMany──────► Staff

RefreshToken ──belongsTo──► User
User ──hasMany────────────► RefreshToken

AuditLog ──belongsTo──► User, Staff
User/Staff ──hasMany────► AuditLog

KYCVerification ──belongsTo──► User (as user)
User ──hasOne──────────────────► KYCVerification (as kycVerification)

KYCVerification ──belongsTo──► Staff (as reviewedByStaff)
Staff ──hasMany────────────────► KYCVerification (as reviewedKYCs)

Staff ──hasMany────────────────► Auction (as createdAuctions)
Auction ──belongsTo──────────────► Staff (as createdByStaff)
```

### Tables in SQL dump without Sequelize models

These tables exist in `docs/enderass_auction.sql` but have **no application code**:

| Table | Key fields (summary) |
|-------|----------------------|
| `asset_owners` | `user_id`, address fields, `status` |
| `assets` | `asset_owner_id`, `asset_type`, `title`, docs, `status` workflow |
| `evaluations` | `asset_id`, valuation, `status` workflow |
| `auction_documents` | `auction_id`, `file_url`, download tracking — **unused**; docs stored in `auctions.document_files` JSON |
| `bids` | `auction_id`, `user_id`, `amount`, `status` — counted via raw SQL in auction list/detail only |
| `cpos` | Certificate of Participation — `user_id`, `auction_id`, `document_url` |
| `payments` | `user_id`, `auction_id`, `payment_method`, `status` |
| `winners` | `auction_id`, `bid_id`, `user_id`, `status` |
| `notifications` | `user_id`, `type`, `channel`, `status` |

### Migration history

| Migration | File | What it does |
|-----------|------|--------------|
| — | *(base)* | Full schema from `docs/enderass_auction.sql` (manual import or seed) |
| 016 | `migrations/016_create_refresh_tokens.cjs` | Creates `refresh_tokens` table + indexes |
| 017 | `migrations/017_update_user_status_enum.cjs` | Extends `users.status` with KYC states |
| 018 | `migrations/018_add_kyc_under_review_at.cjs` | Adds `kyc_verifications.under_review_at` |
| 019 | `migrations/019_extend_auctions_table.cjs` | Makes `auctions.asset_id` nullable; adds `category`, `cpo_percentage`, `auction_conditions`, `image_urls`, `document_files` |

**Current state:** Run `npm run db:migrate` in `backend/` to apply 016–019. Fresh installs need the SQL dump **plus** migrations.

### Known schema issues

| Issue | Detail |
|-------|--------|
| SQL dump out of date | `docs/enderass_auction.sql` predates migrations 017–019 (`users.status`, KYC columns, auction extensions) |
| No Sequelize models for most domain tables | Assets, bids (as model), payments, etc. cannot be managed from app code |
| `refresh_tokens` unused for rotation | Tokens are **created** on login/OTP but no `/refresh` endpoint validates or rotates them |
| Bidder KYC + asset request permissions in seed | Base `roles` seed includes `kyc` + `assets` for `bidder` (v3). Existing DBs: `docs/fix-bidder-asset-permissions.sql` or migration `020_grant_bidder_asset_permissions.cjs` |
| CSO role routes incomplete | `customer_service_officer` seed lacks new KYC routes (`GET /kyc/:id`, audit, mark-under-review) |
| Document URLs as VARCHAR(500) | Base64 data URLs from frontend can exceed 500 chars |
| `submitKYC` allows duplicate submissions | No guard preventing a second `KYCVerification` row for same user |
| `markKYCUnderReview` / approve / reject | Require `req.user.staffId`; non-staff principals with permission would pass auth but write `staff_id: null` |

---

## 3. Implemented Modules

| Module | Status | Location | What works | What doesn't |
|--------|--------|----------|------------|--------------|
| **Auth** | **Complete** (no refresh route) | `backend/src/modules/auth/` | Register, login, OTP verify/resend, JWT + refresh token issuance, audit on login | No `POST /refresh` or logout; refresh tokens never validated; no SMS OTP delivery |
| **RBAC** | **Complete** | `backend/src/core/authorization/` | JWT permission embedding, `authorize()` middleware, policy engine, L1 + Redis cache, access map, data scope hooks | `invalidateRolePermissionCache` needs live Redis; file routes skip `authorize()` |
| **KYC** | **Complete** (staff UX gaps in roles seed) | `services/kyc.service.js`, `controllers/kyc.controller.js` | Full submit/review flow, tabs/stats, audit trail, duplicate ID checks | Notifications stub; no file size validation on URLs; CSO role may lack new route grants |
| **File upload** | **Partial** | `controllers/fileUpload.controller.js`, `integrations/fileStorage.integration.js` | Local upload/delete, type/size limits | Auth only — no FILES module RBAC; only `local` provider |
| **Audit** | **Partial** | `services/audit.service.js` | Writes to `audit_logs`; failures logged, not thrown | Not wired to stub domain approve/reject handlers |
| **Users** | **Stub** | `v1.routes.js` + `resource-handlers.util.js` | RBAC + data scope on list | Returns empty `items: []` |
| **Assets** | **Complete** (submission + CSO review; no evaluation link) | `services/asset.service.js`, `controllers/asset.controller.js`, `models/asset.model.js`, `models/assetOwner.model.js` | Submit, list, detail, update (pending), approve/reject; auto-create asset_owner; audit + notification stubs | No evaluation workflow; no DELETE endpoint; notifications not persisted |
| **Evaluations** | **Stub** | same | RBAC on all verbs | No DB operations |
| **Auctions** | **Complete** (staff CRUD + lifecycle; no asset/bid integration) | `services/auction.service.js`, `controllers/auction.controller.js`, `models/auction.model.js` | Create/list/detail/update/delete; publish/suspend/reactivate/close; validation; audit logs; bid count via raw SQL | `attachDataScope` on routes but **not applied** in service queries; no asset FK validation; `auction_documents` table unused; `AUDIT_ACTIONS.CLOSE` undefined (close audit writes `undefined` action); `DELETE` route missing from `access-map.js` |
| **Documents** | **Stub** | same | RBAC + KYC gate on create | No DB operations |
| **Payments** | **Stub** | same | RBAC + KYC gate on create | No DB operations; no Addis Pay integration |
| **CPO** | **Stub** | same | RBAC + KYC gate on create | No DB operations |
| **Bids** | **Stub** | same | RBAC + KYC gate on create | No DB operations; no real-time bidding |
| **Winners** | **Stub** | same | RBAC + KYC gate on create | No DB operations |
| **Notifications** | **Stub** | same | RBAC on list | Returns empty list; `notification.service.js` only `console.info` |
| **Dashboard** | **Stub** | inline in `v1.routes.js` | RBAC | Returns `{}` metrics / `[]` reports |
| **Staff** | **Stub** | resource handlers | RBAC | No CRUD implementation |
| **Roles** | **Stub** | resource handlers | RBAC | No update implementation despite `PUT` route |
| **Settings** | **Stub** | inline handlers | RBAC | Returns empty settings object |

---

## 4. API Endpoints

Base URL: `http://localhost:3000` (configurable via `PORT`).

### Public / health

| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| GET | `/health` | No | — | `{ success: true, status: 'ok' }` |
| GET | `/api/uploads/*` | No | — | Static files from `STORAGE_UPLOAD_DIR` |

### Auth — `backend/src/modules/auth/auth.routes.js` → `/api/auth`

| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| POST | `/api/auth/login` | No | — | Mobile + password login; returns access + refresh tokens |
| POST | `/api/auth/register` | No | — | Creates user (`status: pending`), sends OTP |
| POST | `/api/auth/verify-otp` | No | — | Verifies OTP, sets `kyc_pending`, returns full login session |
| POST | `/api/auth/resend-otp` | No | — | Regenerates OTP for registered mobile |

### Session — `/api/v1/auth`

| Method | Path | Auth | Module / Action | Description |
|--------|------|------|-----------------|-------------|
| GET | `/api/v1/auth/me` | Bearer | *(none)* | Fresh principal + permissions from DB/cache |
| GET | `/api/v1/auth/navigation` | Bearer | *(none)* | Permission-filtered `PAGE_ACCESS_REGISTRY` items |

### Files — `backend/src/routes/fileUpload.routes.js` → `/api/v1/files`

| Method | Path | Auth | RBAC | Description |
|--------|------|------|------|-------------|
| POST | `/api/v1/files` | Bearer | **Not enforced** (access map defines FILES/create but route omits `authorize`) | Single file upload (field: `file`) |
| POST | `/api/v1/files/multiple` | Bearer | **Not enforced** | Up to 10 files (field: `files`) |
| DELETE | `/api/v1/files/:filePath` | Bearer | **Not enforced** | Delete file by path |

### KYC — `/api/v1/kyc`

| Method | Path | Auth | Module / Action | Extra gate | Description |
|--------|------|------|-----------------|------------|-------------|
| POST | `/api/v1/kyc` | Bearer | kyc / create | — | Submit KYC documents |
| GET | `/api/v1/kyc/my` | Bearer | kyc / read | — | Current user's latest KYC |
| POST | `/api/v1/kyc/resubmit` | Bearer | kyc / update | — | Resubmit after rejection |
| GET | `/api/v1/kyc` | Bearer | kyc / read | Data scope | Staff list with pagination, tab, search, stats |
| GET | `/api/v1/kyc/:id` | Bearer | kyc / read | Data scope | KYC detail with user + reviewer |
| GET | `/api/v1/kyc/:id/audit` | Bearer | kyc / read | Data scope | Audit trail for KYC entity |
| POST | `/api/v1/kyc/:id/mark-under-review` | Bearer | kyc / update | — | Sets `under_review_at`, user → `kyc_under_review` |
| POST | `/api/v1/kyc/:id/approve` | Bearer | kyc / approve | — | Approve KYC, user → `active` |
| POST | `/api/v1/kyc/:id/reject` | Bearer | kyc / reject | — | Reject with `rejectionReason`, user → `kyc_rejected` |

### Auctions — `/api/v1/auctions` *(real implementation)*

**Files:** `controllers/auction.controller.js`, `services/auction.service.js`

| Method | Path | Auth | Module / Action | Description |
|--------|------|------|-----------------|-------------|
| GET | `/api/v1/auctions` | Bearer | auctions / read | List auctions; query `status` (ACTIVE/PENDING/SUSPENDED/CLOSED), `search` |
| GET | `/api/v1/auctions/:id` | Bearer | auctions / read | Detail with creator name, bid count, formatted dates |
| POST | `/api/v1/auctions` | Bearer | auctions / create | Create auction (**requires `staffId`**); status → `pending_approval` |
| PUT | `/api/v1/auctions/:id` | Bearer | auctions / update | Update when status is `draft`, `pending_approval`, or `suspended` |
| DELETE | `/api/v1/auctions/:id` | Bearer | auctions / delete | Soft-delete (same editable statuses) |
| POST | `/api/v1/auctions/:id/publish` | Bearer | auctions / publish | `draft` or `pending_approval` → `published` |
| POST | `/api/v1/auctions/:id/suspend` | Bearer | auctions / update | → `suspended` |
| POST | `/api/v1/auctions/:id/reactivate` | Bearer | auctions / update | `suspended` → `published` |
| POST | `/api/v1/auctions/:id/close` | Bearer | auctions / close | `published` or `suspended` → `closed` |

**Create payload (camelCase):** `title`, `category`, `description`, `auctionConditions`, `startDate`, `endDate`, `reservePrice`, `documentFee`, `cpoPercentage`, `imageUrls[]`, `documents[]` (`{ name, url, size }`), optional `assetId`.

**Response fields (summary):** `id`, `title`, `category`, `categoryKey`, `status` (display), `dbStatus`, `imageUrls`, `documents`, `reservePrice`, `documentFee`, `cpoPercentage`, `bids`/`bidCount`, `createdByName`, formatted date fields.

### Stub resources — `/api/v1/*` (all require Bearer + module permission)

Generated by `createResourceHandlers()` unless noted. Responses are placeholders (`items: []`, `{ created: true }`, etc.).

| Resource | Methods | KYC gate on POST | Approve / reject / other |
|----------|---------|------------------|--------------------------|
| `/users` | GET, GET/:id, POST, PUT/:id, DELETE/:id | No | — |
| `/assets` | CRUD + POST `/:id/approve`, `/:id/reject` | **Yes** on POST | Stub approve/reject |
| `/evaluations` | GET, GET/:id, POST, PUT/:id + approve/reject | No | Stub |
| `/documents` | GET, POST | **Yes** on POST | — |
| `/payments` | GET, GET/:id, POST + approve/reject | **Yes** on POST | Stub |
| `/cpo` | GET, POST + approve/reject | **Yes** on POST | Stub |
| `/bids` | GET, GET `/my`, GET `/auction/:auctionId`, POST | **Yes** on POST | Stub |
| `/winners` | GET, GET/:id, POST | **Yes** on POST | — |
| `/notifications` | GET, GET/:id | No | — |
| `/staff` | Full CRUD stub | No | — |
| `/roles` | GET, GET/:id, PUT/:id | No | PUT stub only |
| `/dashboard` | GET | No | Returns `{ metrics: {} }` |
| `/dashboard/reports` | GET | No | Returns `{ reports: [] }` |
| `/dashboard/reports/export` | GET (export action) | No | Returns `{ exportUrl: null }` |
| `/settings` | GET, PUT | No | Empty settings stub |

**403 response shape:** `{ success: false, code: 'ACCESS_DENIED', message: '...', error: { type: 'AUTHORIZATION_ERROR', module, action } }`

---

## 5. Authentication System

### Registration

**Route:** `POST /api/auth/register`  
**Validation:** `backend/src/modules/auth/auth.validation.js`  
**Service:** `auth.service.js` → `register()`

1. Validates mobile (required), password (≥6 chars), `firstName` (individual) or `organizationName` (organization).
2. Rejects duplicate `mobile_number` (`DUPLICATE_MOBILE`).
3. Assigns active `bidder` role from `roles` table.
4. Creates user with `status: pending`, `is_mobile_verified: false`.
5. Hashes password (bcrypt).
6. Generates 6-digit OTP, stores in Redis (or in-memory fallback).
7. Logs OTP to console in non-production (no SMS integration).
8. Writes audit log (`CREATE` on `User`).

### OTP

| Constant | Value |
|----------|-------|
| TTL | 300 seconds (`OTP_TTL_SECONDS`) |
| Redis key | `otp:{normalized_mobile}` |
| Storage | `withRedis()` → `SETEX`; fallback: `otpMemoryFallback` Map in process memory |

**Verify:** `POST /api/auth/verify-otp` — on success: `is_mobile_verified: true`, `status: kyc_pending`, then `completeLogin()` (full session).

**Resend:** `POST /api/auth/resend-otp` — regenerates OTP for existing user.

### JWT access tokens

**Created by:** `createAccessToken()` in `backend/src/middleware/auth.middleware.js`  
**Config:** `JWT_ACCESS_SECRET`, `JWT_ACCESS_EXPIRES_IN` (default `15m`)

**Payload structure:**

- `sub` — user ID  
- `sid` — session ID  
- `jti` — token ID  
- `identity` — user profile fields (status, displayName, isStaff, etc.)  
- `authz` — `roleId`, `roleCode`, `permVersion`, `permChecksum`, `wildcard`, `modules[]`, `actions[]`, `routes[]`

Permissions are **snapshotted at login** into the JWT. Role changes do not affect an existing token until re-login or `/auth/me` refresh.

### Refresh tokens

**Issued on:** login and OTP verify via `issueRefreshToken()`  
**Storage:** `refresh_tokens` table — opaque 48-byte token, SHA-256 hash stored  
**Expiry:** `JWT_REFRESH_EXPIRES_IN` (default `30d`)

**Missing:** There is **no** `POST /api/auth/refresh` (or similar) to exchange a refresh token for a new access token. `revoked_at` and `replaced_by` columns are unused. If `refresh_tokens` table is missing, issuance is skipped with a warning and `refreshToken: null` is returned.

### Sessions

- Session ID (`sid`) is embedded in the access JWT.
- Refresh token family ID is generated per login but not used for rotation.
- No server-side session store beyond `refresh_tokens` rows.
- No logout endpoint (no token revocation API).

### Redis dependency and fallback

| Use case | Redis required? | Fallback when unavailable |
|----------|-------------------|---------------------------|
| OTP store/verify | Preferred | In-memory `Map` per process (`otpMemoryFallback`) — **not shared across instances** |
| RBAC user cache | Preferred | L1 in-process cache + direct DB read (`user-permission.service.js`) |
| RBAC role cache | Preferred | L1 cache + DB read (`permission.service.js`) |
| Role invalidation pub/sub | Yes for multi-instance | `withRedis` logs warning; cache may be stale |
| `invalidateRolePermissionCache()` | **Hard dependency** | Calls `getRedisClient()` directly — **will throw** if Redis down |

**Log pattern when Redis is down:** `[redis] cache bypassed: ...` or `[redis] client error: ...`

`REDIS_URL` is **required** at startup (`env.config.js`) even though many paths degrade gracefully.

---

## 6. KYC System

### User status flow (implemented)

```
register → pending
verify OTP → kyc_pending
submit KYC → kyc_under_review (user) + kyc record status pending
staff mark-under-review → kyc_under_review (sets under_review_at on record)
approve → active (user) + approved (kyc)
reject → kyc_rejected (user) + rejected (kyc)
resubmit (after reject) → kyc_under_review (user) + pending (kyc, clears review fields)
```

### KYC record tab logic (`listKYCs`)

| Tab | WHERE clause |
|-----|--------------|
| `all` | *(none)* |
| `pending` | `status = pending` AND `under_review_at IS NULL` |
| `under_review` | `status = pending` AND `under_review_at IS NOT NULL` |
| `approved` | `status = approved` |
| `rejected` | `status = rejected` |

Query params: `page`, `limit`, `tab`, `status`, `userType`, `search`, `dateFrom`, `dateTo`, `includeStats=true`.

### Individual vs organization validation

| User type | Required fields |
|-----------|-----------------|
| `individual` | `document_front_url`, `document_number` |
| `organization` | `trade_license_url`, `tin_certificate_url`, `business_registration_url` |

Duplicate `national_id_number` / `tin_number` checked against `users` table.

### KYC gate (`requireKYCVerified`)

Applied on POST: `/assets`, `/documents`, `/payments`, `/cpo`, `/bids`, `/winners`.

Staff (`req.user.isStaff`) bypass. External users need `users.status === active`.

### Known KYC gaps

| Gap | Detail |
|-----|--------|
| No real notifications | `notification.service.js` logs only |
| Bidder role seed | May lack `kyc` module until `docs/fix-kyc-role-permissions.sql` is applied |
| CSO role seed | Missing `GET /kyc/:id`, audit, mark-under-review in `routes` grant list |
| Document storage | URLs stored as strings; no integration with `/files` upload in KYC service |
| No `under_review` KYC status enum | Uses `pending` + `under_review_at` timestamp instead |
| Approve without mark-under-review | Allowed — `under_review_at` not required for approve |
| Multiple KYC rows | `submitKYC` always creates new row; no “already submitted” guard |

---

## 7. RBAC System

### How it works

1. Permissions are stored as JSON in `roles.description` (`permissions.modules`, `permissions.actions`, `permissions.routes`).
2. Effective role = `COALESCE(staff.role_id, users.role_id)` when staff is active.
3. On login, `getUserPermissions()` resolves matrix → embedded in JWT `authz` block.
4. `authorize({ module, action })` calls `policyEngine.hasPermission()` against JWT capabilities.
5. `super_admin` or `modules/actions/routes: ["*"]` → wildcard (all access).

**Evaluation:** `backend/src/utils/permission-eval.util.js` — module AND action must both be in granted lists (unless wildcard).

### Access map

**File:** `backend/src/core/authorization/access-map.js`

- `API_ACCESS_MAP` — HTTP method + path → `{ module, action }`
- `PAGE_ACCESS_REGISTRY` — frontend routes for navigation manifest
- `DATA_SCOPE_RULES` — row-level scope per module
- `resolveApiAccess(method, path)` — pattern match for `:id` params

`authorizeFromRoute()` exists but is **not** mounted globally; routes use explicit `authorize({ module, action })`.

### Data scope rules

| Module | Rule | Behavior |
|--------|------|----------|
| `bids` | `own_user` | Non-staff: filter `user_id` |
| `assets` | `own_asset_owner` | Non-staff: `asset_owner_user_id` |
| `payments` | `own_user_or_finance` | Staff sees all |
| `cpo` | `own_user_or_staff` | Staff sees all |
| `notifications` | `own_user` | Own rows only |
| `evaluations`, `auctions`, `winners`, `kyc`, `users` | `staff_module` | Staff: all; external: own `user_id` |
| *(default)* | — | Staff: all; external: own `user_id` |

Stub handlers return `scope` in response but do not query DB with it.

### Roles and access (from `docs/enderass_auction.sql` seed)

| Role code | Modules | Actions | Notes |
|-----------|---------|---------|-------|
| `super_admin` | `*` | `*` | Wildcard; full access |
| `auction_manager` | auctions, assets, documents, bids, winners, cpo, dashboard | create, read, update, delete, approve, reject, publish, close | |
| `evaluation_officer` | evaluations, assets, dashboard | create, read, update, delete, approve, reject, publish, close | |
| `finance_officer` | payments, dashboard | read, approve, reject, export | |
| `customer_service_officer` | users, kyc, assets, cpo, dashboard | read, approve, reject, update | KYC list/approve/reject only in seed routes |
| `bidder` | bids, payments, cpo, notifications, kyc, assets | create, read, update | All registered users (individual + organization); run `docs/fix-bidder-asset-permissions.sql` on existing DBs |
| `asset_owner` | assets, payments | create, read, update | **Needs** fix SQL for KYC |

Staff users must have `users.status === active`. External users blocked only for `suspended` / `deactivated`.

### Legacy middleware

`backend/src/middleware/checkPermission.middleware.js` — older `checkPermission()` / `checkRoutePermission()`; **not used** by `v1.routes.js` (superseded by `core/authorization/authorization.middleware.js`).

---

## 8. Services

| File | Purpose | Status |
|------|---------|--------|
| `services/kyc.service.js` | KYC business logic, status constants, duplicate checks, list/stats/audit | **Complete** |
| `services/auction.service.js` | Auction CRUD, status transitions, validation, serialization, bid counts (raw SQL) | **Complete** (no asset/bid domain integration) |
| `services/asset.service.js` | Asset submission, owner scoping, CSO approve/reject, serialization | **Complete** (no evaluation integration) |
| `services/audit.service.js` | `writeAuditLog`, login/deny/approval helpers | **Complete** (failures swallowed; missing `CLOSE` action constant) |
| `services/notification.service.js` | KYC event notifications | **Stub** — `console.info` only |
| `services/user-permission.service.js` | Resolve user RBAC from DB; L1 + Redis cache | **Complete** |
| `services/permission.service.js` | Role permission cache; Redis subscriber for invalidation | **Complete** (Redis optional for read) |
| `services/data-scope.service.js` | `buildDataScopeWhere()` for row-level filters | **Complete** (consumers are stubs) |
| `services/fileStorage.service.js` | Validates type/size, delegates to integration | **Complete** |
| `core/authorization/permission.service.js` | Facade: `resolvePrincipal`, `buildPermissionContext` | **Complete** |
| `core/authorization/role.service.js` | Role lookup by id/code | **Complete** |
| `core/authorization/permission-cache.js` | L1 principal cache wrapper | **Complete** |
| `modules/auth/auth.service.js` | Login, register, OTP, identity aggregation, token issuance | **Complete** (no refresh route) |
| `integrations/fileStorage.integration.js` | Local filesystem provider | **Complete** (`local` only) |
| `utils/resource-handlers.util.js` | Stub CRUD factory for unimplemented domains | **Stub** |

**No files in:** `backend/src/jobs/` (empty / absent).

---

## 9. Known Issues & Bugs

| Issue | Severity | Detail |
|-------|----------|--------|
| Redis unavailable | Medium | OTP falls back to in-memory (single-instance only). RBAC reads fall back to DB. `invalidateRolePermissionCache()` crashes without Redis. |
| No refresh token endpoint | High | Refresh tokens issued but never validated; clients must re-login when access JWT expires. |
| Migration 018 not applied | High (fixed if migrated) | `GET /api/v1/kyc` returned 500: `Unknown column 'under_review_at'`. Run `npm run db:migrate`. |
| EagerLoadingError (historical) | Fixed | Was `User is not associated to KYCVerification`; fixed via `User.hasOne(KYCVerification)` in `models/index.js`. |
| Bidder cannot submit KYC (seed) | High | Base role seed lacks `kyc` module — 403 on `POST /api/v1/kyc`. Apply `docs/fix-kyc-role-permissions.sql`. |
| CSO missing new KYC routes | Medium | `customer_service_officer` seed may 403 on detail/audit/mark-under-review until role JSON updated. |
| File routes skip RBAC | Medium | Any authenticated user can upload/delete files. |
| `REDIS_URL` required at boot | Low | App won't start without it in `.env` even though runtime degrades. |
| Notifications not delivered | Low | No SMS/email/in-app persistence. |
| Document URL length | Medium | VARCHAR(500) may truncate base64 document payloads. |
| Duplicate KYC submissions | Low | Multiple pending rows possible per user. |
| `markKYCUnderReview` without staffId | Low | No validation that caller is staff; `staffId` may be null in audit. |
| Login blocks `pending` users | By design | Password login requires status in `LOGIN_ALLOWED_STATUSES` (excludes `pending`). |
| SQL dump schema drift | Medium | `enderass_auction.sql` predates migrations 017–019. |
| Most domain tables orphaned | High | Assets, bids (placement), payments, winners, etc. have no application logic; auctions table is implemented. |
| Auction close audit action | Low | `closeAuction` uses `AUDIT_ACTIONS.CLOSE` but constant not defined in `audit.service.js`. |
| Auction DELETE not in access map | Low | `DELETE /api/v1/auctions/:id` works via explicit `authorize()` but missing from `API_ACCESS_MAP`. |
| Auction data scope unused | Low | `attachDataScope(MODULES.AUCTIONS)` on routes; service does not filter by `req.dataScope`. |
| No integration tests for KYC/API | Low | Only `tests/rbac.policy.test.js` (4 policy engine tests). |

---

## 10. What's Missing / Next Steps

### Critical path (SRS core)

1. **Refresh token flow** — `POST /api/auth/refresh`, rotation, revocation, logout.
2. **Sequelize models + services** for remaining domains: `assets`, `asset_owners`, `evaluations`, `bids`, `payments`, `cpos`, `winners`, `notifications`, `auction_documents` (or keep JSON docs pattern).
3. **Replace stub handlers** in `v1.routes.js` for non-auction domains.
4. **SMS OTP provider** (or configurable notification channel) for production registration.
5. **Apply role permission fixes** — `docs/fix-kyc-role-permissions.sql` + update CSO role for new KYC endpoints.

### Auction domain

**Implemented:**
- Staff auction CRUD with JSON image/document storage (migration 019)
- Publish, suspend, reactivate, close lifecycle
- List filtering by display status + search
- Frontend super-admin dashboard wired to real API

**Still missing:**
- Asset submission and staff approval workflow (optional `asset_id` only)
- Physical evaluation scheduling and completion
- Real-time or polling-based bidding with validation
- CPO (Certificate of Participation) document workflow
- Payment recording and finance officer verification (Addis Pay per SRS)
- Winner selection and notification
- Scheduled auto-close on `end_date`
- In-app notification persistence (`notifications` table)

### Infrastructure & quality

- Align `docs/enderass_auction.sql` with migrations 017–019 (or generate from live DB).  
- Add `authorize()` to file upload routes.  
- Add Sequelize migrations for all base tables (not only 016–019).  
- Redis optional startup or health check endpoint reporting cache status.  
- Integration/E2E tests for auth and KYC flows.  
- Background jobs (`src/jobs/`) for auction close, notification dispatch.  
- Email verification flow (`is_email_verified` unused).  
- Account lockout policy beyond `failed_login_attempts` counter.

### Suggested build order

1. Refresh tokens + role permission SQL fixes  
2. Assets + asset owners (enables owner onboarding)  
3. Evaluations → link auctions to assets  
4. Bids + CPO + Payments  
5. Winners + Notifications  
6. Dashboard metrics (real aggregations)  
7. Staff/roles CRUD (admin tooling); auction audit/access-map fixes (`CLOSE` action, DELETE in map)

---

## Appendix: Key file index

| Area | Path |
|------|------|
| Server entry | `backend/server.js` |
| Express app | `backend/app.js` |
| V1 routes | `backend/src/routes/v1.routes.js` |
| Auth module | `backend/src/modules/auth/` |
| KYC controller | `backend/src/controllers/kyc.controller.js` |
| Auction controller | `backend/src/controllers/auction.controller.js` |
| Auction service | `backend/src/services/auction.service.js` |
| Auction model | `backend/src/models/auction.model.js` |
| RBAC core | `backend/src/core/authorization/` |
| Access map | `backend/src/core/authorization/access-map.js` |
| Env config | `backend/src/config/env.config.js` |
| DB schema dump | `docs/enderass_auction.sql` |
| Migrations | `backend/migrations/016–019` |
| RBAC docs | `docs/RBAC-IMPLEMENTATION.md` |
| KYC role fix SQL | `docs/fix-kyc-role-permissions.sql` |

---

*This document reflects the codebase as of 2026-06-24 (includes auction module implementation). Re-verify after schema migrations or major refactors.*
