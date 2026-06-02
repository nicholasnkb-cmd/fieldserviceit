# Deployment Health and Rollback

This runbook is for production deploys on Hostinger for:

- Frontend: `https://fieldserviceit.com`
- Backend API: `https://api.fieldserviceit.com`

## Deploy Health Gate

Run this after every frontend or backend deployment:

```bash
node scripts/deploy-health-gate.mjs
```

Useful environment overrides:

```bash
HEALTH_BASE_URL=https://fieldserviceit.com
HEALTH_API_URL=https://api.fieldserviceit.com
HEALTH_ATTEMPTS=8
HEALTH_DELAY_MS=10000
HOSTINGER_API_TOKEN=...
node scripts/deploy-health-gate.mjs
```

The gate checks:

- Frontend shell routes: `/`, `/login`, `/network`, `/topology`, `/status`
- Frontend runtime endpoint: `/api/client-health`
- Backend health: `/v1/health`
- Protected API registration: `/v1/topology/summary`
- Optional latest Hostinger frontend/backend build state when `HOSTINGER_API_TOKEN` is set

Any unexpected `503`, `500`, or missing route should block release acceptance.

## Status Page

Open:

```text
https://fieldserviceit.com/status
```

The page checks frontend runtime, backend API, database status, monitoring worker status, and key route availability. It refreshes every 60 seconds.

## Static Shell Rule

Authenticated app pages are client-rendered dashboards and should stay static shells on Hostinger.

Run:

```bash
node scripts/assert-static-app-shells.mjs
```

Do not add this to authenticated app routes without review:

```ts
export const dynamic = 'force-dynamic';
```

That setting caused Hostinger runtime `503` responses for authenticated pages on June 2, 2026.

## Rollback Steps

1. Identify the last known-good commit:

```bash
git log --oneline -10
```

2. Revert the bad commit without rewriting history:

```bash
git revert <commit-sha>
```

3. Push main and the affected deployment subtree:

```bash
git push origin master
git subtree push --prefix frontend frontend-origin master
git subtree push --prefix backend backend-origin master
```

Only push the subtree that changed.

4. Trigger or wait for Hostinger Git deployment.

5. Run the health gate:

```bash
node scripts/deploy-health-gate.mjs
```

6. Verify these manually:

```text
https://fieldserviceit.com
https://fieldserviceit.com/login
https://fieldserviceit.com/network
https://fieldserviceit.com/status
https://api.fieldserviceit.com/v1/health
```

## Hostinger 503 Triage

If build logs are successful but the site returns `503`:

1. Check whether the issue is frontend, backend, or both:

```bash
node scripts/deploy-health-gate.mjs
```

2. If only authenticated frontend routes fail, check for forced dynamic SSR.

3. If all frontend routes fail, check Hostinger Node.js app runtime/startup and redeploy frontend.

4. If API health fails, redeploy backend and verify `/v1/health`.

5. Do not stack multiple deploys while a Hostinger build is pending or running.
