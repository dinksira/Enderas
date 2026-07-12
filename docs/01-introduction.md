# Enderas Auction System — Introduction

## Overview

Enderas Auction System is a full-stack auction management platform designed for the Ethiopian market. It provides end-to-end auction lifecycle management — from asset registration and evaluation through bidding, payment processing, and winner selection.

The system serves three user groups:

- **Bidders** — individuals and organizations participating in auctions
- **Staff** — auction managers, evaluation officers, finance officers, customer service officers, and super administrators
- **Public visitors** — browsing published auctions without authentication

## Monorepo Structure

```
enderass/
├── backend/          # Express 5 REST API (Node.js)
├── frontend/         # React 19 bidder app (Vite)
├── admin/            # React 19 admin panel (Vite)
├── mobile/           # React Native / Expo mobile app
├── .gitignore        # Root gitignore for entire monorepo
└── README.md         # Project README
```

Each application is independently deployable but shares a common backend API and, in the case of frontend and admin, a shared code layer (`@enderass/shared`).

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| **Runtime** | Node.js | ES Modules |
| **Backend Framework** | Express | 5.1.0 |
| **Database** | MySQL | — |
| **ORM** | Sequelize | 6.37.7 |
| **Cache** | Redis (Upstash) | ioredis 5.6.1 |
| **Auth** | JWT (HS256) | jsonwebtoken 9.0.2 |
| **Password Hashing** | bcrypt | 5.1.1 |
| **Web Framework** | React | 19.1 |
| **Build Tool** | Vite | 6.3 |
| **State Management** | Zustand | 5.x |
| **Routing (Web)** | React Router | 7.6 |
| **Mobile Framework** | React Native / Expo | SDK 56 |
| **Mobile Routing** | Expo Router | 56 (file-based) |
| **i18n** | i18next | 25 (web) / 26 (mobile) |
| **Language (Mobile)** | TypeScript | — |
| **Language (Web)** | JavaScript (JSX) | — |

## Deployment Map

| Service | Platform | Notes |
|---------|----------|-------|
| Backend API | Render | Node.js web service |
| MySQL Database | Aiven | Managed MySQL with SSL |
| Redis | Upstash | Serverless Redis |
| Frontend (Bidder) | Vercel | Static SPA |
| Admin Panel | Vercel | Static SPA |
| Mobile App | EAS (Expo) | iOS + Android builds |

## Core Features

### Auction Management
- Create auctions with single or multi-lot modes
- Link evaluated assets or create standalone auctions
- Configurable reserve prices, document fees, and CPO percentages
- Automatic auction closure on expiry with winner selection
- Share links for external organization access

### Bidding System
- Draft-based bidding workflow (save drafts, submit with CPO)
- Per-lot bidding in multi-asset auctions
- Duplicate bid prevention (one bid per user per auction)
- Bid status tracking (submitted, winning, lost, invalid)

### Asset Evaluation Pipeline
- Asset submission by bidders with ownership documents
- Customer Service Officer (CSO) review and approval
- Evaluation officer scheduling, inspection, and valuation
- Admin approval gate before auction creation

### KYC (Know Your Customer)
- Document upload (national ID, passport, license, trade license, TIN, business registration)
- CSO review workflow (pending → under review → approved/rejected)
- KYC status gates auction participation

### CPO (Certificate of Payment Obligation)
- Bid + CPO combined submission workflow
- Deposit amount tracking
- Refund management (pending, approved, paid)
- Expiry date enforcement

### Payments
- Manual payment (receipt upload) and Addis Pay digital gateway
- Finance officer verification and approval
- Document access unlock on payment approval

### RBAC (Role-Based Access Control)
- 7 roles: super_admin, auction_manager, evaluation_officer, finance_officer, customer_service_officer, bidder, asset_owner
- Module + action + route permission system
- Row-level data scoping
- L1 (in-memory) + L2 (Redis) permission caching with Pub/Sub invalidation

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                    CLIENTS                               │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐              │
│  │ Frontend │  │  Admin   │  │  Mobile  │              │
│  │ (React)  │  │ (React)  │  │ (RN/Expo)│              │
│  │ Vercel   │  │ Vercel   │  │   EAS    │              │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘              │
│       │              │              │                    │
│       └──────────────┼──────────────┘                    │
│                      │ HTTPS                             │
├──────────────────────┼──────────────────────────────────┤
│                BACKEND API                               │
│              ┌───────┴───────┐                           │
│              │   Express 5   │                           │
│              │  /api/v1/*    │                           │
│              └───────┬───────┘                           │
│         ┌────────────┼────────────┐                      │
│    ┌────┴────┐  ┌────┴────┐  ┌───┴───┐                  │
│    │  Auth   │  │  RBAC   │  │ Jobs  │                  │
│    │  (JWT)  │  │ Engine  │  │AutoClse│                  │
│    └────┬────┘  └────┬────┘  └───────┘                  │
│         │            │                                   │
├─────────┼────────────┼───────────────────────────────────┤
│    ┌────┴────┐  ┌────┴────┐                              │
│    │  MySQL  │  │  Redis  │                              │
│  (Aiven)   │  │(Upstash) │                              │
│            │  │ Cache+PS │                              │
│    23 tables│  └─────────┘                              │
└─────────────────────────────────────────────────────────┘
```

## Database Schema

The system uses 23 MySQL tables with foreign key constraints:

| Table | Purpose |
|-------|---------|
| `roles` | User roles with permission definitions |
| `users` | User accounts with status lifecycle |
| `asset_owners` | Asset owner profiles |
| `staff` | Staff profiles linked to users |
| `kyc_verifications` | KYC document submissions |
| `assets` | Registered assets with ownership docs |
| `evaluations` | Asset valuations and reports |
| `auctions` | Auction configurations |
| `lots` | Lot groupings for multi-asset auctions |
| `auction_assets` | Auction-to-asset junction (lot assignments) |
| `auction_documents` | Uploaded auction documents |
| `bids` | Submitted bids |
| `bid_drafts` | Saved bid drafts |
| `cpos` | Certificate of Payment Obligation |
| `cpo_payments` | CPO-linked payment records |
| `payments` | Document payment records |
| `winners` | Auction winners |
| `organization_auctions` | Organization-to-auction linking |
| `auction_share_links` | External share links |
| `notifications` | In-app notifications |
| `audit_logs` | System audit trail |
| `refresh_tokens` | JWT refresh token family tracking |
| `system_settings` | Global configuration |

## Getting Started

```bash
# Backend
cd backend
npm install
cp .env.example .env    # Configure database, Redis, JWT secrets
npm run db:setup:test   # Migrate + seed full test data
npm run dev             # Start dev server with --watch

# Frontend
cd frontend
npm install
npm run dev             # Vite dev server on :5173

# Admin
cd admin
npm install
npm run dev             # Vite dev server on :5174

# Mobile
cd mobile
npm install
npx expo start          # Expo dev server
```
