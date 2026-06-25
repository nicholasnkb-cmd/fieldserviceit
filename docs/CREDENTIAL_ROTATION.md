# Production Credential Rotation

Use this runbook because a previous local handoff file contained production-looking database and JWT values. Treat those values as compromised even if the file was later ignored or removed from the current tree.

## 1. Rotate the MySQL application password

1. Create a new strong password in the Hostinger database controls or with an authorized MySQL administrator.
2. Update the application database user password.
3. Update `DATABASE_URL` in the protected Hostinger backend environment.
4. Redeploy the backend and confirm `GET /v1/health` returns a healthy response.
5. Run the authenticated production smoke tests.
6. Revoke the previous password after the new connection is verified.

## 2. Rotate JWT secrets

Generate separate values for access and refresh tokens:

```powershell
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Set the results as `JWT_SECRET` and `JWT_REFRESH_SECRET` in the protected Hostinger backend environment, then redeploy. Existing sessions should be expected to expire.

## 3. Review other production credentials

Rotate any credential that may have appeared in logs, handoff files, copied environment files, or repository history:

- SMTP password and email webhook secret
- PayPal client secret and webhook ID
- S3 access keys
- OIDC client secrets
- RMM and network vendor credentials
- Production smoke-test account password

## 4. Verify

```powershell
$env:SMOKE_EMAIL = "<production smoke account>"
$env:SMOKE_PASSWORD = "<password from password manager>"
$env:SMOKE_MUTATIONS = "false"
node scripts/production-smoke.mjs
```

Confirm login, registration, refresh, logout, health, email, billing, and integration workflows as applicable. Keep all replacement values only in the password manager and protected hosting environment.
