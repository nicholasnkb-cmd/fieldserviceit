# Production Operations Runbook

## Pre-deploy

1. Confirm the latest encrypted backup completed, exists in off-site S3 storage, and passed an integrity/restore test.
2. Record the currently deployed backend and frontend image tags.
3. Run CI, migration validation, and `node scripts/security-deployment-check.mjs`.
4. Confirm alert receivers and the on-call owner.

## Deploy

1. Build backend and frontend images with the Git commit SHA as the immutable tag. Never deploy `latest`.
2. Apply database migrations before shifting traffic when they are backward-compatible.
3. Start the new containers and wait for health checks.
4. Run login, refresh, ticket, asset, permission, upload, and notification smoke tests.
5. Shift traffic only after the smoke tests pass.


## Rollback

1. Stop traffic to the failed release.
2. Redeploy the previously recorded immutable image tags.
3. Prefer roll-forward for database changes. Run a down migration only when it was written and rehearsed before deployment.
4. If data restoration is required, restore into an isolated database first, validate it, take a final snapshot, and then perform the approved cutover.
5. Repeat smoke tests and record the incident timeline.


## Dependency outage

- Database: stop writes, preserve evidence, and follow the provider escalation path.
- ClamAV: uploads must fail closed; do not disable `CLAMAV_REQUIRED` in production.
- Off-site backup storage: alert immediately; preserve local encrypted artifacts until off-site delivery recovers.
- SMTP: queue/retry notifications and monitor delivery failures.
- Sentry/log shipping: treat loss of production visibility as a degraded deployment.

## Load-test command

Run against staging with a dedicated least-privilege account:

```powershell
$env:BASE_URL='https://staging-api.example.com'
$env:LOAD_EMAIL='load-test@example.com'
$env:LOAD_PASSWORD='<from secret manager>'
k6 run load-tests/critical-paths.js
```

Record p95 latency, error rate, database connection-pool saturation, CPU/memory, and the first saturated resource. Never run this profile against production without an approved window.
