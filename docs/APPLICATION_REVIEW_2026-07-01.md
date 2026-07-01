# FieldserviceIT Application Review — 2026-07-01

## Executive assessment

FieldserviceIT has broad product capability and solid security foundations, but it should remain **NO-GO for production** until staging proves migrations, off-site restore, authorization isolation, load capacity, TLS, and rollback. The repository builds cleanly, the frontend test/lint/build pipeline passes, and both production dependency audits currently report zero known vulnerabilities.

The earlier `COMPREHENSIVE_ANALYSIS.md` is now partly stale: encrypted off-site backups, nginx, persistent login lockouts, shared rate limiting, upload validation, load-test definitions, and recovery documentation have since been implemented.

## Implementation update

The follow-up hardening pass completed repository-side portions of recommendations 1, 4, 5, 6, 7, 12, and 16: database/migration startup now fails closed; logical backups use a repeatable-read consistent snapshot; dynamic identifiers share one validator; authorization exemptions are inventoried by CI; pool/queue/query limits are configurable; frontend scripts use a nonce CSP; and server middleware gates protected navigation. The existing Hostinger validation/deployment workflow was confirmed during review. Live staging evidence and the larger incremental refactors remain open.

## Current evidence

- 297 backend source files and 144 frontend source files.
- 57 test files.
- Backend: 41 unit suites and 191 tests discovered; 188 passed on the first full run and three email tests exposed a missing production encryption-key fixture, which was corrected.
- Frontend: 12 suites and 46 tests pass; ESLint and the optimized Next.js build pass.
- Production dependency audits: zero low, moderate, high, or critical findings in both lockfiles at review time.
- 71 frontend pages, 58 explicitly client-rendered pages, 118 `useEffect` calls, and 96 `useState`/state patterns involving `any`.
- 1,409 explicit `any`/`as any`/`<any>` occurrences across application source.
- 43 authorization exemptions requiring governance and expiry review.
- Largest risk concentrations: `DatabaseService` (2,888 lines), `CmdbService` (1,853), `AdminService` (1,806), network page (1,573), permissions page (1,472), and migration service (1,526).

## P0 — before production

### 1. Fail startup when the database or migrations fail

`DatabaseService.onModuleInit()` catches connection/migration errors, logs a warning, and allows startup to continue. A deployment can therefore appear alive while its schema is unavailable or incomplete. Re-throw in production, separate liveness from readiness, and make readiness fail until connectivity and required migrations are confirmed.

### 2. Complete staging proof, not just implementation

Apply migrations `037`–`040` to a production-like MySQL instance. Run at least two backend replicas, restart one during throttling/lockout tests, validate nginx/TLS and proxy IP behavior, exercise ClamAV failure, and attach results to `PRODUCTION_FIXES_CHECKLIST.md`.

### 3. Prove recovery from the off-site artifact

The application now uploads encrypted backups and retrieves the off-site copy for integrity testing. A real drill must restore into an isolated database, compare tenant/table counts and critical records, record RPO/RTO, and test with the local artifact absent. Enable bucket versioning, retention/lifecycle policy, access logging, and preferably object lock.

### 4. Establish a transaction-consistent database backup

The application backup reads every table into memory through independent queries. It is not transaction-consistent and may exhaust memory as data grows. Keep it as a portable logical export, but make provider snapshots or `mysqldump --single-transaction`/equivalent the canonical disaster-recovery backup.

### 5. Finish the dynamic-SQL identifier audit

Most values are parameterized and `escapeColumn()` validates identifiers, but some paths construct identifiers independently, including `RolePermission.createMany` and dynamic CMDB updates. Replace every alternate quoting pattern with a single identifier allowlist API and add malicious-key regression tests.

### 6. Review all authorization exemptions

There are 43 `@AuthorizationExempt` uses. Export them in CI, require an owner, rationale, and expiry, fail CI on expired exemptions, and run cross-tenant denial tests for every exempt controller path.

## P1 — first production milestone

### 7. Make database capacity configurable and bounded

The pool is fixed at five connections with an unbounded wait queue. Add validated environment settings for pool size and queue/acquisition/query timeouts. Choose values from staging load results, database limits, replica count, and worker count—not a hard-coded “20+”.

### 8. Refactor the custom data layer behind tested repositories

`DatabaseService` is a 2,888-line hand-built ORM and remains the largest correctness and maintenance risk. First add characterization/query-count tests, then extract domain repositories incrementally. Make the SQL migration files the single schema authority and retire duplicate `ensureTables()` definitions.

### 9. Measure and remove confirmed N+1 paths

Instrument query counts for tickets, assets, workflows, permissions, and timelines. Add regression budgets, batch relation loads, and use joins where cardinality is bounded. Do this before changing pool size so additional connections do not merely hide inefficient query shapes.

### 10. Complete deployment automation

CI now builds commit-tagged containers, but it does not push, deploy, smoke-test, shift traffic, or automatically roll back. Add environment protection, immutable registry tags/digests, migration gates, post-deploy smoke tests, and a rehearsed rollback job.

### 11. Centralize production telemetry and alerts

Structured logs, correlation IDs, Sentry, health endpoints, and scheduled backup failure logging exist. Ship logs/metrics off-host and alert on readiness failure, authentication spikes, 5xx rate, latency, pool saturation, backup age/failure, ClamAV outage, queue failures, and missing telemetry.

### 12. Remove CSP escape hatches

The frontend still allows `unsafe-inline` and `unsafe-eval`; the backend allows inline scripts/styles. Introduce per-request nonces or hashes, test required third-party scripts, and deploy CSP reporting before enforcing the stricter policy.

## P2 — engineering health

### 13. Reduce type erosion at boundaries

With 1,409 explicit `any` patterns, a wholesale cleanup is unrealistic. Prohibit new `any` in changed production files, type authentication/session/tenant objects first, then DTOs and repository results. Catch values should be `unknown`.

### 14. Break up the largest services and pages

Prioritize `DatabaseService`, `CmdbService`, `AdminService`, the network page, and the permissions page. Extract by business capability with characterization tests; avoid size-only refactors that simply move coupling between files.

### 15. Standardize frontend server state and forms

The frontend has 118 effects and many manual loading/error/cache paths. Pilot React Query or SWR on tickets/assets and `react-hook-form` plus Zod on one complex form, establish conventions, then migrate incrementally.

### 16. Add server-side route gating

Most pages are client components and there is no frontend middleware file. Add lightweight server/middleware gating to prevent protected-page flashes and improve navigation behavior, while retaining backend authorization as the only security boundary.

### 17. Replace silent failure swallowing with explicit policy

Many security auditing, notification, and integration paths use empty `.catch()` handlers. Classify each as best-effort or required, emit structured failure metrics for best-effort work, and fail/queue/retry required operations.

### 18. Expand confidence gates

Add coverage thresholds for high-risk modules, WebSocket tests, backup S3 tests, migration tests against MySQL, query-count tests, and page tests for the largest workflows. Run the supplied k6 profile in staging and preserve results as release evidence.

## Recommended execution order

1. Make database/migration failure fail readiness and production startup.
2. Run migrations and multi-replica security tests in staging.
3. Complete an isolated off-site restore drill and configure bucket protections.
4. Run k6 and tune pool/queries from measured saturation.
5. Rehearse immutable deploy and rollback.
6. Close the dynamic-SQL and authorization-exemption audits.
7. Begin repository/type/frontend refactors as incremental, test-protected work.
