# Security Architecture

## Authentication & Authorization

| Concern | Implementation |
|---------|---------------|
| Auth Protocol | JWT (access) + Refresh Token rotation |
| OAuth2 Providers | Google, Microsoft, GitHub SSO |
| MFA | TOTP (authenticator app) or SMS |
| Password Policy | min 12 chars, bcrypt cost 12, breach check |
| Session | Redis-backed, configurable TTL |
| API Rate Limiting | Token bucket (100 req/min per user) |

## RBAC Model

```
SUPER_ADMIN → TENANT_ADMIN → TECHNICIAN → CLIENT → READ_ONLY
```

- Roles are hierarchical (higher inherits lower permissions)
- Custom roles per tenant (future)
- Permission checks at controller guard level

## Data Protection

| Category | Measure |
|----------|---------|
| In Transit | TLS 1.3, HSTS, mTLS between services |
| At Rest | MySQL volume/provider encryption where available |
| PHI/HIPAA | Encrypted columns for sensitive fields |
| Secrets | Vault or AWS Secrets Manager (never in env files) |
| API Keys | Hashed on storage, shown once on creation |

## Tenant Isolation

1. **Row-level:** `WHERE companyId = :currentUser.companyId` enforced in SQL repository methods
2. **Guard-level:** `TenantGuard` NestJS interceptor validates ownership
3. **Token-level:** JWT contains `companyId` claim, verified on every request
4. **Storage-level:** S3 prefixes per tenant: `uploads/{companyId}/{uuid}`

## Audit Trail

All mutating operations recorded in `audit_logs`:

```json
{
  "id": "uuid",
  "companyId": "uuid",
  "actorId": "uuid",
  "action": "ticket.update",
  "resourceType": "ticket",
  "resourceId": "uuid",
  "diff": { "status": { "old": "OPEN", "new": "ASSIGNED" } },
  "ip": "203.0.113.1",
  "userAgent": "Mozilla/...",
  "timestamp": "2026-05-11T15:00:00Z"
}
```

Audit logs are **append-only** (no DELETE, no UPDATE). Immutable.

## Compliance Readiness

- **HIPAA readiness:** configurable safeguards and six-year retention for compliance evidence; a signed BAA, formal risk analysis, provider agreements, and operating evidence are required before any HIPAA compliance claim.
- **SOC 2 readiness:** access reviews, change management, incident response, and evidence exports support a future independent examination.
- **Privacy readiness:** consent tracking, retention controls, and a deadline-tracked data-subject request workflow exist; legal review, identity-verification procedures, and jurisdiction-specific obligations remain operational responsibilities.
