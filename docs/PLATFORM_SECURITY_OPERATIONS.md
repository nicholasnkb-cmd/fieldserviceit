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
- Integrity tests verify the artifact checksum, decrypt it, decompress it, and validate the backup manifest without modifying production data.
- Retention cleanup covers expired sessions, audit logs, client errors, email tracking, network snapshots, and syslog events.
- Local encrypted artifacts are not an off-site disaster recovery copy. Configure infrastructure-level or provider-managed off-site backups separately.

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
- Store backup artifacts on durable encrypted storage or add provider-managed off-site backups.
- Rotate exposed hosting, database, and mailbox credentials in their provider consoles.
