# FieldserviceIT Product Roadmap

## Product focus

FieldserviceIT should win on one connected service lifecycle:

1. Customer or monitoring intake creates a complete ticket.
2. Dispatch assigns the right technician with asset and site context.
3. Technician work updates the ticket, inventory, customer, and audit timeline.
4. Resolution feeds knowledge, reporting, quotes, invoices, and recurring maintenance.

Features that do not strengthen this lifecycle should remain secondary until the core workflow is fast,
reliable, and measurable.

## Phase 1: Trust and reliability

- Maintain tenant-isolation tests for every tenant-scoped controller.
- Require full unit, E2E, accessibility, build, migration, and smoke gates before deployment.
- Provide visible API errors and correlation IDs for support.
- Version and restore tenant settings, branding, workflows, permissions, and security policies.
- Track uptime, error rate, slow queries, email delivery, background jobs, and deployment versions.

Success measures:

- No cross-tenant data findings.
- More than 99.9% successful API requests outside planned maintenance.
- Critical workflow browser smoke tests pass on every release.
- Median support diagnosis time under 15 minutes.

## Phase 2: Service execution

- Reduce ticket creation to the minimum required fields with progressive enrichment.
- Add dispatch capacity, travel, skill, and SLA signals to assignment.
- Improve technician mobile offline tolerance and attachment handling.
- Connect asset history, credentials, topology, and monitoring events to ticket context.
- Add customer-facing status updates and approval checkpoints.

Success measures:

- Lower time from intake to assignment.
- Higher first-visit resolution rate.
- Fewer manually copied updates between modules.

## Phase 3: Financial and operational closure

- Turn approved quotes into scheduled work and invoices without re-entry.
- Tie labor, parts, travel, and contract coverage to ticket profitability.
- Publish tenant-branded operational and executive reports.
- Generate maintenance plans and knowledge articles from completed work.

Success measures:

- Lower invoice preparation time.
- Higher captured billable utilization.
- Higher knowledge reuse per resolved ticket.

## Phase 4: Automation

- Expand workflow templates around common MSP and internal IT scenarios.
- Add approval-aware AI assistance with explainable proposed actions.
- Recommend assignment, priority, knowledge, and maintenance actions from historical outcomes.
- Keep all automated actions tenant-scoped, auditable, reversible, and permission-checked.

## Engineering boundaries

- Controllers authorize and translate HTTP concerns only.
- Domain services own workflow rules.
- Repositories and the database adapter own persistence.
- Shared UI primitives own accessibility, semantic theming, loading, and error behavior.
- Generated media, reports, logs, coverage, and build output stay outside source control.

