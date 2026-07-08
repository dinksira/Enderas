# Deploy frontend & admin on Vercel

Vercel hosts the **static React apps** only. The **backend** (Node + MySQL + Redis + uploads) must run elsewhere — e.g. a VPS, Railway, Render, or Azure.

You need **two Vercel projects** from the same Git repository.

---

## 1. Deploy the public frontend

1. Go to [vercel.com/new](https://vercel.com/new) and import your repo.
2. **Project name:** e.g. `enderas-public`
3. **Root Directory:** `frontend` (click Edit → set to `frontend`)
4. Framework should auto-detect **Vite** (`frontend/vercel.json` handles the monorepo install).
5. Add **Environment Variables** (Production + Preview):

| Variable | Example |
|----------|---------|
| `VITE_API_BASE_URL` | `https://api.enderas.et/api` |
| `VITE_API_V1_PREFIX` | `/v1` |
| `VITE_ADMIN_APP_URL` | `https://enderas-admin.vercel.app` |
| `VITE_APP_KIND` | `public` |
| `VITE_IOS_APP_URL` | (optional) App Store URL |
| `VITE_ANDROID_APP_URL` | (optional) Play Store URL |

6. Deploy.

Your public site will be at `https://enderas-public.vercel.app` (or your custom domain).

---

## 2. Deploy the admin panel

1. Create a **second** Vercel project from the **same repo**.
2. **Project name:** e.g. `enderas-admin`
3. **Root Directory:** `admin`
4. Environment variables:

| Variable | Example |
|----------|---------|
| `VITE_API_BASE_URL` | `https://api.enderas.et/api` |
| `VITE_API_V1_PREFIX` | `/v1` |
| `VITE_PUBLIC_APP_URL` | `https://enderas-public.vercel.app` |
| `VITE_APP_KIND` | `admin` |

5. Deploy.

---

## 3. Point both apps at your live API

`VITE_*` values are embedded at **build time**. After your API URL is known:

1. Vercel → Project → **Settings → Environment Variables**
2. Set `VITE_API_BASE_URL` to your real API, e.g. `https://api.enderas.et/api`
3. **Redeploy** (Deployments → ⋯ → Redeploy)

Do **not** use `/api` on Vercel — there is no Vite proxy in production.

---

## 4. Update backend CORS

On your API server (`backend/.env`), add the Vercel URLs:

```env
ALLOWED_ORIGINS=https://enderas-public.vercel.app,https://enderas-admin.vercel.app,https://www.enderas.et,https://admin.enderas.et
CLIENT_URL=https://enderas-public.vercel.app
API_BASE_URL=https://api.enderas.et/api
```

Restart the backend after changing `ALLOWED_ORIGINS`.

---

## 5. Custom domains (optional)

| Vercel project | Suggested domain |
|----------------|------------------|
| Frontend | `www.enderas.et` |
| Admin | `admin.enderas.et` |

In each Vercel project: **Settings → Domains**. Then update env vars to use those domains and redeploy both frontends.

---

## How the monorepo build works

Both apps import `@enderass/shared` from a local `src/shared/` copy within each project.  
`vercel.json` runs `cd .. && npm ci` so the whole workspace installs before `npm run build` in `frontend/` or `admin/`.

---

## CLI deploy (optional)

```bash
npm i -g vercel
cd frontend
vercel --prod

cd ../admin
vercel --prod
```

Link each folder to its own Vercel project when prompted.

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Build fails: cannot find `@enderass/shared` | Root Directory must be `frontend` or `admin`, not repo root |
| API calls fail / CORS | Add Vercel URL to backend `ALLOWED_ORIGINS` |
| 404 on refresh | `vercel.json` rewrites should be present (already in repo) |
| Wrong API after env change | Redeploy — Vite bakes env vars into the build |
| Login works locally, not on Vercel | `VITE_API_BASE_URL` must be full HTTPS API URL |

---

## What stays off Vercel

- **Backend** (`backend/`) — API, auth, file uploads
- **MySQL** — database
- **Redis** — RBAC cache
- **`uploads/`** — persistent disk on the API server

See [DEPLOYMENT.md](./DEPLOYMENT.md) for API hosting options.
