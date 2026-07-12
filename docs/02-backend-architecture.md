# Backend Architecture

## Framework & Runtime

| Aspect | Detail |
|--------|--------|
| Runtime | Node.js (ES Modules, `"type": "module"`) |
| Framework | Express 5.1.0 |
| Language | JavaScript (no TypeScript) |
| Entry | `server.js` → `app.js` |
| Dev mode | `node --watch server.js` |

**Key files:**
- `server.js` — Entry point: authenticates DB, starts auto-close job, listens on port
- `app.js` — Express app setup: CORS, JSON parsing, i18n, static uploads, routes, error middleware

## Database

| Aspect | Detail |
|--------|--------|
| Engine | MySQL |
| ORM | Sequelize 6.37.7 |
| Driver | mysql2 3.14.1 |
| Primary keys | UUID (CHAR(36)) |
| Soft deletes | Yes (`paranoid: true`, `deleted_at` column) |
| Naming | `underscored: true` (snake_case columns) |

**Connection pooling:**
```
max: 20, min: 2, acquire: 30s, idle: 10s
```

**Production SSL:**
```js
dialectOptions: { ssl: { rejectUnauthorized: false } }
```

**Key files:**
- `src/config/db.config.js` — Sequelize instance, pool config, SSL
- `.sequelizerc` — CLI path mappings
- `migrations/001_initial_schema.cjs` — Unified schema (23 tables, indexes, constraints, seed data)

### Tables

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `roles` | Role definitions with permission JSON | `id`, `name`, `code`, `description` (JSON) |
| `users` | User accounts | `role_id`, `user_type`, `mobile_number`, `status` (7 states) |
| `asset_owners` | Owner profiles | `user_id` (unique), address fields |
| `staff` | Staff profiles | `user_id`, `role_id`, `employee_id`, `department` |
| `kyc_verifications` | KYC submissions | `user_id`, `document_type`, `status`, `reviewed_by_staff_id` |
| `assets` | Registered assets | `asset_owner_id`, `asset_type`, `status` (7 states) |
| `evaluations` | Asset valuations | `asset_id` (unique), `valuation_amount`, `status` |
| `auctions` | Auction configs | `title`, `category`, `start_date`, `end_date`, `reserve_price`, `auction_mode` |
| `lots` | Lot groupings | `auction_id`, `title`, `sort_order` |
| `auction_assets` | Auction-asset junction | `auction_id`, `asset_id`, `lot_id`, `reserve_price` |
| `auction_documents` | Uploaded docs | `auction_id`, `file_url`, `mime_type` |
| `bids` | Submitted bids | `auction_id`, `user_id`, `amount`, `status` |
| `bid_drafts` | Saved bid drafts | `user_id`, `auction_id`, `amount`, `status` |
| `cpos` | Payment obligations | `user_id`, `auction_id`, `status`, `refund_status` |
| `cpo_payments` | CPO payments | `cpo_id`, `amount`, `payment_method` |
| `payments` | Document payments | `user_id`, `auction_id`, `amount`, `status` |
| `winners` | Auction winners | `auction_id`, `bid_id`, `user_id`, `status` |
| `organization_auctions` | Org-auction link | `organization_user_id`, `auction_id` |
| `auction_share_links` | Share links | `auction_id`, `token` (unique), `password_hash` |
| `notifications` | In-app notifications | `user_id`, `type`, `channel`, `status` |
| `audit_logs` | Audit trail | `user_id`, `staff_id`, `action`, `entity_type` |
| `refresh_tokens` | JWT refresh tokens | `user_id`, `family_id`, `token_hash` |
| `system_settings` | Global config | `setting_key` (unique), `setting_value` (JSON) |

## Authentication

| Aspect | Detail |
|--------|--------|
| Algorithm | HS256 |
| Access token TTL | 15 minutes (configurable) |
| Refresh token TTL | 30 days |
| Refresh storage | Database (`refresh_tokens` table) |
| Token rotation | Family-based (detects reuse) |
| Password hashing | bcrypt (12 rounds) |

**JWT payload structure:**
```json
{
  "sub": "user-uuid",
  "sid": "session-id",
  "jti": "token-id",
  "identity": {
    "userId", "staffId", "roleId", "roleCode",
    "userType", "displayName", "mobileNumber", "isStaff"
  },
  "authz": {
    "roleId", "roleCode", "permVersion",
    "modules": ["*"],
    "actions": ["create", "read", "update", "delete"],
    "routes": ["*"],
    "moduleActions": {},
    "wildcard": true
  }
}
```

**Auth flow:**
1. Login with mobile number + password
2. If mobile unverified → OTP verification required
3. Access token + refresh token issued
4. Access token carried as `Authorization: Bearer <token>`
5. Refresh token rotation on each use (old token revoked)
6. Family-based reuse detection (revokes entire family on stolen token)

**Key files:**
- `src/modules/auth/auth.service.js` — Login, register, OTP, password reset
- `src/modules/auth/auth.controller.js` — Request handlers
- `src/utils/jwt.util.js` — Token sign/verify
- `src/middleware/auth.middleware.js` — `authenticate`, `optionalAuthenticate`

## RBAC Engine

### Roles

| Role | Code | Access Level |
|------|------|-------------|
| Super Administrator | `super_admin` | Full wildcard access |
| Auction Manager | `auction_manager` | Auctions, assets, documents, bids, winners, CPO, orgs |
| Evaluation Officer | `evaluation_officer` | Evaluations, assets (read-only) |
| Finance Officer | `finance_officer` | Payments, dashboard, reports |
| Customer Service Officer | `customer_service_officer` | Users, KYC, assets, CPO, evaluations, orgs |
| Bidder | `bidder` | Bids, payments, CPO, KYC, assets |
| Asset Owner | `asset_owner` | Assets, payments (disabled by default) |

### Permission Schema

Permissions are stored in the `roles.description` JSON field:

```json
{
  "summary": "Role description",
  "permissions": {
    "modules": ["auctions", "assets"],
    "actions": ["create", "read", "update"],
    "moduleActions": {
      "assets": ["read"],
      "auctions": ["create", "read", "update", "delete"]
    },
    "routes": [
      "GET /api/v1/auctions",
      "POST /api/v1/auctions"
    ]
  },
  "permissionVersion": 7
}
```

### Permission Evaluation

Three-level check in `src/utils/permission-eval.util.js`:

1. **Wildcard** — `super_admin` or `"*"` in modules → full access
2. **Module + Action** — Check `moduleActions[module]` or fallback to `actions[]`
3. **Route** — Check explicit route grants in `routes[]`

### Data Scoping

Row-level filtering via `src/services/data-scope.service.js`:

| Scope Rule | Effect |
|-----------|--------|
| `own_user` | Only own user records |
| `own_asset_owner` | Only own asset owner profile |
| `own_user_or_finance` | Own records + finance view |
| `own_user_or_staff` | Own records + staff view |
| `staff_module` | Full module access for staff |

### Caching

Two-layer cache with Redis Pub/Sub invalidation:

| Cache | TTL | Key Pattern |
|-------|-----|-------------|
| Role permissions (L1) | 60s | In-memory Map |
| Role permissions (L2) | 24h | `rbac:role:{roleId}:{version}` |
| User permissions (L1) | 60s | In-memory Map |
| User permissions (L2) | 5min | `rbac:user:{userId}:{version}` |
| Principal (L1 only) | 60s | In-memory Map |

Invalidation flow:
1. Role/permission change → increment version pointer
2. Delete versioned cache keys
3. Publish `rbac:invalidate` message on Redis Pub/Sub
4. All instances receive and clear their L1 caches

**Key files:**
- `src/core/authorization/policy.engine.js` — Permission evaluation facade
- `src/core/authorization/permission.service.js` — Principal resolution
- `src/core/authorization/permission-cache.js` — L1 cache
- `src/services/permission.service.js` — L1 + L2 role permission cache
- `src/services/user-permission.service.js` — L1 + L2 user permission cache
- `src/schemas/permission.schema.js` — Role description parser/normalizer

## API Structure

### Route Organization

```
/api
├── /auth              # Authentication (login, register, OTP, password)
├── /public            # Public landing page data
├── /track             # Public auction tracking
└── /v1                # All authenticated endpoints
    ├── /assets
    ├── /auctions
    ├── /bids
    ├── /bid-drafts
    ├── /cpo
    ├── /documents
    ├── /evaluations
    ├── /files
    ├── /kyc
    ├── /notifications
    ├── /organizations
    ├── /payments
    ├── /roles
    ├── /settings
    ├── /share-links
    ├── /staff
    ├── /users
    └── /winners
```

### Middleware Chain Pattern

Each route follows a consistent middleware chain:

```
authenticate → attachDataScope(module) → authorize({module, action}) → [guards] → controller
```

Example from `v1.routes.js`:
```js
router.get('/auctions',
  authenticate,
  attachDataScope('auctions'),
  authorize({ module: 'auctions', action: 'read' }),
  auctionController.list
);
```

### Error Handling

Centralized error handler in `src/middleware/error.middleware.js`:
- `AppError` — Custom application errors with status codes
- `ValidationError` — Request validation failures
- `MulterError` — File upload errors
- `SequelizeError` — Database constraint violations

All responses use `sendSuccess()` / `sendError()` from `src/utils/response.util.js`.

## File Storage

| Aspect | Detail |
|--------|--------|
| Provider | Local filesystem (only) |
| Max size | 5MB |
| Allowed types | JPEG, PNG, GIF, PDF, DOC, DOCX |
| Upload dir | `uploads/` |
| URL pattern | `/api/uploads/{folder}/{uuid}.{ext}` |

**Upload directories:**
```
uploads/
├── auctions/documents/
├── cpo/documents/
├── evaluations/photos/
├── evaluations/reports/
├── payments/receipts/
├── assets/ownership/
├── assets/documents/
├── assets/photos/
└── kyc/
```

**Key files:**
- `src/integrations/fileStorage.integration.js` — Local filesystem provider
- `src/services/fileStorage.service.js` — Validation + upload facade
- `src/routes/fileUpload.routes.js` — POST `/files`, POST `/files/multiple`, DELETE `/files/:path`
- `src/middlewares/upload.middleware.js` — Multer configuration

## Redis Usage

| Use Case | Pattern | TTL |
|----------|---------|-----|
| Role permission cache | `rbac:role:{roleId}:{version}` | 24h |
| User permission cache | `rbac:user:{userId}:{version}` | 5min |
| Principal cache | In-memory only | 60s |
| OTP storage | `otp:{mobile}` | 5min |
| Cross-instance invalidation | Pub/Sub on `rbac:invalidate` channel | — |

**Graceful degradation:** If Redis is unavailable, the system falls back to in-memory caching only (via `src/utils/redis-safe.util.js`).

## Scheduled Jobs

| Job | File | Purpose |
|-----|------|---------|
| Auction auto-close | `src/jobs/auction-auto-close.job.js` | Polls for expired auctions, closes them, selects winners |
| Notification | `src/jobs/notification.job.js` | Processes notification queue |
| Payment sync | `src/jobs/paymentSync.job.js` | Syncs payment gateway status |

## Project Structure

```
backend/
├── server.js                    # Entry point
├── app.js                       # Express app setup
├── .env / .env.example          # Environment config
├── .sequelizerc                 # Sequelize CLI config
├── migrations/
│   ├── 001_initial_schema.cjs   # Unified schema
│   └── data/role-permissions.cjs # Seed data
├── scripts/
│   └── db/                      # Unified migrate/seed CLI
│       ├── cli.mjs              # Main entry
│       ├── data/                # Seed IDs & catalog
│       ├── lib/                 # Migration & purge helpers
│       └── seeds/               # Baseline, users, auctions
├── uploads/                     # File storage
├── src/
│   ├── config/                  # DB, env, Redis, i18n, logger
│   ├── constants/               # Role codes, file upload rules
│   ├── controllers/             # 23 controller files
│   ├── core/authorization/      # RBAC engine (7 files)
│   ├── integrations/            # File storage, email, SMS, AddisPay
│   ├── jobs/                    # Scheduled tasks
│   ├── locales/                 # en.json, am.json
│   ├── middleware/               # Auth, error, KYC, staff guards
│   ├── models/                  # 24 Sequelize models + associations
│   ├── modules/auth/            # Auth module (routes, controller, service)
│   ├── routes/                  # Route definitions
│   ├── schemas/                 # Permission schema parser
│   ├── services/                # 34 service files
│   ├── utils/                   # JWT, password, crypto, response, permission eval
│   └── validations/             # Request validation schemas
└── tests/                       # Unit & integration tests
```
