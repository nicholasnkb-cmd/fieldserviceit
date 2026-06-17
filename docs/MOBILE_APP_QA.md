# Mobile App QA

FieldserviceIT ships as an installable Progressive Web App (PWA). The installed app reuses the production website, authenticated session cookies, and API routing.

## Install Checks

Run these checks before every production release:

- Open `https://fieldserviceit.com/manifest.webmanifest` and confirm `display` is `standalone`, `start_url` is `/dashboard?source=pwa`, and shortcuts include Technician Mobile, Tickets, and Dispatch.
- Open `https://fieldserviceit.com/offline.html` and confirm the offline fallback renders with the FieldserviceIT mark.
- Open `https://fieldserviceit.com/sw.js` and confirm the service worker references `/offline.html`.
- On Android Chrome, sign in and confirm the install prompt appears or that the browser menu offers Install app.
- On iPhone Safari, sign in and use Share, Add to Home Screen. Launch the saved app and confirm the status bar/web app chrome behaves like a standalone app.
- After installing, open the app from the home screen and confirm it starts on the dashboard when authenticated and redirects to login when unauthenticated.

## Mobile Workflow Checks

Validate these on at least one narrow viewport and one real phone:

- Login, logout, and expired-session redirect.
- Drawer navigation opens, closes, and does not create horizontal scrolling.
- Technician Mobile loads assigned dispatches and summary counts.
- Status updates work for Assigned, En route, On site, and Complete.
- Notes, parts usage, photo links, and customer sign-off submit without layout overlap.
- Tickets list, ticket detail, comments, and attachments remain usable on small screens.
- Camera and geolocation prompts appear only when a workflow explicitly requests them.

## Offline Behavior

The PWA caches the offline shell and static app assets. Authenticated data is not stored for offline editing.

Expected offline behavior:

- Previously visited pages may render from browser cache.
- New navigations without network fall back to `/offline.html`.
- Ticket, dispatch, inventory, photo, and sign-off changes require connectivity.
- Users should reconnect before assuming operational changes are synced.

## Automated Checks

Local frontend checks:

```bash
cd frontend
npm run lint
npm run build
npm run test:e2e:prod -- --grep "PWA"
```

Production smoke checks:

```bash
node scripts/production-smoke.mjs
```

Authenticated production checks require:

```bash
SMOKE_EMAIL=...
SMOKE_PASSWORD=...
SMOKE_API_URL=https://api.fieldserviceit.com
SMOKE_BASE_URL=https://fieldserviceit.com
```

Hostinger and monitoring checks require `HOSTINGER_API_TOKEN` and `MONITORING_API_KEY`.
