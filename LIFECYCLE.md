# FieldserviceIT — Full Lifecycle & Deployment Guide

## 1. Architecture Overview

```
┌─────────────────────────────────────────────────┐
│                   DNS (Namecheap)                │
│  fieldserviceit.com ──────┬─── CNAME ──► Vercel  │
│                           │                      │
│  api.fieldserviceit.com ──┴─── A ──────► Hostinger│
└─────────────────────────────────────────────────┘

┌──────────────────────┐    ┌──────────────────────────┐
│   FRONTEND (Vercel)   │    │   BACKEND (Hostinger)    │
│                      │    │                          │
│   Next.js 14         │    │   NestJS 10              │
│   React 18           │    │   MySQL SQL service      │
│   Zustand (state)    │    │   Socket.IO (WS)         │
│   Socket.IO (client) │    │   Stripe (billing)       │
│   Tailwind CSS       │    │   Swagger (/docs)        │
│   Recharts           │    │                          │
│   Lucide Icons       │    │   Port: 4000             │
└──────────┬───────────┘    └──────────┬───────────────┘
           │                           │
           └──────── API calls ────────┘
                    https://api.fieldserviceit.com/v1/*
```

## 2. Repo Structure (key directories)

```
FieldserviceIT/
├── frontend/         # Next.js 14 app → deploys to Vercel
│   ├── src/
│   │   ├── app/          # Pages (app router)
│   │   ├── components/   # Shared UI components
│   │   ├── lib/          # API client, socket, utils
│   │   ├── stores/       # Zustand stores
│   │   └── types/        # TypeScript types
│   ├── next.config.js
│   ├── package.json
│   └── .env.*
├── backend/          # NestJS API → deploys to Hostinger
│   ├── src/
│   │   ├── modules/      # Feature modules (auth, tickets, assets, etc.)
│   │   ├── database/     # Database service layer
│   │   ├── common/       # Guards, decorators, interceptors
│   │   └── main.ts       # Bootstrap
│   ├── schema.sql       # Reference SQL schema
│   ├── prisma/          # Legacy schema/seed helpers
│   ├── package.json
│   └── .env
├── infra/            # Docker/K8s reference configs
└── docs/             # API.md, DATA_MODEL.md, SECURITY.md
```

## 3. Environment Variables

### Frontend (Vercel project settings)

| Variable | Value | Notes |
|----------|-------|-------|
| `NEXT_PUBLIC_API_URL` | `https://api.fieldserviceit.com` | Backend URL (no trailing slash) |

### Backend (Hostinger hPanel → Node.js → Environment)

| Variable | Value | Notes |
|----------|-------|-------|
| `DATABASE_URL` | `mysql://...` | MySQL connection string |
| `JWT_SECRET` | (256-bit hex string) | JWT signing key |
| `JWT_EXPIRES_IN` | `15m` | Access token TTL |
| `PORT` | `4000` | Backend listen port |
| `CORS_ORIGIN` | `https://fieldserviceit.com` | Production frontend URL |
| `SMTP_HOST` | `smtp.hostinger.com` | SMTP for emails |
| `SMTP_PORT` | `465` | SMTP port (SSL) |
| `SMTP_USER` | (Hostinger email) | SMTP login |
| `SMTP_PASS` | (Hostinger email password) | SMTP password |
| `SMTP_FROM` | `noreply@fieldserviceit.com` | From address |
| `FRONTEND_URL` | `https://fieldserviceit.com` | For password reset links |
| `STORAGE_TYPE` | `local` | File storage (local or s3) |
| `SWAGGER_ENABLED` | `false` | Production: off |

## 4. Database

- **Host**: Hostinger MySQL (hPanel → Databases → MySQL)
- **Engine**: MySQL 8.0
- **Schema source**: SQL table definitions in `backend/src/database/database.service.ts`
- **Reference SQL**: `backend/schema.sql`
- **Startup behavior**: the backend ensures required MySQL tables when it starts

### Key DB commands (run via Hostinger hPanel → Node.js → Build Command)

```bash
# Install deps and build
npm ci --omit=dev && npm run build
```

## 5. Frontend Lifecycle

### Development
```bash
cd frontend
npm install
npm run dev       # → http://localhost:3000
```

### Build (for local testing)
```bash
npm run build     # Output: .next/standalone/*
```

### Deploy to Vercel

**Option A: Via GitHub (recommended)**
1. Push `frontend/` to GitHub repo
2. Go to https://vercel.com → Add New Project
3. Import GitHub repo → Set root to `frontend/`
4. Vercel auto-detects Next.js (no config needed)
5. Add env var: `NEXT_PUBLIC_API_URL=https://api.fieldserviceit.com`
6. Deploy → Vercel gives you a `.vercel.app` domain
7. Go to Vercel project → Domains → Add `fieldserviceit.com`

**Option B: Via CLI**
```bash
npx vercel login          # Authenticate via browser
cd frontend
npx vercel --prod         # Deploy to production
npx vercel env add NEXT_PUBLIC_API_URL  # Add env var
```

### Vercel Configuration

No `vercel.json` needed. Vercel auto-detects Next.js from `next.config.js`. Key points:
- `output: 'standalone'` was removed (Vercel handles this internally)
- Image remote patterns in `next.config.js` remain
- Build command: Vercel runs `next build` automatically

## 6. Backend Lifecycle

### Development
```bash
cd backend
npm install
npm run start:dev  # → http://localhost:4000 (hot-reload)
```

### Build
```bash
npm run build      # Output: dist/*
```

### Deploy to Hostinger

**Via hPanel (manual):**
1. Login to hPanel → Hosting → Manage
2. Go to Advanced → Node.js
3. Select domain: `api.fieldserviceit.com`
4. Set:
   - Document Root: `backend`
   - Entry Point: `dist/main.js`
   - Build Command: `npm ci --omit=dev && npm run build`
   - Node Version: 20
5. Click Save → Wait for build → Click Start

**Via GitHub (hostinger hPanel → Git):**
1. Connect GitHub repo in hPanel
2. Set same config as above
3. Auto-deploys on push to `master`

### Health Check
```bash
curl https://api.fieldserviceit.com/v1/health
# → {"status":"ok","timestamp":"..."}
```

### API Docs
```bash
# Visit in browser (only if SWAGGER_ENABLED=true):
https://api.fieldserviceit.com/docs
```

## 7. DNS Configuration

### Current Setup
- `api.fieldserviceit.com` → Hostinger IP (A record)
- `fieldserviceit.com` → Hostinger IP (old) → needs update

### For Vercel (frontend)
1. In Vercel dashboard → Project → Domains
2. Add `fieldserviceit.com`
3. Vercel will show you the CNAME target (e.g. `cname.vercel-dns.com`)
4. In your DNS provider (Namecheap / where domain is registered):
   - Add CNAME record: `fieldserviceit.com` → `cname.vercel-dns.com`
   - Or update A records to Vercel's IPs (shown in Vercel dashboard)

### For Hostinger (backend) - already set
- `api.fieldserviceit.com` → A record → Hostinger's IP

## 8. First-Time Deploy Checklist

- [ ] Backend: MySQL database created in hPanel
- [ ] Backend: `.env` variables set in hPanel Node.js settings
- [ ] Backend: Domain `api.fieldserviceit.com` pointed to Hostinger
- [ ] Backend: Build command configured in hPanel
- [ ] Backend: `https://api.fieldserviceit.com/v1/health` returns `{"status":"ok"}`
- [ ] Frontend: Vercel project created from GitHub
- [ ] Frontend: `NEXT_PUBLIC_API_URL` set in Vercel env vars
- [ ] Frontend: Vercel deployment succeeds
- [ ] Frontend: `fieldserviceit.com` domain added to Vercel
- [ ] DNS: CNAME record created for `fieldserviceit.com` → Vercel
- [ ] Verify: `https://fieldserviceit.com` loads the app
- [ ] Verify: Login works (connects to `api.fieldserviceit.com`)

## 9. Troubleshooting

### Backend 502/503
- Check hPanel → Node.js section → is app running?
- Click Restart
- Check Build Log for errors

### Frontend can't connect to API
- Check `NEXT_PUBLIC_API_URL` in Vercel env vars
- Check `CORS_ORIGIN` in backend env vars (must match frontend URL)
- Check `https://api.fieldserviceit.com/v1/health` directly

### Database connection errors
- Check MySQL credentials in hPanel
- Database host is usually `localhost` on Hostinger shared hosting
- Confirm the backend user can create/alter tables, then restart the backend so startup table checks run

### SSL/HTTPS issues
- Vercel provides SSL automatically for frontend
- Hostinger provides auto-SSL for `api.fieldserviceit.com`
- If CORS error, verify `CORS_ORIGIN` matches exactly (including https://)

### Build fails on Hostinger
- Check Node version (must be 20)
- Check build command syntax
- Check `npm ci --omit=dev` works (not `npm install`)
- Confirm `DATABASE_URL` is a valid MySQL URL and `npm run build` succeeds locally

## 10. Quick Deploy Commands

```bash
# Backend (manual via Hostinger hPanel)
# 1. Push code to GitHub
# 2. hPanel → Git → pull latest
# 3. Build command runs automatically

# Frontend (manual via Vercel CLI)
cd frontend
npx vercel --prod

# Or auto-deploy on GitHub push (if connected to Vercel)
# Just git push and Vercel auto-builds
```
