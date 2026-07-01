# Production Credential Rotation

Use this runbook because a previous local handoff file contained production-looking database and JWT values. Treat those values as compromised even if the file was later ignored or removed from the current tree.

## 1. Rotate the MySQL application password

1. Create a new strong password in the Hostinger database controls or with an authorized MySQL administrator.
2. Update the application database user password.
3. Update `DATABASE_URL` in the protected Hostinger backend environment.
4. Redeploy the backend and confirm `GET /v1/health` returns a healthy response.
5. Verify the health endpoint and sign in with a production administrator account.
6. Revoke the previous password after the new connection is verified.

## 2. Rotate JWT secrets

Generate separate values for access and refresh tokens:

```powershell
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Set the results as `JWT_SECRET` and `JWT_REFRESH_SECRET` in the protected Hostinger backend environment, then redeploy. Existing sessions should be expected to expire.

## 3. Rotate the credential-encryption key

The credential-encryption key must be independent from both JWT secrets. To rotate it without making existing encrypted values unreadable:

1. Keep the current value temporarily as `CREDENTIAL_ENCRYPTION_KEY_PREVIOUS`.
2. Generate a new value and set it as `CREDENTIAL_ENCRYPTION_KEY`.
3. Run `npm run credentials:rotate` from the backend deployment with `DATABASE_URL` configured.
4. Verify encrypted integration credentials, MFA secrets, and encrypted backups can be read.
5. Remove `CREDENTIAL_ENCRYPTION_KEY_PREVIOUS` and redeploy.

Never rotate the encryption key by replacing it outright; existing ciphertext requires either the current or previous key during migration.

## 4. Review other production credentials

Rotate any credential that may have appeared in logs, handoff files, copied environment files, or repository history:

- SMTP password and email webhook secret
- PayPal client secret and webhook ID
- S3 access keys
- OIDC client secrets
- RMM and network vendor credentials
- Production administrator account password

## 5. Verify

Confirm the health endpoint, login, registration, refresh, logout, email, billing, and integration workflows as applicable. Keep all replacement values only in the password manager and protected hosting environment.
