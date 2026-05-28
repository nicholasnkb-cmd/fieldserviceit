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
