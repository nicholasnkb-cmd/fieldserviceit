# Security Hardening

## Route authorization

Every authenticated controller route must use one of:

- `@RequirePermissions(...)` for permission-controlled operations.
- `@AuthorizationExempt('reason')` when tenant, role, feature, self-service, or resource ownership checks are the intended boundary.

`npm run check:permissions` fails when an authenticated route has neither marker. There is no
grandfathered baseline.

Remaining exemptions are limited to self-service, ownership-filtered search/customer operations,
and monitoring access. Every exemption declares a responsible team and review date; CI rejects
missing or overdue exemption metadata.

## Credential storage

New refresh tokens, password-reset tokens, email-verification tokens, MDM enrollment tokens,
and device credentials are stored as SHA-256 hashes. The raw value is returned or emailed once.

Legacy plaintext credentials remain readable during migration:

- A successful refresh rotates the legacy value into hashed storage.
- A used refresh-token hash is recorded in `SessionRefreshHistory`.
- Reuse of a rotated refresh token revokes the user's active session family.
- Legacy reset, verification, enrollment, and device values continue to validate until used or expired.

Migration: `029_credential_token_hardening.sql`.

Domain authorization migration: `031_domain_permission_enforcement.sql`.

## Tenant isolation

Tenant-scoped services must:

1. Take the effective `companyId` from `TenantGuard`, never an unchecked client header or body.
2. Include `companyId` in every read, update, and delete predicate.
3. Use helpers from `src/database/query-builders.ts` for composed Prisma-style filters.
4. Verify resource ownership before secondary operations such as attachments, commands, or exports.

Cross-tenant guard and query-builder tests run in the backend unit suite. Database-backed tenant
tests remain in the e2e suite.

## Typed repositories

Security-sensitive SQL contracts are isolated in:

- `AuthorizationRepository`, which returns a stable `{ roleId, slug }` permission shape.
- `SessionRepository`, which owns refresh-token lookup, hashing, rotation history, reuse detection,
  and family revocation.

New security logic should extend these repositories instead of adding more Prisma-compatible
relation emulation to `DatabaseService`.

## Monitoring

`/v1/health`, `/v1/health/live`, and `/v1/health/ready` remain public probes.

`/v1/health/dashboard` requires:

- an authenticated `SUPER_ADMIN` or `TENANT_ADMIN`, or
- `X-Monitoring-Key: <MONITORING_API_KEY>`.

Generate a monitoring key with at least 24 random characters and rotate it through the deployment
secret manager.

Production validation requires the repository environment secret `MONITORING_API_KEY`. The backend
startup migration runner applies migrations `029` and `031`; deployment must not bypass backend
startup migration execution.
