<p align="center">
  <img src="frontend/src/assets/cover.svg" alt="Enderas Auction System" width="100%" />
</p>

<h1 align="center">Enderas Auction System</h1>

<p align="center">
  <strong>A full-stack auction management platform for Enderas National PLC</strong>
  <br />
  <sub>Digitizing the complete auction lifecycle — from asset submission to winner payout</sub>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=node.js&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white" alt="Express.js" />
  <img src="https://img.shields.io/badge/MySQL-4479A1?style=for-the-badge&logo=mysql&logoColor=white" alt="MySQL" />
  <img src="https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React" />
  <img src="https://img.shields.io/badge/React_Native-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React Native" />
</p>

<p align="center">
  <img src="https://img.shields.io/badge/License-Proprietary-critical?style=for-the-badge" alt="License" />
  <img src="https://img.shields.io/badge/Version-1.0.0-blue?style=for-the-badge" alt="Version" />
  <img src="https://img.shields.io/badge/Platform-Windows%20%7C%20Linux%20%7C%20macOS-lightgrey?style=for-the-badge" alt="Platform" />
  <img src="https://img.shields.io/badge/Built%20for-Enderas%20National%20PLC-078930?style=for-the-badge" alt="Built for Enderas National PLC" />
</p>

<p align="center">
  <a href="#-about">About</a> •
  <a href="#-key-features">Features</a> •
  <a href="#-architecture">Architecture</a> •
  <a href="#-tech-stack">Tech Stack</a> •
  <a href="#-getting-started">Getting Started</a> •
  <a href="#-project-structure">Structure</a> •
  <a href="#-license">License</a>
</p>

---

## 📖 About

The **Enderas Auction System** is an enterprise-grade platform built to digitize and manage the complete auction lifecycle for **Enderas National PLC** — an Ethiopian government enterprise. It handles everything from user registration and KYC verification to asset evaluation, bidding, payment processing, winner selection, and reporting across web, admin, and mobile applications.

---

## ✨ Key Features

| Category | Highlights |
|---|---|
| 🔐 **Authentication & Security** | Mobile OTP registration & login · JWT access/refresh flow · RBAC with 7 roles · bcrypt hashing · SQL injection prevention |
| ⚖️ **Auction Lifecycle** | Asset submission with ownership verification · multi-stage evaluation pipeline · multi-asset lot auctions · closed bidding with deadline enforcement · auto-close background job · timestamp tie-breaking |
| 💳 **Financial** | Addis Pay gateway integration · manual receipt upload & finance review · CPO (Competitive Procurement Order) management · payment-gated document access |
| 🗂️ **Operations** | KYC workflow (upload → review → approve/reject) · in-app, SMS & email notifications · full audit logging · staff & role management · PDF/Excel reporting |
| 🌍 **Platform** | Bilingual (English & Amharic) · responsive web design · cross-platform mobile (Android 10+ / iOS 15+) · zero hardcoded configuration |

---

## 🏗️ Architecture

```mermaid
flowchart TB
    subgraph Clients["Client Applications"]
        FE["🖥️ Frontend<br/>React + Vite"]
        AD["🛡️ Admin Dashboard<br/>React + Vite"]
        MO["📱 Mobile App<br/>React Native + Expo"]
    end

    API["⚙️ REST API v1<br/>Node.js + Express"]

    FE --> API
    AD --> API
    MO --> API

    API --> DB[("🗄️ MySQL<br/>Aiven")]
    API --> CACHE[("⚡ Redis<br/>Upstash")]
    API --> STORE["📂 File Storage"]
```

---

## 🧰 Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
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

## 🔑 RBAC Roles & Permissions

| Role | Permissions |
|---|---|
| **Super Administrator** | Full system access, evaluation approval, auction publication |
| **Auction Manager** | Create auctions, manage bids & winners |
| **Evaluation Officer** | Schedule inspections, complete valuations |
| **Finance Officer** | Approve/reject payments |
| **Customer Service Officer** | KYC review, asset ownership review, CPO management |
| **Bidder** | Browse auctions, make payments, submit bids |
| **Asset Owner** | Submit assets, track approval status |

---

## 🚀 Getting Started

### Prerequisites

- Node.js 20+
- MySQL / MariaDB
- Redis

### 🔧 Backend

```bash
cd backend
cp .env.example .env    # configure DB_*, JWT_ACCESS_SECRET, REDIS_URL
npm install
npm run db:test           # migrate + seed full local test data
npm run dev
```

API runs at `http://localhost:3000/api` by default.

### 🌐 Frontend

```bash
cd frontend
cp .env.example .env    # set VITE_API_BASE_URL
npm install
npm run dev
```

### 🛡️ Admin

```bash
cd admin
cp .env.example .env
npm install
npm run dev
```

### 📱 Mobile

```bash
cd mobile
npm install
npx expo start
```

---

## 🗄️ Database

Migrations live in `backend/migrations/` and are applied with the Sequelize CLI via the unified DB command wrapper (`backend/scripts/db/cli.mjs`):

| Migration | Purpose |
|---|---|
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
|---|---|
| `npm run db:test` | Migrate, then seed full test data (recommended for new dev DBs) |
| `npm run db:setup` | Migrate, then seed baseline only |
| `npm run db:test:reseed` | Purge test seed data, then re-seed test |
| `npm run db:setup:reseed` | Purge test seed data, then re-apply baseline |
| `npm run db -- setup test` | migrate + seed full test data |
| `npm run db -- seed test --only=auctions` | seed only the auction catalog (requires test users) |
| `npm run db -- reset test` | drop all tables, migrate, seed test (destructive) |

Test seed includes:

* 7 RBAC roles and 7 system settings
* 6 test user accounts (admin, bidder, 4 operational staff)
* 4 published multi-lot auctions, 12 assets, 12 evaluations

## 🔐 Test Credentials

> [!WARNING]
> These accounts are seeded only by `db:test` and are intended for **local development and QA**. Never seed test data or reuse these credentials in a production environment.

#### Local test credentials (after `npm run db:test` or `npm run db:test:reseed`)

| Role | Mobile | Password |
|---|---|---|
| Dev Super Admin | `0912345678` | `pass1` |
| Bidder | `0987654321` | `pass2` |
| Auction Manager | `0922222222` | `pass1` |
| Evaluation Officer | `0933333333` | `pass1` |
| Finance Officer | `0944444444` | `pass1` |
| Customer Service | `0955555555` | `pass1` |

Production super-admin: `+251900000000`

---

```bash
npm run dev                  # start with --watch (node --env-file=.env server.js)
npm run start                # production start
npm run test                 # RBAC policy unit tests
npm run test:auction-flow    # integration smoke test (requires seeded DB)
npm run db -- <command>      # unified migrate/seed/reset CLI
```

Integration test scripts live in `backend/scripts/` (e.g. `run-auction-flow-test.mjs`, `run-bidder-e2e.mjs`).

---

## 📁 Project Structure

<details>
<summary><strong>Click to expand backend structure</strong></summary>

```
backend/
├── app.js                     # Express app setup
├── server.js                  # Server entry point
├── .env / .env.example        # Environment configuration
├── migrations/                # Sequelize migrations
│   ├── 001_initial_schema.cjs
│   ├── 002_seed_roles_and_settings.cjs
│   └── data/role-permissions.cjs
├── scripts/
│   └── db/                    # Unified migrate/seed CLI
│       ├── cli.mjs
│       ├── data/              # Stable seed IDs & catalog
│       ├── lib/                # Migration & purge helpers
│       └── seeds/              # Baseline, users, auctions
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

</details>

---

## ⚙️ Environment Variables

All configuration lives in `.env`. Nothing is hardcoded.

| Variable | Description |
|---|---|
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

## 📜 NPM Scripts

```bash
npm run dev               # Start with --watch
npm run start             # Production start
npm run test               # RBAC policy unit tests
npm run test:auction-flow  # Integration smoke test
```

---

## 📄 License

This project is proprietary software of **Enderas National PLC**. All rights reserved.

---

<p align="center">
  Built with precision for the Ethiopian auction ecosystem 🇪🇹
</p>
