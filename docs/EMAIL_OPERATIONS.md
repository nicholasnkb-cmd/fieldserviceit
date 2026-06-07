# Email Operations

FieldserviceIT sends transactional email through the encrypted global SMTP provider configured in:

```text
Administration -> Email Operations
```

## Provider endpoints

Create or rotate the webhook secret from Email Operations. The secret is shown once and must be sent as:

```http
X-API-Key: <secret>
```

Inbound ticket replies:

```text
POST https://api.fieldserviceit.com/v1/tickets/inbound-email
```

Delivery events:

```text
POST https://api.fieldserviceit.com/v1/notifications/email/events
```

Supported event payload:

```json
{
  "event": "DELIVERED",
  "messageId": "<smtp-message-id>",
  "email": "recipient@example.com",
  "reason": "optional short reason",
  "details": "optional provider details"
}
```

`event` supports `DELIVERED`, `BOUNCE`, and `COMPLAINT`. A `deliveryId` may be supplied instead of `messageId`.
Bounce and complaint events suppress future optional email to the recipient.

## Queue controls

Super administrators can pause or resume the global queue. Super administrators and tenant administrators can:

- Retry all failed email in their visible scope.
- Retry one failed delivery.
- Cancel queued, digest-pending, or failed email.
- Resend completed, bounced, complained, cancelled, or suppressed email.

Permanent failures create in-app alerts for super administrators and the affected tenant administrators.

## Tracking

Sent HTML is instrumented at delivery time with signed open and click URLs. Tracking requests do not require login, but
tampered signatures and unsafe redirect protocols are rejected. IP addresses are stored only as salted SHA-256 hashes.

Open and click rates are approximate because email clients may proxy images or rewrite links.

## Credential rotation

1. Create the replacement credential at the provider.
2. Update it in Email Operations and use **Save and verify**.
3. Confirm a queue test reaches `SENT`.
4. Revoke the old provider credential.
5. Rotate the email webhook secret and update every inbound/event integration.

Database, Hostinger account, and Hostinger API credentials must be rotated in hPanel. Coordinate the database change with
the production `DATABASE_URL` update to avoid an outage.
