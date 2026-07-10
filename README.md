# enderass-auction-system
The purpose of this system is to digitize and manage the core auction lifecycle for Enderass National PLC through a web application and mobile applications.

## Project Status

The platform is actively under development and consists of four deployable clients sharing a single Express/Sequelize backend:

| Client | Stack | Status | Key capabilities |
|--------|-------|--------|------------------|
| **Backend** (`backend/`) | Node.js · Express · Sequelize/MySQL | ✅ Core complete | Auth & RBAC, auctions/lots/assets, bidding & bid drafts, evaluations, KYC, payments (AddisPay), CPO, staff, notifications, audit log, winners, dashboard, public landing, file uploads, i18n (en/am) |
| **Bidder Web** (`frontend/`) | Vite · React | ✅ Active | Auth, dashboard, browse/participate auctions, asset requests, bid management, KYC, CPO, payments, notifications, public landing, EN/AM i18n |
| **Admin Web** (`admin/`) | Vite · React | ✅ Active | Role workspaces, users & staff-roles, auctions, assets, evaluations, bids, KYC review, payments, CPO, winners, audit, analytics/reporting, settings, notifications |
| **Mobile** (`mobile/`) | Expo SDK 56 · React Native · expo-router | ✅ Active | Auth + OTP, onboarding, dashboard, browse/auction detail, bidding, asset submission, KYC, bids, profile, EN/AM i18n, golden glassmorphism design system |

### Implemented backend domains
Auth & JWT, RBAC policy engine (+ Redis caching), users/staff/roles, auctions → lots → assets (hierarchical), evaluations, bids & bid drafts (auto-close job), KYC, payments (AddisPay integration), CPO & CPO payments, winners, notifications, audit logging, system settings, public landing, document/file storage (local + pluggable provider).

### Database
MySQL/MariaDB via Sequelize with 3 migrations (initial schema, baseline roles/settings, bid drafts) and a unified DB CLI for baseline + test seeding (auction catalog, operational staff, test users).

### Recent milestones
- Bidder flow & multi-asset-per-lot implemented across backend, web, and mobile.
- Admin wired to the new backend auth; conflict-of-interest enforcement added.
- Profile pictures and improved seed data.
- UI polish and performance improvements on both web clients.

> See `changelog.md` for the running change log.

Project Technical Architecture & Environment Rules

Backend Stack

* Node.js
* Express.js
* Pure JavaScript (No TypeScript)

Frontend Stack

* Vite
* Modern frontend architecture
* Clean component structure
* Scalable folder organization

Database

* MySQL
* Sequelize ORM
* No Prisma

Environment Variable Rules

* No hardcoded values anywhere in the project
* Every configurable value must come from the `.env` file
* All secrets, credentials, URLs, ports, tokens, database configurations, and external service keys must be environment-based
* Database connection must dynamically use environment variables
* Database name must NEVER be hardcoded
* The system must support changing database credentials and database names directly from `.env` without modifying source code
* All environments (development, staging, production) must be configurable independently

Required Environment Variables (backend — see `backend/.env.example`)

* `NODE_ENV`, `PORT`
* `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`
* `REDIS_URL`, `RBAC_INVALIDATE_CHANNEL`, `RBAC_ROLE_CACHE_TTL_SECONDS`, `RBAC_USER_CACHE_TTL_SECONDS`
* `JWT_ACCESS_SECRET`, `JWT_ACCESS_EXPIRES_IN`, `JWT_REFRESH_EXPIRES_IN`
* `CLIENT_URL`, `API_BASE_URL`
* `AUCTION_AUTO_CLOSE_ENABLED`, `AUCTION_AUTO_CLOSE_INTERVAL_MS`
* `STORAGE_PROVIDER`, `STORAGE_UPLOAD_DIR`, `STORAGE_MAX_FILE_SIZE`, `STORAGE_ALLOWED_TYPES`
Backend Architecture Rules

* Use clean and scalable architecture
* Use modular folder structure
* Separate:

  * models
  * controllers
  * services
  * middleware
  * routes
  * validations (e.g. `src/modules/auth/auth.validation.js`)
  * utilities
  * configuration
* Auth lives under `src/modules/auth/`; RBAC policy engine under `src/core/authorization/`
* API routes are versioned under `src/routes/v1.routes.js`
* Keep controllers thin
* Business logic must be inside services
* Use centralized error handling
* Use async/await consistently
* Use reusable response utilities
* Use reusable validation patterns
* Use proper authentication and authorization middleware

Database Rules

* Use Sequelize associations properly
* Schema changes go through Sequelize migrations (`backend/migrations/`)
* Baseline and test data are seeded via the unified DB CLI (`backend/scripts/db/`)
* Include timestamps in all tables
* Use soft delete where necessary
* Use UUIDs where appropriate
* Maintain clean relational structure

Security Rules

* Hash passwords securely
* Protect sensitive routes with JWT authentication
* Validate all incoming requests
* Prevent SQL injection and common vulnerabilities
* Never expose sensitive environment variables to frontend

Code Quality Rules

* Write production-ready code
* Use consistent naming conventions
* Keep files modular and reusable
* Avoid duplicated logic
* Follow RESTful API principles
* Write maintainable and scalable code

Frontend Rules

* Use reusable components
* Use modular page structure
* Keep API calls centralized
* Use environment variables for API URLs
* No hardcoded backend URLs
* Build responsive layouts
* Keep clean state management structure

General Development Rules

* Build scalable enterprise-ready architecture
* Prioritize maintainability and readability
* Optimize for future feature expansion
* Keep the project clean for team collaboration
* Ensure deployment flexibility across different servers and database names

## Backend quick start

Prerequisites: Node.js 20+, MySQL/MariaDB, Redis.

```bash
cd backend
cp .env.example .env   # set DB_*, JWT_ACCESS_SECRET, REDIS_URL, etc.
npm install
npm run db:test           # migrate + seed full local test data
npm run dev
```

API base URL defaults to `http://localhost:3000/api` (see `API_BASE_URL` in `.env`).

### Database migrations

Migrations live in `backend/migrations/` and are applied with the Sequelize CLI via the unified DB command wrapper (`backend/scripts/db/cli.mjs`):

| Migration | Purpose |
|-----------|---------|
| `001_initial_schema.cjs` | Full schema (all core tables) |
| `002_seed_roles_and_settings.cjs` | Baseline roles, production super-admin, system settings |

```bash
npm run db -- migrate         # apply pending migrations
npm run db -- reset           # drop all tables, migrate, then seed (destructive)
```

The server does **not** auto-migrate on startup; run migrations explicitly before starting. (There is no `migrate:undo` shortcut script — use `npx sequelize-cli db:migrate:undo` if you need to roll back.)

### Database seeding (unified CLI)

All seeding is handled by `backend/scripts/db/cli.mjs`. Two modes:

* **normal** — baseline only (roles, system settings, production super-admin `+251900000000`)
* **test** — baseline + dev test users, operational staff, and auction catalog (default for local dev)

| Command | Description |
|---------|-------------|
| `npm run db:test` | Migrate, then seed full test data (recommended for new dev DBs) |
| `npm run db:setup` | Migrate, then seed baseline only |
| `npm run db:test:reseed` | Purge test seed data, then re-seed test |
| `npm run db:setup:reseed` | Purge test seed data, then re-apply baseline |

Generic form: `npm run db -- <command> [normal|test] [--only=users,staff,auctions]`

* `npm run db -- setup test` — migrate + seed full test data
* `npm run db -- seed test --only=auctions` — seed only the auction catalog (requires test users)
* `npm run db -- reset test` — drop all tables, migrate, seed test (destructive)

Test seed includes:

* 7 RBAC roles and 7 system settings
* 6 test user accounts (admin, bidder, 4 operational staff)
* 4 published multi-lot auctions, 12 assets, 12 evaluations

#### Local test credentials (after `npm run db:test` or `npm run db:test:reseed`)

| Role | Mobile | Password |
|------|--------|----------|
| Dev Super Admin | `0912345678` | `pass1` |
| Bidder | `0987654321` | `pass2` |
| Auction Manager | `0922222222` | `pass1` |
| Evaluation Officer | `0933333333` | `pass1` |
| Finance Officer | `0944444444` | `pass1` |
| Customer Service | `0955555555` | `pass1` |

Production super-admin (from migration baseline): `+251900000000` — password hash is set in `migrations/data/role-permissions.cjs`.

### Backend scripts

```bash
npm run dev                  # start with --watch (node --env-file=.env server.js)
npm run start                # production start
npm run test                 # RBAC policy unit tests
npm run test:auction-flow    # integration smoke test (requires seeded DB)
npm run db -- <command>      # unified migrate/seed/reset CLI
```

Integration test scripts live in `backend/scripts/` (e.g. `run-auction-flow-test.mjs`, `run-bidder-e2e.mjs`).

### Backend layout

```
backend/
├── app.js
├── server.js
├── .env / .env.example
├── .sequelizerc
├── migrations/
│   ├── 001_initial_schema.cjs
│   ├── 002_seed_roles_and_settings.cjs
│   └── data/role-permissions.cjs
├── scripts/
│   ├── db/                    # unified migrate/seed CLI
│   │   ├── cli.mjs
│   │   ├── data/              # stable seed IDs and catalog data
│   │   ├── lib/               # migrate, purge helpers
│   │   └── seeds/             # baseline, users, staff, auctions
│   └── run-*.mjs              # integration / smoke tests
├── src/
│   ├── config/                # db, env, redis, i18n, sequelize-cli
│   ├── constants/
│   ├── controllers/
│   ├── core/authorization/    # RBAC policy engine, middleware, cache
│   ├── jobs/                  # auction-auto-close
│   ├── locales/               # en, am
│   ├── middleware/            # auth, staff, kyc, permissions
│   ├── middlewares/           # upload handlers
│   ├── models/
│   ├── modules/auth/          # auth routes, service, validation
│   ├── routes/                # index, v1, file upload
│   ├── schemas/
│   ├── services/
│   └── utils/
├── tests/
│   ├── rbac.policy.test.js
│   └── mobile.util.test.js
└── uploads/                   # local file storage (gitignored content)
```