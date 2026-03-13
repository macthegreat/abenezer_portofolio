# Deployment Guide (Render backend + Vercel frontend)

This project is easiest to deploy with:
- **Backend** on Render (always-on Node service + Postgres)
- **Frontend** on Vercel (static hosting)

> Why this split: current backend uses `app.listen(...)`, which is designed for long-running servers.

## 1) Backend on Render

### 1.1 Create services
1. Push this repo to GitHub.
2. In Render, create a **PostgreSQL** database.
3. In Render, create a **Web Service** from this repo.

### 1.2 Use the included Blueprint (recommended)
Use `render.yaml` in repo root.

If deploying manually, use:
- Root Directory: `backend`
- Build Command: `npm install`
- Start Command: `npm start`

### 1.3 Set environment variables
Set these on the Render web service:
- `NODE_ENV=production`
- `PORT=10000` (Render default)
- `DATABASE_URL=<render-postgres-internal-url>`
- `JWT_SECRET=<long-random-secret>`
- `DB_SSL=true`
- `CORS_ORIGINS=https://<your-vercel-frontend-domain>`
- `RATE_LIMIT_WINDOW_MS=900000`
- `RATE_LIMIT_MAX=300`
- `LOG_FORMAT=combined`

### 1.4 Run database schema
Run once against your Render DB:

```bash
cd backend
psql "$DATABASE_URL" -f database/schema.sql
```

### 1.5 Smoke checks
- `GET https://<render-backend>/health`
- `GET https://<render-backend>/ready`

## 2) Frontend on Vercel

### 2.1 Import project
1. Vercel Dashboard → **New Project** → import this repo.
2. Set **Root Directory** to `frontend`.
3. Framework preset: **Other**.
4. Build command: *(empty)*.
5. Output directory: `.`

### 2.2 Deploy
Click **Deploy**.

### 2.3 Connect frontend to backend
Open deployed frontend and set **API Base URL** to your Render backend URL.

## 3) First-time system bootstrap
1. In frontend, click **Create First Supervisor**.
2. Login with supervisor account.
3. Create officers and agents.
4. Start operational flow:
   - agent submits person by IDNO
   - officer registers same IDNO
   - match + commission created automatically

## 4) "Conflict" resolution (common deployment mismatch)
If you try to deploy backend directly as-is to Vercel functions, requests may fail because the app is a long-running server. Use Render for backend unless you refactor to serverless handlers.
