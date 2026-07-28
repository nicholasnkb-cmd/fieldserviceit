# Strategic Review Remediation Status

This file separates repository changes from evidence that requires a deployed environment or real
business activity. A control is not complete merely because implementation exists.

## Completed in the repository

- Canonical versioned product catalog for plans, prices, limits, and entitlements.
- Generated backend/frontend catalog definitions with CI drift detection.
- Homepage, structured metadata, registration fallbacks, and both seed paths use the catalog.
- Current MSP-first positioning and workflow-review CTA.
- Marketing drafts quarantined; approved/prohibited claim register added.
- CI public-claim gate for obsolete pricing and unsupported outcome/compliance claims.
- Plaintext deployable Kubernetes secret manifest removed and replaced with a non-deployable example.
- RMM request DTOs and provider credential allowlists, value limits, and HTTPS policy.
- Prisma/runtime schema ownership documented.
- Oversized-module ratchet and decomposition plan documented.
- Paid-plan feature entitlements are enforced by the global API guard and resolved consistently for navigation visibility.
- The Business catalog explicitly covers every guarded product route; billing remains available for account recovery.
- RMM synchronization uses a database advisory lock to prevent cross-instance overlap, bounded exponential retries, attempt history, and tenant-scoped replay.

## Implemented previously and retained

- Database-backed rate limits/login-abuse state.
- Explicit SQL migrations, startup checks, off-site backups, and restore-drill support.
- Durable email delivery and synchronization history.
- Deployment, staging, rollback, uptime, security, compliance, and recovery workflows.
- Tenant/permission coverage checks, PWA/browser tests, Sentry/SIEM options, and accessibility gates.

## Must be proven for a release candidate

- Clean install plus oldest-supported upgrade against production-equivalent MySQL.
- Full E2E tenant-isolation matrix for the exact release SHA.
- Remote backup restore with recorded integrity, RPO, and RTO.
- Backward-compatible application rollback or documented forward recovery for every migration.
- Load test at defined concurrency with p95, error-rate, query-count, and pool-saturation evidence.
- PayPal renewal, failure, cancellation, replay/idempotency, reconciliation, and entitlement evidence.
- Degraded provider behavior and synthetic user-journey monitoring.
- Real iOS/Android PWA verification and external penetration testing.

## Requires business or professional action

- Customer discovery, paid design partners, case studies, and measured outcome claims.
- Legal review, insurance, tax/payment policy, DPA/subprocessor review, and certification decisions.
- Production credentials, external secret manager, DNS/TLS, alert destinations, and on-call ownership.
- Competitor research and ad-platform audience validation at campaign launch time.

These items cannot be truthfully marked fixed by a code change. They remain launch gates until dated
evidence and an accountable owner are attached to the release.
