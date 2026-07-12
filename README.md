<p align="center">
  <img src="frontend/src/assets/cover.svg" alt="Enderas Auction System" width="100%" />
</p>

<h1 align="center">Enderas Auction System</h1>

<p align="center">
  <strong>A full-stack auction management platform for Enderas National PLC</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=node.js&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white" alt="Express.js" />
  <img src="https://img.shields.io/badge/MySQL-4479A1?style=for-the-badge&logo=mysql&logoColor=white" alt="MySQL" />
  <img src="https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React" />
  <img src="https://img.shields.io/badge/React_Native-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React Native" />
</p>

<p align="center">
  <img src="https://img.shields.io/badge/License-MIT-green?style=for-the-badge" alt="License" />
  <img src="https://img.shields.io/badge/Version-1.0.0-blue?style=for-the-badge" alt="Version" />
  <img src="https://img.shields.io/badge/Platform-Windows%20%7C%20Linux%20%7C%20macOS-lightgrey?style=for-the-badge" alt="Platform" />
</p>

---

## About

The **Enderas Auction System** is an enterprise-grade platform built to digitize and manage the complete auction lifecycle for **Enderas National PLC** — an Ethiopian government enterprise. It handles everything from user registration and KYC verification to asset evaluation, bidding, payment processing, winner selection, and reporting across web, admin, and mobile applications.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENTS                                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐   │
│  │ Frontend │  │  Admin   │  │  Mobile  │  │    Backend   │   │
│  │  (Vite)  │  │  (Vite)  │  │ (Expo)   │  │  (Node.js)   │   │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └──────┬───────┘   │
│       │              │              │               │            │
│       └──────────────┴──────────────┴───────┬───────┘            │
│                                             │                    │
│                                    ┌────────▼────────┐          │
│                                    │   REST API v1   │          │
│                                    └────────┬────────┘          │
│                                             │                    │
│                         ┌───────────────────┼───────────────┐   │
│                         │                   │               │   │
│                   ┌─────▼─────┐      ┌──────▼──────┐  ┌───▼───┐
│                   │   MySQL   │      │    Redis    │  │ File  │
│                   │  (Aiven)  │      │  (Upstash)  │  │Storage│
│                   └───────────┘      └─────────────┘  └───────┘
└─────────────────────────────────────────────────────────────────┘
```

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Backend** | Node.js + Express.js | REST API server |
| **Database** | MySQL (Aiven) | Primary data store |
| **ORM** | Sequelize | Database abstraction & migrations |
| **Cache** | Redis (Upstash) | RBAC caching & session management |
| **Auth** | JWT + OTP | Authentication & authorization |
| **Frontend** | React + Vite | Public-facing web application |
| **Admin** | React + Vite | Internal management dashboard |
| **Mobile** | React Native + Expo | Cross-platform mobile app |
| **Deployment** | Render + Vercel + EAS | Backend, web, and mobile hosting |

---

## Features

### Authentication & Security
- Mobile OTP registration & login
- JWT access/refresh token flow
- Role-Based Access Control (RBAC) with 7 distinct roles
- bcrypt password hashing
- Request validation & SQL injection prevention

### Auction Lifecycle
- Asset submission with ownership verification
- Multi-stage evaluation pipeline (schedule, inspect, valuate, approve)
- Auction creation with multi-asset lot support
- Closed bid submission with deadline enforcement
- Auto-close auctions via background job
- Winner selection with tie-breaking by timestamp

### Financial
- Addis Pay gateway integration
- Manual receipt upload & finance officer review
- CPO (Competitive Procurement Order) management
- Document access gated behind payment approval

### Operations
- KYC verification workflow (document upload → staff review → approve/reject)
- In-app, SMS, and email notification tri-channel
- Audit logging on all user actions
- Staff management with role assignment
- Reporting with PDF and Excel export

### Platform
- Bilingual support (English & Amharic)
- Responsive web design
- Cross-platform mobile (Android 10+ / iOS 15+)
- Environment-based configuration (zero hardcoded values)

---

## RBAC Roles

| Role | Permissions |
|------|-------------|
| **Super Administrator** | Full system access, evaluation approval, auction publication |
| **Auction Manager** | Create auctions, manage bids & winners |
| **Evaluation Officer** | Schedule inspections, complete valuations |
| **Finance Officer** | Approve/reject payments |
| **Customer Service Officer** | KYC review, asset ownership review, CPO management |
| **Bidder** | Browse auctions, make payments, submit bids |
| **Asset Owner** | Submit assets, track approval status |

---

## Quick Start

### Prerequisites

- Node.js 20+
- MySQL / MariaDB
- Redis

### Backend

```bash
cd backend
cp .env.example .env    # configure DB_*, JWT_ACCESS_SECRET, REDIS_URL
npm install
npm run db:setup:test   # migrate + seed full test data
npm run dev
```

API runs at `http://localhost:3000/api` by default.

### Frontend

```bash
cd frontend
cp .env.example .env    # set VITE_API_BASE_URL
npm install
npm run dev
```

### Admin

```bash
cd admin
cp .env.example .env
npm install
npm run dev
```

### Mobile

```bash
cd mobile
npm install
npx expo start
```

---

## Database

### Migrations

| Migration | Purpose |
|-----------|---------|
| `001_initial_schema.cjs` | Full schema — all core tables |
| `002_seed_roles_and_settings.cjs` | Baseline roles, super-admin, system settings |
| `003_bid_drafts.cjs` | Bid drafts table & schema updates |

### Seed Commands

| Command | Description |
|---------|-------------|
| `npm run db:setup:test` | Migrate + seed full test data |
| `npm run db:setup:normal` | Migrate + seed baseline only |
| `npm run db:seed:test` | Seed test data on existing DB |
| `npm run db:reseed:test` | Purge + re-seed test data |
| `npm run db:reset:test` | Full reset (destructive) |
| `npm run db:seed:auctions` | Seed only auction catalog |

---

## Test Credentials

After running `db:setup:test`:

| Role | Mobile | Password |
|------|--------|----------|
| Dev Super Admin | `0912345678` | `pass1` |
| Bidder | `0987654321` | `pass2` |
| Auction Manager | `0922222222` | `pass1` |
| Evaluation Officer | `0933333333` | `pass1` |
| Finance Officer | `0944444444` | `pass1` |
| Customer Service | `0955555555` | `pass1` |

Production super-admin: `+251900000000`

---

## Backend Structure

```
backend/
├── app.js                     # Express app setup
├── server.js                  # Server entry point
├── .env / .env.example        # Environment configuration
├── migrations/                # Sequelize migrations
│   ├── 001_initial_schema.cjs
│   ├── 002_seed_roles_and_settings.cjs
│   ├── 003_bid_drafts.cjs
│   └── data/role-permissions.cjs
├── scripts/
│   └── db/                    # Unified migrate/seed CLI
│       ├── cli.mjs
│       ├── data/              # Stable seed IDs & catalog
│       ├── lib/               # Migration & purge helpers
│       └── seeds/             # Baseline, users, auctions
├── src/
│   ├── config/                # DB, env, Redis, i18n
│   ├── constants/
│   ├── controllers/
│   ├── core/authorization/    # RBAC engine & middleware
│   ├── jobs/                  # Auction auto-close
│   ├── locales/               # en, am
│   ├── middleware/            # Auth, staff, KYC
│   ├── models/
│   ├── modules/auth/          # Auth routes, service, validation
│   ├── routes/                # API versioning
│   ├── schemas/
│   ├── services/
│   └── utils/
└── tests/
    ├── rbac.policy.test.js
    └── mobile.util.test.js
```

---

## Environment Variables

All configuration lives in `.env`. Nothing is hardcoded.

| Variable | Description |
|----------|-------------|
| `NODE_ENV` | Environment mode |
| `PORT` | Server port |
| `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` | MySQL connection |
| `REDIS_URL` | Redis connection string |
| `JWT_ACCESS_SECRET`, `JWT_ACCESS_EXPIRES_IN`, `JWT_REFRESH_EXPIRES_IN` | Auth tokens |
| `CLIENT_URL`, `API_BASE_URL` | Frontend & API URLs |
| `AUCTION_AUTO_CLOSE_ENABLED`, `AUCTION_AUTO_CLOSE_INTERVAL_MS` | Auto-close job |
| `STORAGE_PROVIDER`, `STORAGE_UPLOAD_DIR`, `STORAGE_MAX_FILE_SIZE` | File storage |

See `backend/.env.example` for the full list.

---

## Scripts

```bash
npm run dev               # Start with --watch
npm run start             # Production start
npm run test              # RBAC policy unit tests
npm run test:auction-flow # Integration smoke test
```

---

## License

This project is proprietary software of **Enderas National PLC**. All rights reserved.

---

<p align="center">
  Built with precision for the Ethiopian auction ecosystem
</p>
