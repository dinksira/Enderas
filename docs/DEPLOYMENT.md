# Enderas Auction System — Deployment Guide

Deploy **three apps** from this monorepo:

| App | Dev port | Production role |
|-----|----------|-----------------|
| **Backend** (API + uploads) | 3000 | `api.yourdomain.com` |
| **Frontend** (public site + bidders) | 5173 | `www.yourdomain.com` |
| **Admin** (staff panel) | 5174 | `admin.yourdomain.com` |

**Dependencies:** MySQL 8+, Redis, Node.js 20+ (if not using Docker).

---

## Recommended production layout

```
www.enderas.et      →  static frontend (Vite build)
admin.enderas.et    →  static admin (Vite build)
api.enderas.et      →  Node/Express backend (port 3000)
```

Point all three frontends at the **same API URL** via `VITE_API_BASE_URL`.

---

## Option A — Docker Compose (fastest full stack)

### 1. Prerequisites

- Docker + Docker Compose on the server
- DNS A records for your domains → server IP

### 2. Configure environment

```bash
cp .env.production.example .env.production
# Edit secrets, domains, and passwords
```

**Important:** `VITE_*` values are embedded at **image build** time. After changing them, rebuild:

```bash
docker compose build frontend admin
```

### 3. Start services

```bash
docker compose --env-file .env.production up -d --build
```

This starts:

- MySQL + Redis
- Backend on port **3000**
- Public frontend on **8080**
- Admin on **8081**
- Persistent volumes for DB and `uploads/`

### 4. Run database migrations (first deploy only)

```bash
docker compose exec backend sh -c "npm install sequelize-cli && npx sequelize-cli db:migrate"
```

Or run migrations from your machine against the server DB if you prefer.

### 5. Put Nginx + HTTPS in front

Use `docker/nginx/production-gateway.conf` as a template. On the host:

1. Install Nginx + Certbot (Let's Encrypt)
2. Proxy `api.*` → `localhost:3000`
3. Proxy `www.*` → `localhost:8080`
4. Proxy `admin.*` → `localhost:8081`

Update backend `.env.production`:

```env
ALLOWED_ORIGINS=https://www.enderas.et,https://enderas.et,https://admin.enderas.et
CLIENT_URL=https://www.enderas.et
API_BASE_URL=https://api.enderas.et/api
```

Restart backend after env changes:

```bash
docker compose --env-file .env.production up -d backend
```

### 6. Verify

```bash
curl https://api.enderas.et/health
# {"success":true,"status":"ok"}
```

Open `https://www.enderas.et` and `https://admin.enderas.et` in a browser.

---

## Option B — Manual VPS deploy (no Docker)

### 1. Server packages

```bash
# Ubuntu example
sudo apt update
sudo apt install -y nginx mysql-server redis-server
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm install -g pm2
```

### 2. Clone and install

```bash
git clone <your-repo-url> /var/www/enderass
cd /var/www/enderass
npm install
```

### 3. Backend

```bash
cp backend/.env.example backend/.env
# Set DB_*, REDIS_URL, JWT_ACCESS_SECRET, ALLOWED_ORIGINS, API_BASE_URL, CLIENT_URL

cd backend
npm run db:migrate
cd ..
pm2 start backend/server.js --name enderas-api --cwd backend --node-args="--env-file=.env"
pm2 save
```

Create uploads directory and ensure it persists:

```bash
mkdir -p backend/uploads
```

Nginx location for API (on `api.enderas.et`):

```nginx
location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-Proto $scheme;
    client_max_body_size 10m;
}
```

Static uploads are served by Express at `/api/uploads/...` — no extra Nginx rule needed if API is proxied as a whole.

### 4. Frontend (public)

```bash
cd frontend
# Create .env.production locally or export vars:
export VITE_API_BASE_URL=https://api.enderas.et/api
export VITE_ADMIN_APP_URL=https://admin.enderas.et
export VITE_APP_KIND=public
npm run build
```

Serve `frontend/dist` with Nginx:

```nginx
root /var/www/enderass/frontend/dist;
location / { try_files $uri $uri/ /index.html; }
```

### 5. Admin

```bash
cd admin
export VITE_API_BASE_URL=https://api.enderas.et/api
export VITE_PUBLIC_APP_URL=https://www.enderas.et
export VITE_APP_KIND=admin
npm run build
```

Serve `admin/dist` on `admin.enderas.et` the same way.

### 6. SSL

```bash
sudo certbot --nginx -d www.enderas.et -d enderas.et -d admin.enderas.et -d api.enderas.et
```

---

## Environment variable cheat sheet

### Backend (`backend/.env` or `.env.production`)

| Variable | Purpose |
|----------|---------|
| `DB_*` | MySQL connection |
| `REDIS_URL` | RBAC cache / sessions |
| `JWT_ACCESS_SECRET` | Auth tokens (use a long random string) |
| `API_BASE_URL` | Public URL of API (used in uploaded file URLs) |
| `CLIENT_URL` | Public bidder site URL |
| `ALLOWED_ORIGINS` | CORS — comma-separated frontend origins |

### Frontend build (`frontend/.env` or Docker build args)

| Variable | Example |
|----------|---------|
| `VITE_API_BASE_URL` | `https://api.enderas.et/api` |
| `VITE_ADMIN_APP_URL` | `https://admin.enderas.et` |
| `VITE_IOS_APP_URL` | App Store link (optional) |
| `VITE_ANDROID_APP_URL` | Play Store link (optional) |

### Admin build (`admin/.env` or Docker build args)

| Variable | Example |
|----------|---------|
| `VITE_API_BASE_URL` | `https://api.enderas.et/api` |
| `VITE_PUBLIC_APP_URL` | `https://www.enderas.et` |

---

## Build commands (from repo root)

```bash
npm install
npm run build -w frontend
npm run build -w admin
```

Backend has no build step — run `node server.js` with env loaded.

---

## Post-deploy checklist

- [ ] Migrations applied (`npm run db:migrate` in `backend/`)
- [ ] `/health` returns OK on API
- [ ] Login works on public site and admin
- [ ] CORS: `ALLOWED_ORIGINS` includes all live frontends
- [ ] `uploads/` volume backed up (auction images, KYC docs)
- [ ] `JWT_ACCESS_SECRET` is unique and not the dev default
- [ ] HTTPS enabled on all three domains
- [ ] PM2 or Docker restart policy configured

---

## Updating a live deployment

**Backend** (API-only change):

```bash
git pull
cd backend && npm install --omit=dev
pm2 restart enderas-api
# or: docker compose up -d --build backend
```

**Frontend / Admin** (UI change — must rebuild static files):

```bash
git pull
npm install
npm run build -w frontend
npm run build -w admin
# redeploy dist/ or rebuild Docker images
```

If `VITE_*` URLs changed, rebuild frontend/admin images or run `npm run build` again with new env vars.

---

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| `ERR_CONNECTION_REFUSED` on API | Backend not running; check port 3000 / firewall |
| CORS errors in browser | Add frontend origin to `ALLOWED_ORIGINS` |
| Empty landing data | API down or wrong `VITE_API_BASE_URL` in built frontend |
| Images 404 | Check `uploads/` volume exists; `API_BASE_URL` matches public API URL |
| Admin login loops | `VITE_API_BASE_URL` must point to live API with `/api` suffix |
