# Platform Security Operations

## Identity

- TOTP MFA uses 30-second, six-digit codes and stores authenticator secrets with AES-256-GCM.
- Recovery codes are one-time values stored only as SHA-256 hashes.
- MFA removal requires both the current password and a valid authenticator or recovery code.
- Active sessions are device-labeled, revocable, checked on every authenticated request, and capped by policy.
- OIDC sign-in uses discovery, state, nonce, PKCE, signed ID-token verification, verified email checks, domain restrictions, and one-time login exchange codes.
- OIDC issuers must use HTTPS. Private and reserved network destinations are blocked unless `OIDC_ALLOW_PRIVATE_ISSUERS=true` is deliberately configured.
- When MFA is mandatory for a role, OIDC sign-in requires the provider's `amr` claim to confirm an MFA-capable method.

## Backups and retention

- Manual and weekly scheduled backups export application tables to a gzip-compressed, AES-256-GCM encrypted artifact outside the public upload path.
- Backup history exposes checksums and metrics but never server filesystem paths.
- Restore tests verify the artifact checksum, decrypt and decompress it, recreate every table in connection-scoped MySQL temporary tables, reload every backed-up row, verify per-table counts, and drop the isolated session without modifying production tables.
- `.github/workflows/disaster-recovery-drill.yml` runs the latest-backup restore drill weekly and retains evidence for 90 days. Failures create administrator, GitHub, SMTP, and optional operations-webhook alerts.
- Retention cleanup covers expired sessions, audit logs, client errors, email tracking, network snapshots, and syslog events.
- Backups fail closed unless an encrypted artifact is also uploaded to configured S3-compatible off-site storage. Configure `BACKUP_S3_ENDPOINT`, `BACKUP_S3_REGION`, `BACKUP_S3_BUCKET`, `BACKUP_S3_ACCESS_KEY_ID`, and `BACKUP_S3_SECRET_ACCESS_KEY`, then run a backup and isolated restore drill from Security Operations.
- Enable bucket versioning, retention/lifecycle protection, access logging, and object lock where the storage provider supports them. The application readiness score remains blocked until all required connection values are present.

## Upload scanning

- Extension, MIME, magic-byte, and executable-content checks remain mandatory.
- When `CLAMAV_HOST` is configured, files are streamed to `clamd` with `INSTREAM` before storage.
- Set `CLAMAV_REQUIRED=true` to fail closed if the scanner is unavailable.
- Keep the ClamAV TCP service on a private network; the protocol does not authenticate clients.

## Network approvals

- Reboot, port disable, and PoE bounce actions enter `PENDING_APPROVAL`.
- The requester cannot approve their own action.
- Rejected or unapproved actions cannot execute.
- Backup, controller sync, and port enable actions remain directly queueable because they are recovery or read-oriented operations.

## External setup still required

- Add each identity provider's issuer, client ID, client secret, allowed domains, and callback URL in Security Operations.
- Place ClamAV on a private network and set the scanner environment variables.
- Provision S3-compatible storage in a separate failure domain and enter the five `BACKUP_S3_*` values in the backend production environment.
- Add Slack or Microsoft Teams from Permissions → Operations and security alerts, send a test message, and also store the same incoming webhook as the GitHub production secret `OPERATIONS_ALERT_WEBHOOK_URL` for deployment and uptime workflow alerts.
- Rotate exposed hosting, database, and mailbox credentials in their provider consoles.
