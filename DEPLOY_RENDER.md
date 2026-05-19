# Deploy KrishiRakshak / SWC Web on Render

Your **Flask engine** is already live at:

`https://swc-ai-engine-clean.onrender.com`

This guide deploys only the **Next.js app** in `web/` to Render.

---

## Prerequisites

1. Code pushed to GitHub: `https://github.com/Prateek9456/swc-ai-engine-clean`
2. A **cloud MySQL** database (Render does not host MySQL). Options:
   - [PlanetScale](https://planetscale.com) (MySQL-compatible, free tier)
   - [Railway](https://railway.app) MySQL
   - Any host with a public URL (same schema as local `swc_ai_engine`)
3. Google OAuth client (same as local), with **production redirect URI** added after deploy

---

## Option A — Blueprint (recommended)

1. Open [Render Dashboard](https://dashboard.render.com) → **Blueprints** → **New Blueprint Instance**
2. Connect repo `Prateek9456/swc-ai-engine-clean`
3. Render reads `render.yaml` at the repo root and creates **krishi-rakshak-web**
4. When prompted, set these **secret** environment variables:

| Variable | Example / notes |
|----------|-----------------|
| `DATABASE_URL` | `mysql://USER:PASS@HOST:3306/swc_ai_engine` (URL-encode `@` in password as `%40`) |
| `NEXTAUTH_URL` | `https://krishi-rakshak-web.onrender.com` (your real Render URL, no trailing slash) |
| `NEXTAUTH_SECRET` | Long random string (`openssl rand -base64 32`) |
| `GOOGLE_CLIENT_ID` | From Google Cloud Console |
| `GOOGLE_CLIENT_SECRET` | From Google Cloud Console |

5. Click **Apply** and wait for the build (~5–10 min first time)

---

## Option B — Manual Web Service

1. **New** → **Web Service** → connect GitHub repo
2. Settings:
   - **Root Directory:** `web`
   - **Runtime:** Node
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`
   - **Health Check Path:** `/api/health`
3. Add the same environment variables as in Option A (`BACKEND_URL` is already in `render.yaml` defaults if you use the blueprint)

---

## After deploy

### 1. Google OAuth redirect URI

In [Google Cloud Console](https://console.cloud.google.com/) → **Credentials** → your OAuth client → **Authorized redirect URIs**, add:

```text
https://YOUR-RENDER-SERVICE.onrender.com/api/auth/callback/google
```

Replace `YOUR-RENDER-SERVICE` with your actual hostname (e.g. `krishi-rakshak-web`).

### 2. Update `NEXTAUTH_URL`

In Render → your web service → **Environment**, set:

```text
NEXTAUTH_URL=https://YOUR-RENDER-SERVICE.onrender.com
```

Redeploy if you change it.

### 3. Initialize MySQL (once)

From your machine (with `DATABASE_URL` pointing at **cloud** MySQL):

```powershell
cd web
$env:DATABASE_URL="mysql://..."
npm run db:setup
npm run db:check
```

### 4. Smoke test

- Open `https://YOUR-RENDER-SERVICE.onrender.com/login`
- Sign in with Google
- Drop a map pin (zoom 17+), run **Analyze Land**
- First request after idle may take 1–2 minutes (Render free tier cold start on **both** services)

---

## Environment reference

| Variable | Required | Purpose |
|----------|----------|---------|
| `BACKEND_URL` | Yes | Flask API (`https://swc-ai-engine-clean.onrender.com`) |
| `DATABASE_URL` | Yes (for auth/history) | Prisma → MySQL |
| `NEXTAUTH_URL` | Yes | Public URL of this Next.js app |
| `NEXTAUTH_SECRET` | Yes | Session encryption |
| `GOOGLE_CLIENT_ID` / `SECRET` | Yes (unless demo mode) | Google sign-in |

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Build fails on Prisma | Ensure `DATABASE_URL` is set before deploy; `postinstall` runs `prisma generate` |
| Google `redirect_uri_mismatch` | Add exact `/api/auth/callback/google` URL for production |
| Backend offline | Wake Flask service; health check retries up to ~3×60s |
| No users in MySQL | `DATABASE_URL` must point to cloud DB, not `localhost` |
| 502 on start | Confirm start command is `npm start` and Node 20 |

---

## What is *not* deployed here

- **Flask** — already on Render (`swc-ai-engine-clean`)
- **Streamlit** (`frontend/`) — optional legacy UI; not required for production
- **Local MySQL** — must use a cloud instance reachable from Render
