# Hostinger Deployment Checklist

## 1. Database

Create or verify the MySQL database in Hostinger:

```env
u209468809_fieldserviceit
```

Set the backend `DATABASE_URL` using the Hostinger username, password, host, and the database name:

```env
DATABASE_URL=mysql://u209468809_USERNAME:PASSWORD@HOST:3306/u209468809_fieldserviceit
```

## 2. Backend App

Deploy the `backend` folder as the Node.js app.

Required production variables:

```env
NODE_ENV=production
PORT=4000
FRONTEND_URL=https://fieldserviceit.com
CORS_ORIGIN=https://fieldserviceit.com
JWT_SECRET=replace-with-a-long-random-production-secret
STRIPE_SECRET_KEY=sk_live_replace_me
STRIPE_WEBHOOK_SECRET=whsec_replace_me
```

Optional PayPal subscription variables:

```env
BILLING_PROVIDER=PAYPAL
PAYPAL_CLIENT_ID=live_client_id
PAYPAL_CLIENT_SECRET=live_client_secret
PAYPAL_WEBHOOK_ID=live_webhook_id
PAYPAL_ENVIRONMENT=production
PAYPAL_SUBSCRIPTION_MANAGE_URL=https://www.paypal.com/myaccount/autopay/
```

Start command:

```bash
npm run start:prod
```

Populate the database once before first login:

```bash
npm run seed
```

The seed is idempotent. It updates existing starter rows and does not wipe customer data.

The API uses the `/v1` prefix. The health check is:

```text
https://api.fieldserviceit.com/v1/health
```

## 3. Frontend App

Deploy the `frontend` folder as the Next.js app.

Required production variable:

```env
NEXT_PUBLIC_API_URL=https://api.fieldserviceit.com
```

Build command:

```bash
npm run build
```

Start command:

```bash
npm run start
```

## 4. Stripe

Create live Stripe prices for:

- Starter: individual paid plan
- Business: company plan

Add the live Stripe price IDs in the Super Admin system controls page.

Create a Stripe webhook endpoint:

```text
https://api.fieldserviceit.com/v1/billing/webhook
```

Enable these events:

- `checkout.session.completed`
- `invoice.payment_succeeded`
- `customer.subscription.updated`
- `customer.subscription.deleted`

Copy the webhook signing secret into `STRIPE_WEBHOOK_SECRET`.

For PayPal subscriptions, create matching live PayPal plans for each billing interval you sell, save their plan IDs as `PAYPAL` price mappings in Super Admin system controls, and create a webhook endpoint:

```text
https://api.fieldserviceit.com/v1/billing/webhook/paypal
```

Enable subscription and sale/payment events, then copy the PayPal webhook ID into `PAYPAL_WEBHOOK_ID`.

## 5. Final Checks

In the app, open:

```text
/admin/system
```

Confirm Production readiness shows:

- Database: ok
- Stripe secret key: ok
- Stripe webhook: ok
- Business plan price: ok
- Starter plan price: ok
- Frontend URL: ok
- CORS origin: ok
- JWT secret: ok

## 6. Production Smoke Automation

Create these GitHub production environment secrets:

```env
HOSTINGER_API_TOKEN=<Hostinger API token from hPanel>
SMOKE_EMAIL=smoke-superadmin@fieldserviceit.com
SMOKE_PASSWORD=<the smoke super admin password stored in your password manager>
```

Optional production environment variables:

```env
HOSTINGER_EXPECTED_DOMAINS=fieldserviceit.com,api.fieldserviceit.com
SMOKE_BASE_URL=https://fieldserviceit.com
SMOKE_API_URL=https://api.fieldserviceit.com
SMOKE_MUTATIONS=false
```

Use `SMOKE_MUTATIONS=true` only for a deliberate controlled run. It creates, edits, and deactivates temporary smoke records.

The smoke workflows are:

- `.github/workflows/production-smoke.yml` for scheduled/manual API and browser smoke tests.
- `.github/workflows/deploy.yml` for push-time backend/frontend builds, Hostinger API preflight, and production smoke checks.

Hostinger's public API can verify account access and hosted websites, but it does not currently provide a shared-hosting Node.js file upload/redeploy endpoint in the public OpenAPI surface. Keep production deployment manual in hPanel until one of these deploy transports is configured:

- Hostinger Git deployment/webhook.
- SSH/SFTP deployment credentials.
- VPS/Docker deployment, where Hostinger's API exposes Docker project update/restart endpoints.

## 7. Database Credential Rotation

The database credential previously used in chat should be considered exposed. Rotate it from Hostinger hPanel because the current MySQL account does not have `CREATE USER` privileges from the app connection.

Safe rotation order:

1. In Hostinger hPanel, create a new MySQL user for `u209468809_FieldserviceIT`.
2. Grant it the application privileges needed by the backend.
3. Update the backend `DATABASE_URL` to use the new user/password.
4. Redeploy or restart the backend app.
5. Run `node scripts/production-smoke.mjs` with `SMOKE_MUTATIONS=true`.
6. After smoke passes, remove or change the old exposed MySQL user password.

Do not revoke the old credential before step 5 passes, or the live app can lose database access.
