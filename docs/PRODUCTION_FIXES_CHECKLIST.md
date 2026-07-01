# FieldserviceIT — Production Readiness Checklist

This document is a launch gate, not just a backlog. Every **Launch Blocker** and
**Launch Verification** item must be checked off with evidence before production
traffic is enabled. Record links to logs, test runs, dashboards, or runbooks in
the evidence field.

## Launch Blockers

- [ ] **LB-01 — Production secrets fail closed**
  - Remove production fallbacks for database, JWT, root, and encryption secrets from `infra/docker-compose.yml`.
  - Require `CREDENTIAL_ENCRYPTION_KEY` in production; do not fall back to `JWT_SECRET` (`backend/src/common/security/encryption.ts`).
  - Store secrets outside source control and verify startup fails when any required production secret is absent or weak.
  - Document credential-encryption key rotation using `CREDENTIAL_ENCRYPTION_KEY_PREVIOUS` and test one rotation.
  - Evidence: production fallbacks removed, independent keys enforced at startup, rotation tested, and environment/runbook templates updated; secret-manager configuration remains pending.

- [ ] **LB-02 — Database backups and restore are proven**
  - Create automated, encrypted backups to storage outside the application host with 30-day retention.
  - Alert on failed or stale backups and restrict backup access to the deployment identity.
  - Restore a backup into an isolated database and record recovery time and recovered data timestamp.
  - Set and approve RPO/RTO targets.
  - Evidence: off-site S3 delivery, encrypted retrieval, 30-copy retention migration, and scheduled failure logging implemented in `PlatformSecurityService`; live backup/restore drill still pending.

- [ ] **LB-03 — Production ingress and TLS are defined**
  - Decide whether Hostinger/managed ingress or repository-owned nginx terminates TLS; do not add a second proxy without need.
  - Verify HTTPS redirect, certificate renewal, request-size limits, timeouts, trusted proxy handling, and API/frontend routing.
  - Ensure MySQL and backend ports are not publicly exposed unless explicitly required.
  - Evidence: nginx limits/timeouts and trusted proxy handling implemented; Compose exposes only nginx publicly. Native config, certificate renewal, and live TLS verification remain pending.

- [ ] **LB-04 — Authentication abuse controls persist across replicas/restarts**
  - Move login lockout and active throttling state from process memory to Redis or another shared store.
  - Define lockout duration, reset behavior, proxy-aware client identification, and protection against username enumeration.
  - Test restart, multi-replica, IPv4/IPv6, and `X-Forwarded-For` behavior.
  - Evidence: shared `LoginAbuseState` and `RateLimitState` migrations plus database-backed throttler storage implemented; staging restart/multi-replica verification still pending.

- [ ] **LB-05 — SQL identifiers are injection-safe**
  - Keep the identifier allowlist in `DatabaseService.escapeColumn` and add focused malicious-input tests.
  - Audit other dynamic identifiers, including the knowledge-base service, table names, sorting, grouping, and filter operators.
  - Evidence: _pending_

- [ ] **LB-06 — File uploads are hostile-input safe**
  - Enforce per-file/request size limits, extension/MIME allowlists, and magic-byte validation.
  - Require malware scanning in production and fail closed when the scanner is unavailable.
  - Store files outside the executable web root, generate server-side names, and prevent path traversal and active-content execution.
  - Add tests for renamed executables, oversized files, traversal names, and scanner failure.
  - Evidence: extension/MIME/magic-byte checks, server-generated names, protected tenant paths, production-required ClamAV, and hostile-input tests implemented; live ClamAV outage test still pending.

- [ ] **LB-07 — Authorization is enforced by the API**
  - Test tenant isolation and ABAC/RBAC denial paths for tickets, assets, uploads, reports, admin operations, and direct-object access.
  - Treat frontend route middleware as UX hardening only; every sensitive backend operation must independently authorize the caller.
  - Evidence: _pending_

- [ ] **LB-08 — Production container configuration is valid**
  - Fix and validate `infra/docker-compose.yml`, including service indentation, required environment variables, health checks, and production-safe defaults.
  - Disable database seeding and local-only services/defaults in production.
  - Pin deployable image versions or digests and run containers as non-root where supported.
  - Evidence: production Compose requires secrets/dependencies, disables seeding, removes local MailHog and direct database/app exposure, and parses as YAML; native `docker compose config` remains pending.

- [ ] **LB-09 — Database capacity is measured, not guessed**
  - Size the connection pool from database connection limits, replica count, worker count, and load-test concurrency.
  - Add acquisition/query timeouts and observe pool saturation; do not blindly change the pool from 5 to 20+.
  - Evidence: _pending_

- [ ] **LB-10 — Request validation is complete**
  - Retain `whitelist: true` and `forbidNonWhitelisted: true` in `backend/src/main.ts`.
  - Enable `transform: true` only after DTO coercion tests cover booleans, numbers, arrays, dates, and invalid values.
  - Confirm every external write endpoint uses explicit DTO validation.
  - Evidence: _pending_

## Launch Verification

- [ ] **LV-01 — CI is a required merge gate** — lint, type-check, unit tests, integration tests, production builds, dependency/security scanning, and migration validation all pass.
- [ ] **LV-02 — Deployment and rollback are rehearsed** — automate image build/deploy, use immutable versions, and successfully execute a rollback in staging.
- [ ] **LV-03 — Database migrations are rehearsed** — test forward migration against production-like data, document rollback/roll-forward behavior, and verify backups before migration.
- [ ] **LV-04 — Critical-path smoke tests pass** — login/logout/refresh, ticket lifecycle, asset access, permissions, uploads, notifications, and health endpoints pass after deploy.
- [ ] **LV-05 — Load limits are known** — k6 scenarios and thresholds are defined in `load-tests/critical-paths.js`; run them in staging and record latency/error targets, pool saturation, and the first saturated resource.
- [ ] **LV-06 — Observability is operational** — centralized structured logs, correlation IDs, error tracking, metrics, dashboards, and alerts work from a deployed environment.
- [ ] **LV-07 — Security headers are verified** — frontend per-request nonce/`strict-dynamic` CSP is implemented and script `unsafe-inline`/`unsafe-eval` are removed in production; scan the live HTTPS response headers before checking this gate.
- [ ] **LV-08 — Recovery runbook is usable** — procedures are documented in `docs/PRODUCTION_OPERATIONS_RUNBOOK.md`; have someone other than the author execute and sign off on them.
- [ ] **LV-09 — Security review is complete** — perform automated scanning plus targeted review of OIDC, tenant isolation, ABAC/RBAC, uploads, SSRF, injection, and session/token handling; triage all findings.

## Post-Launch Engineering

- [ ] **PE-01 — Fix rate-limit response metadata** — replace the guard's `X-RateLimit-Remaining: unknown` with storage-backed remaining/reset values and test headers on allowed and rejected requests.
- [ ] **PE-02 — Remove N+1 query paths** — profile first, then replace confirmed hotspots with joins/batching and add query-count regression tests.
- [ ] **PE-03 — Add `DatabaseService` characterization tests** — cover query construction, tenant scoping, transactions, error mapping, and dynamic identifier rejection before refactoring.
- [ ] **PE-04 — Split `DatabaseService` incrementally** — extract one domain repository at a time behind existing interfaces; preserve behavior with characterization tests.
- [ ] **PE-05 — Split `CmdbService` incrementally** — extract Asset, Network, MDM, and Alert services with module-level tests and no cross-tenant behavior changes.
- [ ] **PE-06 — Thin the tickets controller** — move business rules into tested services while controllers retain transport/validation responsibilities.
- [ ] **PE-07 — Reduce unsafe TypeScript boundaries** — establish a baseline, prohibit new explicit `any` in changed production files, and remove existing uses by module starting at API boundaries.
- [ ] **PE-08 — Standardize frontend server state** — pilot React Query or SWR on one high-traffic screen, define cache/error/loading conventions, then migrate incrementally.
- [ ] **PE-09 — Standardize complex forms** — pilot `react-hook-form` plus `zod` on one complex form and reuse schemas where client/server semantics align.
- [x] **PE-10 — Add frontend route middleware** — cookie-presence navigation gating and nonce CSP are implemented; backend authorization remains the security boundary.

## Tracking

| Gate | Total | Done | Remaining | Launch requirement |
|------|------:|-----:|----------:|--------------------|
| Launch Blockers | 10 | 0 | 10 | All required |
| Launch Verification | 9 | 0 | 9 | All required |
| Post-Launch Engineering | 10 | 1 | 9 | Scheduled, not blocking |
| **Total** | **29** | **1** | **28** | |

## Launch Decision

- Decision: **NO-GO** until all LB and LV items have checked evidence.
- Target environment: _TBD_
- Owner: _TBD_
- Review date: _TBD_
- Approved by: _TBD_
