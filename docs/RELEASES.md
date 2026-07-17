# Release, Staging, and Rollback Runbook

## Release path

`master` is the validated source of truth. The production workflow builds and tests both applications, runs Hostinger and security preflight checks, then synchronizes each application into its dedicated deployment repository through a normal pull request. It never force-pushes a protected branch.

The production environment should require approval in GitHub. The approver must verify the staged release, migration compatibility, required environment variables, and rollback target before allowing the deployment PRs to merge.

Required production secrets:

- `DEPLOY_REPOS_TOKEN`: fine-grained `Contents: write` and `Pull requests: write` permission on both deployment repositories so each application can publish independently.
- `HOSTINGER_API_TOKEN`: Hostinger API preflight access.
- `MONITORING_API_KEY`: matches the backend monitoring key.
- `VERIFICATION_EMAIL` and `VERIFICATION_PASSWORD`: dedicated least-privilege production account used to verify login and profile hydration. Permission-scoped tenant reads also run when that account is deliberately assigned an administrator role.
- `OPERATIONS_ALERT_WEBHOOK_URL` (recommended): Slack-compatible or Microsoft Teams incoming webhook used for deployment, availability, rollback, and restore-drill alerts. GitHub incidents and configured SMTP administrator alerts remain active without it.

Required or recommended production variables:

- `HOSTINGER_EXPECTED_DOMAINS`
- `VERIFICATION_WEB_URL`
- `VERIFICATION_API_URL`
- `REQUIRE_AUTHENTICATED_VERIFICATION=true`

## Staging

Pushes to `develop` run the same builds, permission coverage, tenant SQL, size, unit, accessibility, lint, and production compilation gates. Configure the `staging` GitHub environment with:

- `STAGING_WEB_URL` and `STAGING_API_URL` variables.
- `STAGING_VERIFICATION_EMAIL` and `STAGING_VERIFICATION_PASSWORD` secrets.

When the URL variables are configured, the workflow also runs the non-mutating deployment verification against staging. Staging should use a separate database and credentials; never point it at production data.

## Rollback

1. Identify the last known-good merge commit in both deployment repositories.
2. Use GitHub's **Revert** action (or a normal revert PR) against the failed deployment PR. Do not rewrite `master`.
3. Merge the revert PR after its checks pass; Hostinger will redeploy that history-preserving commit.
4. Run `node scripts/production-verification.mjs` with production URLs.
5. Record the failed monorepo SHA, deployment PRs, symptoms, rollback SHAs, and any database migration impact.

Database changes must be backward compatible for at least one release. Destructive column/table removal requires a later cleanup release after the old application version is no longer a rollback target.

Optional security integrations must not make the API fail at startup. `CLAMAV_REQUIRED=true` makes uploads fail closed unless `CLAMAV_HOST` is configured. Offsite backup operations remain unavailable until all `BACKUP_S3_*` connection values are present. Credential-encryption operations fail closed when `CREDENTIAL_ENCRYPTION_KEY` is absent, while readiness reports the degraded capability.

## Release evidence

Every release retains:

- the immutable monorepo commit SHA;
- backend and frontend deployment PR URLs;
- check results and environment approval;
- Hostinger preflight output;
- production verification output.
- a database-backed deployment event with release SHA, workflow URL, duration, component results, and rollback state, visible at `/admin/system#deployment-history`.

After Hostinger completes a backend build, the workflow explicitly restarts the Node.js service and waits until `/v1/health/live` reports the exact expected commit. Failed verification uses an auditable `git revert` on `master`; protected deployment repositories are never force-pushed.

## Observability checks

The backend emits one structured `request_performance` event per request with total duration, query count, aggregate database time, slowest query, correlation ID, user, and company context. Requests at or above `DB_QUERY_COUNT_WARN` (default `25`) are warnings. Responses also include `Server-Timing` for application and database duration.

The detailed health dashboard remains available at `/v1/health/dashboard` with administrator authentication or `X-Monitoring-Key`. Alert on readiness failures, sustained error-rate growth, slow-query growth, deployment verification failure, and repeated `best_effort_failure` or `audit_log_write_failed` events.
