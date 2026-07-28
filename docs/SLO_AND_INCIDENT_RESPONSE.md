# Service Objectives and Incident Response

## Objectives

- API availability: 99.9% over a rolling 30-day window.
- Average API health-check latency: 750 ms or less over 30 days.
- Application error rate: 1% or less over 30 days.
- Critical security alert acknowledgment: 15 minutes.
- High-severity incident containment target: 4 hours.
- Restore-point objective: 24 hours or better; restore-time objective: 4 hours.

The protected `/v1/health/slo` endpoint reports measured results. Five-minute samples are stored with the deployed release identifier. Uptime, deployment, migration, backup, and restore-drill workflows remain separate evidence sources.

## Logging

Set `SIEM_INGEST_URL` and a unique 32-character-or-longer `SIEM_INGEST_SECRET` to ship signed structured events to append-only external log storage. Validate the `x-fieldserviceit-signature` HMAC before ingestion, restrict deletion in the destination, and apply the documented six-year audit retention where contract or law requires it.

Privileged mutations emit a dedicated `privileged_mutation` security event. Alert on administrator, platform-security, privacy, MFA recovery, and security-center changes; repeated authentication failures; refresh-token reuse; audit-write failures; and loss of log shipping.

## Exercises and evidence

The quarterly incident-response workflow creates an owned exercise record. Complete every checklist item, attach a timeline and communications decisions, then close only after follow-up actions have verified owners and due dates. The weekly restore drill is technical recovery evidence and does not replace the quarterly organizational exercise.
