# FieldserviceIT: Project, Business, and Go-to-Market Review

**Prepared:** July 27, 2026  
**Scope:** Entire repository, product structure, reliability, security, product strategy, business model, marketing, social targeting, and multimedia  
**Decision:** **Ready for a controlled design-partner beta; not yet proven for an unrestricted production launch**

## 1. Executive recommendation

FieldserviceIT is a broad, credible multi-tenant IT operations platform. It combines ITSM ticketing, CMDB and network inventory, dispatch, customer self-service, reporting, RMM integrations, workflow automation, billing, security operations, endpoint operations, and an AI assistant. The codebase is substantially more mature than the June 2026 review suggests: current builds and unit tests pass, privacy and identity controls have expanded, operational workflows exist, and the frontend stays inside its JavaScript budget.

The primary risk is no longer an absence of features. It is **excess breadth before repeatable product-market fit and production proof**. The product presently tries to serve individuals, MSPs, internal IT departments, and field-service organizations while competing across PSA, RMM integration, ITSM, CMDB, dispatch, billing, and security. That scope increases support cost, complicates positioning, and leaves several large modules expensive to change safely.

The best near-term strategy is:

1. Position FieldserviceIT as the **operations hub for small MSPs and hybrid IT/field-service teams**, not as a replacement for every RMM.
2. Recruit 8–12 paid or contractually committed design partners in one narrow ideal customer profile.
3. Freeze nonessential feature expansion for 90 days and prove five workflows: intake-to-resolution, asset-to-ticket context, dispatch-to-proof-of-work, RMM-to-action, and time/quote-to-invoice.
4. Complete production evidence: clean migration, tenant-isolation E2E, restore drill, rollback, load test, observability, and billing reconciliation.
5. Replace unsupported marketing claims with measured outcomes from design partners.

### Current scorecard

| Area | Score | Assessment |
|---|---:|---|
| Product breadth | 9/10 | Very broad for an early-stage product |
| Architecture | 7.5/10 | Sensible modular monolith; concentrated core services |
| Security design | 8.5/10 | Strong controls; operational proof and secret policy still matter |
| Reliability engineering | 7.5/10 | Good mechanisms and tests; staging evidence remains the gate |
| Maintainability | 6/10 | Multiple 1,200+ line modules and 2,443 explicit `any` tokens |
| UX/product coherence | 7/10 | Rich surface; navigation and persona focus need validation |
| Commercial readiness | 5.5/10 | Pricing and messaging documents conflict with the implemented product |
| Marketing readiness | 5/10 | Useful materials exist, but proof, segmentation, and claim governance are weak |

## 2. Evidence and limitations

### Repository evidence collected

- 305 backend TypeScript files and 180 frontend TypeScript/TSX files.
- 32 NestJS feature modules, 79 page files, and 50 SQL migrations.
- 61 backend unit suites with **277/277 tests passing**.
- 18 frontend suites with **63/63 tests passing**.
- Backend production build passed.
- Frontend lint passed with zero warnings.
- Frontend optimized build passed and generated 82 static pages.
- Shared frontend JavaScript was **102.5 KiB gzip** against a **117.2 KiB** budget.
- Five Playwright specifications exist, along with load-test and production-verification scripts.
- The working tree contained extensive pre-existing, uncommitted security and compliance work. This report did not alter it.

### Not proven by this review

This audit did not claim successful production behavior merely because code exists. The following still require environment-backed evidence:

- Full MySQL E2E suite on a clean, production-equivalent database.
- Cross-tenant negative testing for every high-risk domain.
- Browser tests against an actual deployment and real email/payment providers.
- Backup restoration from remote storage with measured RPO and RTO.
- Migration rollback or forward-recovery under failure.
- Sustained load, connection-pool saturation, large-tenant query performance, and WebSocket behavior.
- PayPal webhook replay, reconciliation, refunds, disputes, taxes, and subscription lifecycle.
- Mobile PWA behavior on real iOS and Android devices.
- Third-party penetration test, legal review, or formal certification.

## 3. Product and architecture analysis

### What is structurally strong

- A modular monolith is the correct deployment model at this stage. It minimizes operational overhead while preserving domain boundaries.
- Tenant context, permission guards, step-up authentication, audit interception, rate limiting, request metrics, and response normalization are cross-cutting platform controls.
- The product includes mature identity concepts: session revocation, MFA, passkeys, recovery, OIDC, service accounts, impersonation controls, and access governance.
- Database migrations are explicit SQL artifacts and operational scripts cover deployment, uptime, rollback, backup, and restoration concerns.
- The frontend has route groups, middleware protection, a shared API layer, React Query, accessible primitives, PWA assets, Sentry integration, SEO pages, and a bundle budget.
- The repository includes runbooks, SLO guidance, compliance controls, accessibility reporting, and business-continuity material.

### Structural weaknesses

#### 3.1 Core-module concentration

The largest files are risk centers, not merely style issues:

| File/responsibility | Approx. lines | Recommendation |
|---|---:|---|
| `database.service.ts` | 2,754 | Stop adding model-specific behavior; extract typed domain repositories |
| `cmdb.service.ts` | 1,731 | Split asset, credential, discovery, monitoring, and lifecycle services |
| `admin.service.ts` | 1,661 | Split tenant, user, plan, platform-readiness, and governance services |
| `migrations.service.ts` | 1,466 | Move migration definitions fully to files; keep runner small |
| Network page client | 1,487 | Split queries, commands, filters, tables, dialogs, and panels |
| Permissions page | 1,371 | Extract role editor, matrix, history, grants, and policy panels |

Use a measurable rule: no new production file above 800 lines; any file above 1,200 lines needs an owner, decomposition issue, characterization tests, and an explicit deadline.

#### 3.2 Dual data-model ambiguity

The repository presents Prisma schemas as reference material while runtime behavior uses a custom SQL/Prisma-like layer. This causes type erosion, duplicated query behavior, schema drift risk, and unclear ownership. Do not attempt a high-risk full ORM rewrite during beta. Instead:

1. Declare SQL migrations the only schema source of truth.
2. Generate database types from that schema or maintain typed row interfaces at repository boundaries.
3. Put all new queries in domain repositories.
4. Add query-count and latency assertions to high-volume paths.
5. Gradually retire model-specific methods from the god service.

#### 3.3 Type safety

There are approximately 2,443 explicit `any` tokens across application source. The count is a directional metric, not a defect count, but it shows that compile-time protection is weakest at the most important boundaries. Prioritize:

- Authentication/session claims.
- Tenant-scoped database inputs and rows.
- Billing provider events.
- RMM provider payloads.
- AI tool inputs and outputs.
- Frontend API response types and large page state.

Adopt `unknown` for external inputs, schema validation at boundaries, typed repository results, and a declining `any` budget enforced in CI.

#### 3.4 Eager module loading and background work

All feature modules load in one process. That is acceptable today, but network listeners, schedulers, email delivery, RMM synchronization, AI calls, backups, and WebSockets should not compete indefinitely with request handling. Introduce a durable job abstraction and an outbox before adding more automation. A separate worker process can come later without splitting the product into microservices.

### Recommended target architecture

Keep the modular monolith, organized into four layers:

- **Experience:** public site, technician workspace, customer portal, admin console, PWA.
- **Domain:** service desk, assets/network, field service, commercial operations, identity/governance.
- **Platform:** tenancy, permissions, audit, notifications, files, search, workflow, integrations, AI policy.
- **Operations:** migrations, jobs/outbox, telemetry, backup/restore, health, deployment evidence.

Domain modules may depend on platform contracts, but should not query one another's tables directly. Cross-domain actions should use application services or durable events.

## 4. Stability, security, and operational readiness

### Strengths

- Startup and migration safety, consistent logical backups, remote backup support, and restore-drill code exist.
- Database-backed throttle storage and login abuse state support horizontal consistency better than in-memory controls.
- Security headers, browser-origin protection, tenant and permission guards, step-up authentication, encryption utilities, credential hashing, file controls, and SIEM/Sentry options are present.
- CI workflows cover testing, staging validation, security analysis, compliance review, recovery exercises, deployment, rollback, and uptime.
- Quality gates explicitly require tenant SQL checks, permission coverage, accessibility, browser regression, and mobile verification.

### Highest-priority stability work

#### P0: beta launch gates

1. **Create an immutable release candidate.** The current working tree has many uncommitted changes. Commit intentionally, tag the candidate, generate release metadata, and run all evidence against that exact SHA.
2. **Run clean-database and upgrade migrations.** Test both empty install and upgrade from the oldest supported production version. Record duration, locks, failure behavior, and recovery.
3. **Prove tenant isolation.** Build a table of tenant-scoped endpoints and run positive/negative E2E cases with two tenants, super-admin, tenant admin, technician, and client roles.
4. **Restore the remote backup.** Restore into a separate database, validate row counts and checksums, log RPO/RTO, and exercise application login against the restored copy.
5. **Prove rollback/forward recovery.** Application rollback is not enough if a migration is destructive. Require expand/migrate/contract changes and backward-compatible releases.
6. **Load-test critical paths.** Model 10, 50, and 150 concurrent users; ticket lists, dashboard, asset search, timeline, dispatch, and notification fan-out. Set p95 targets and pool saturation alerts.
7. **Complete billing readiness.** Validate subscription creation, cancellation, renewal, failed payment, webhook replay/idempotency, reconciliation, and entitlement changes.
8. **Separate secrets from manifests.** The Kubernetes example contains placeholders, not live secrets, but plaintext `Secret` templates teach an unsafe deployment habit. Replace it with an `ExternalSecret`, SOPS example, or `.example` file excluded from direct deployment.

#### P1: first 90 days

- Add a durable outbox and worker for email, webhooks, RMM sync, reports, and AI tasks.
- Establish database performance budgets and query-count tests for the top ten workflows.
- Add synthetic checks for registration, login, ticket creation, and portal tracking—not only health endpoints.
- Define error budgets and page an owner only on user-impacting symptoms.
- Test degraded modes: email unavailable, RMM timeout, object storage failure, AI provider failure, and payment provider outage.
- Add retention/deletion schedules for tickets, audit events, attachments, telemetry, AI prompts, and privacy exports.
- Conduct a threat model for tenant escape, SSRF through integrations, uploaded content, WebAuthn recovery, impersonation, and AI tool authorization.

### Suggested service objectives for beta

| Measure | Beta target | General-availability target |
|---|---:|---:|
| Monthly API availability | 99.5% | 99.9% |
| Core read API p95 | <750 ms | <400 ms |
| Core write API p95 | <1,200 ms | <750 ms |
| Background email p95 | <2 min | <60 sec |
| RPO | 24 hours initially | 4 hours or better |
| RTO | 8 hours initially | 2 hours or better |
| Critical security remediation | 72 hours | 24–72 hours by severity |

Do not advertise an SLA until monitoring and incident history show it can be met.

## 5. Feature and product recommendations

### Product principle

Build fewer workflows to completion. Customers do not buy a module count; they buy reduced handling time, fewer missed SLAs, accurate asset context, completed field visits, and faster billing.

### Must-perfect workflows

1. **Request to resolution:** email/public portal/manual intake → classification → SLA → assignment → collaboration → resolution → CSAT.
2. **Asset-aware service:** asset/client/user context appears automatically on a ticket; recent alerts, warranty, credentials policy, and history are visible safely.
3. **Dispatch to proof of work:** schedule → technician mobile view → travel/arrival → notes/photos/signature → time/parts → customer confirmation.
4. **RMM alert to governed action:** normalized alert → deduplication → ticket/rule → approved remote action → audit trail → closure.
5. **Work to cash:** approved time/parts → quote or invoice → payment status/export → profitability report.

### Near-term feature priorities

| Priority | Feature | Why |
|---|---|---|
| 1 | Guided onboarding and sample data | Reduces time-to-value and support burden |
| 2 | Importers for customers, users, assets, and tickets | Makes switching feasible |
| 3 | SLA and queue templates by MSP archetype | Converts flexibility into usable defaults |
| 4 | Ticket email threading and deliverability console | Email remains central to service desks |
| 5 | Mobile offline job draft and reliable media sync | Field work cannot depend on continuous connectivity |
| 6 | Time/parts approval and accounting export | Closes the commercial workflow |
| 7 | Integration health dashboard and replay | Makes RMM dependence supportable |
| 8 | In-product adoption analytics | Shows activation and drop-off without guesswork |

### Defer until evidence demands them

- Additional RMM vendors beyond those actively requested by design partners.
- A native mobile app; prove the PWA first.
- General-purpose AI autonomy. Start with summaries, drafts, retrieval, and approval-required recommendations.
- Microservices, multi-region deployment, or a second database technology.
- More pricing tiers before willingness-to-pay research.
- Broad non-IT field-service verticals such as HVAC or electrical; they require different inventory, estimating, compliance, and scheduling depth.

### AI product policy

The AI assistant can differentiate the product only if it is safe and grounded. Every AI action should record tenant, actor, model, prompt category, sources, tools, approval, result, and cost. Never allow unreviewed destructive remote actions. Measure accepted suggestions, time saved, correction rate, and cost per resolved ticket.

## 6. Full business plan

### 6.1 Company concept

**Mission:** Help small IT service teams run dependable service operations without stitching together a heavyweight PSA and multiple disconnected workflow tools.

**Vision:** Become the trusted operational control plane between customer requests, technicians, assets, RMM systems, and commercial workflows.

**Initial beachhead:** North American MSPs with 3–20 technicians, 200–3,000 managed endpoints, one primary RMM, field visits, and dissatisfaction with PSA complexity or fragmented tools.

**Secondary segment:** Internal IT teams with distributed sites and field technicians. Address only after the MSP motion is repeatable.

### 6.2 Problem

Small MSPs frequently coordinate service work across ticketing, RMM, documentation, spreadsheets, dispatch tools, email, and accounting. The cost is duplicate entry, weak asset context, missed handoffs, delayed billing, and poor operational visibility. Incumbent all-in-one platforms may be powerful but can impose implementation and administration complexity. Newer RMM-first products are increasingly adding PSA and AI capabilities, so a generic “all in one” claim is not defensible by itself.

### 6.3 Solution and differentiation

FieldserviceIT should differentiate on:

- **RMM-neutral orchestration:** keep a customer's chosen RMM while normalizing alerts and actions.
- **Service plus field execution:** connect desk work with dispatch, photos, signatures, time, and parts.
- **Operational trust:** tenant isolation, auditability, access governance, privacy workflows, and recovery evidence.
- **Fast, guided adoption:** templates, imports, and measurable first value in one day.
- **Transparent small-team economics:** a simple company base plus technician seats.

Avoid claiming “more integrations than any competitor,” “enterprise grade,” “45-minute setup,” specified savings, or percentage superiority until there is verifiable evidence.

### 6.4 Business model and pricing

The implemented product currently uses:

- Free: $0, one user, limited tickets.
- Starter: $29/month or $290/year, one user.
- Business: $79/month or $790/year plus $12/user/month or $120/user/year.

This conflicts with existing documents that describe $50/$100/$150 per-technician plans. The website, billing database, sales deck, ROI calculator, legal terms, and PayPal catalog must have one canonical pricing source.

#### Recommended beta pricing hypothesis

Keep the implemented structure during design-partner validation:

- **Solo:** $29/month, one operator, limited integrations and automation.
- **Team:** $79/month base + $12/technician/month, with core ITSM, assets, dispatch, SLA, workflows, reports, and one RMM connector.
- **Team Plus add-on:** $99–$249/month based on validated demand for advanced governance, multiple connectors, premium retention, or priority support.
- **Onboarding/migration:** fixed $500–$2,500 packages rather than hiding service labor inside low subscription prices.

Do not promise a permanent free company plan. A solo free plan can support product-led discovery, but free users must have strict support, storage, email, AI, and integration limits.

Current competitive context reinforces the need for validation rather than old comparison tables: Atera publicly lists MSP plans beginning at $129 per technician per month billed annually and includes ticketing, RMM, automation, and AI; other vendors often use quote-based or evolving pricing. See [Atera's current MSP pricing](https://www.atera.com/msp-pricing/) and [Atera's pricing-model explanation](https://support.atera.com/hc/en-us/articles/209358127-What-is-your-pricing-model). Recheck competitors quarterly and date every comparison.

### 6.5 Market sizing method

The existing business plan includes market sizes and firm counts without cited, reproducible sources. Replace top-down headline TAM with a bottom-up model:

- **TAM formula:** target organizations × average annual contract value.
- **SAM:** organizations in supported countries, company sizes, RMM ecosystems, and compliance profiles.
- **SOM (36 months):** accounts reachable with actual sales capacity × win rate × ACV.

Example planning scenario—not a market fact:

- 20,000 plausible North American small MSP prospects.
- 8 technicians per account.
- $175 average monthly subscription under the current model.
- Illustrative TAM: $42 million ARR.
- A 100-customer three-year SOM would be about $210,000 ARR before add-ons and services.

Validate the prospect count using purchased/partner data or a documented directory methodology before using it externally.

### 6.6 Customer discovery

Interview at least 30 prospects before scaling paid acquisition:

- 10 owners/operators at 1–5 technician MSPs.
- 10 service managers at 6–20 technician MSPs.
- 5 technicians/dispatchers.
- 5 client-side contacts who use MSP portals.

Ask about the last incident, current workflow, time/cost, tools, failure points, buying process, security review, migration fear, and budget. Do not ask whether they “like” the idea. Require a design-partner agreement, paid pilot, data-sharing permission, or scheduled migration as the strongest demand signal.

### 6.7 Sales model

Use founder-led sales for the first 20 customers:

1. Account research and relevant trigger.
2. 20-minute discovery call.
3. Workflow-specific demo using the prospect's scenario.
4. Technical/security validation.
5. Paid 30–45 day pilot with success criteria.
6. Guided import and weekly review.
7. Annual conversion only after value review.

Pilot success criteria should include activation within seven days, two core workflows used weekly, a named champion, measured time or error reduction, no critical reliability issues, and an agreed conversion decision date.

### 6.8 Operations and organization

Initial roles, whether employees or founder responsibilities:

- Product/CEO: discovery, positioning, pricing, partnerships.
- Technical lead: architecture, security, releases, operational evidence.
- Customer success/implementation: migration, onboarding, support, documentation.
- Growth generalist: content, lifecycle email, CRM, attribution, events.

Do not hire quota-carrying salespeople until a founder can demonstrate a repeatable ICP, message, sales cycle, demo, and close process.

### 6.9 Financial plan

Build forecasts from operational drivers, not desired revenue. Suggested base assumptions:

| Driver | Conservative | Base | Upside |
|---|---:|---:|---:|
| Customers at month 12 | 15 | 35 | 60 |
| Average techs/customer | 5 | 8 | 10 |
| Average subscription MRR/customer | $139 | $175 | $225 |
| Month-12 MRR | $2,085 | $6,125 | $13,500 |
| Gross margin before founder labor | 70% | 80% | 85% |
| Monthly logo churn after pilot | 4% | 2.5% | 1.5% |
| CAC payback target | <15 mo | <12 mo | <9 mo |

The model must separately include hosting, storage, email, observability, AI, payment fees, backup, support labor, onboarding labor, contractor costs, insurance, legal/compliance, and refunds. Infrastructure-only “gross margin” will overstate economics for a support-heavy product.

#### Unit-economics formulas

- ARPA = subscription revenue / active paying accounts.
- Gross margin = (revenue − hosting − payment fees − variable support/onboarding − AI/email/storage) / revenue.
- CAC = acquisition and sales cost / new paying customers.
- Gross-margin LTV = ARPA × gross margin / monthly logo churn.
- CAC payback = CAC / monthly gross profit per new customer.

Targets: gross-margin LTV:CAC above 3:1, CAC payback below 12 months, monthly logo churn below 2.5%, and net revenue retention above 100% after add-ons mature.

### 6.10 Legal, compliance, and risk

Before general availability, obtain counsel for terms, privacy policy, DPA, subprocessors, acceptable use, AI disclosures, data deletion, breach notification, limitation of liability, and applicable taxes. Buy appropriate cyber and technology E&O coverage. Do not describe repository controls as SOC 2, HIPAA, GDPR, or other certification/compliance unless the organization and operations meet the relevant requirements.

Top business risks and mitigations:

| Risk | Mitigation |
|---|---|
| Product too broad | Beachhead ICP and 90-day feature freeze |
| Entrenched competitors | Migration assistance and RMM-neutral workflow proof |
| Trust deficit | Security package, recovery evidence, transparent status and incidents |
| Founder support overload | Templates, telemetry, knowledge base, paid onboarding |
| Low price/high service cost | Track contribution margin by account; charge for migration |
| Integration instability | Connector contracts, health dashboard, retries, replay, version ownership |
| AI liability | Grounding, approvals, audit, tool allowlists, tenant budgets |

### 6.11 Milestones

#### 0–30 days

- Select the one ICP and canonical positioning statement.
- Reconcile pricing everywhere.
- Produce release-candidate evidence and security packet.
- Interview 15 prospects and sign 3–5 design partners.
- Instrument activation and critical workflow events.

#### 31–90 days

- Reach 8–12 active design partners, preferably paid.
- Complete import/onboarding templates.
- Publish two evidence-based case studies.
- Establish weekly release and customer-health reviews.
- Demonstrate restore, rollback, tenant isolation, and load gates.

#### 3–6 months

- Convert at least 60% of successful pilots.
- Reach 20–30 paying accounts with repeatable onboarding.
- Validate one acquisition channel with CAC payback below 12 months.
- Decide which feature surface to deepen and which to sunset or hide.

#### 6–12 months

- Reach the base scenario only if activation, retention, and support economics remain healthy.
- Add partner/referral motion.
- Pursue formal assurance readiness when enterprise demand justifies it.

## 7. Full marketing plan

### 7.1 Positioning

**Category:** MSP service-operations hub.  
**Audience:** Small MSP owners and service managers whose RMM is not enough and whose PSA is too fragmented or burdensome.  
**Promise:** Connect requests, assets, technicians, field work, and RMM signals in one governed workflow.  
**Proof:** Must come from measured onboarding time, resolution time, avoided duplicate entry, SLA attainment, billing lag, and recovery/security evidence.  
**Contrast:** Keep the RMM you prefer; improve the workflow around it.

Suggested homepage message:

> **Run service operations around the RMM you already trust.**  
> FieldserviceIT connects tickets, assets, dispatch, client updates, and governed actions so small MSP teams can move from request to resolution without stitching together spreadsheets and inboxes.

Primary CTA: **Book a workflow review**.  
Secondary CTA: **See the 3-minute product tour**.

Use “Start free” only when self-service activation, lifecycle email, and onboarding reliably deliver value without human help.

### 7.2 Personas and messages

| Persona | Primary pain | Message | Proof asset | CTA |
|---|---|---|---|---|
| MSP owner, 3–10 techs | Tool cost and operational chaos | Keep control without a heavyweight PSA project | ROI worksheet + owner case study | Workflow review |
| Service manager, 6–20 techs | Queues, SLA misses, inconsistent process | Standardize intake, assignment, escalation, and closure | Ticket lifecycle demo | Pilot a queue |
| Lead technician | Context switching and poor asset history | Ticket, asset, alert, and action context in one workspace | Screen-recorded day-in-life | Try technician workspace |
| Dispatcher/field lead | Scheduling and incomplete proof | Close the loop from appointment to signed work | Mobile dispatch demo | Pilot field workflow |
| Security-minded buyer | Tenant risk and audit burden | Govern access and preserve evidence | Security architecture brief | Security review |

### 7.3 Funnel

#### Awareness

- Founder point-of-view posts about workflow design, MSP operations, migration, and security.
- Search pages for high-intent problems, not generic category definitions.
- Short product clips showing one outcome in under 45 seconds.
- Helpful participation in MSP communities with no undisclosed promotion.

#### Consideration

- Interactive workflow assessment.
- RMM-neutral operations guide.
- Security and architecture packet.
- Comparison pages that state date, methodology, verified facts, and limitations.
- Live demo/webinar using a realistic ticket-to-dispatch scenario.

#### Conversion

- Paid pilot with written success criteria.
- Import and onboarding checklist.
- Reference call or case study.
- ROI model populated with the buyer's inputs.
- Technical validation and data-processing package.

#### Expansion and advocacy

- 7-, 30-, and 60-day success reviews.
- Feature adoption prompts based on role and behavior.
- Quarterly business reviews for larger accounts.
- Referral credit only after customers achieve a documented outcome.

### 7.4 Channel plan

Start with channels that create learning:

| Channel | Role | First experiment | Success criterion |
|---|---|---|---|
| Founder outbound | Discovery and pilots | 100 highly researched accounts | 10% positive reply, 5 discoveries |
| LinkedIn organic | Credibility | 3 useful posts/week for 8 weeks | Qualified comments, profile-to-site visits |
| Search/SEO | Capture intent | 6 deep workflow pages | Demo/pilot conversions, not traffic alone |
| YouTube | Product proof | 8 workflow videos | 35%+ average percentage viewed and assisted conversions |
| Email | Nurture/activation | 5-message problem-to-pilot sequence | Reply, activation, and booked-review rates |
| Reddit/community | Research and trust | Answer real questions; small transparent ad test | Qualified conversations and assisted demos |
| Partnerships | Distribution | Two RMM consultants or MSP communities | Referred qualified opportunities |

Delay Product Hunt and broad launch PR until there are references, onboarding capacity, and a clear self-service motion. A one-day traffic spike is less valuable than ten design partners.

### 7.5 Content strategy

Use four pillars:

1. **Service operations:** queue design, SLAs, handoffs, dispatch, billing lag.
2. **RMM-neutral workflows:** alert normalization, governed actions, integration health.
3. **Trust:** tenant isolation, audit, recovery drills, access governance, privacy.
4. **Migration and adoption:** data cleanup, rollout sequence, technician acceptance, ROI measurement.

Repurpose one monthly anchor asset into one webinar, one long article, four short videos, eight LinkedIn posts, one checklist, one email sequence, and sales enablement snippets.

### 7.6 SEO plan

The repository already includes landing pages for MSP ticketing, IT asset management, field-service management, and technician dispatch. Expand around search intent:

- “MSP ticket workflow template”
- “RMM alert to ticket workflow”
- “small MSP PSA migration checklist”
- “MSP dispatch software”
- “asset context in service desk tickets”
- “[RMM name] PSA integration” only when the connector is genuinely supported
- “MSP security questionnaire template”

Each page needs unique proof, screenshots, FAQ, schema markup where appropriate, internal links, and one primary conversion action. Avoid dozens of thin programmatic comparison pages.

### 7.7 Paid media budget and experimentation

Do not begin with the existing $10,000/month plan. Use a $2,500–$4,000 monthly validation budget after conversion tracking works:

| Use | Share |
|---|---:|
| High-intent Google Search | 35% |
| LinkedIn retargeting and narrow tests | 25% |
| Reddit community/keyword tests | 15% |
| Video retargeting | 10% |
| Creative production/tools | 10% |
| Reserve | 5% |

Scale a channel only after at least two cohorts show qualified pipeline and plausible CAC payback. Optimize to qualified pilot or opportunity, not click or raw lead.

### 7.8 Measurement

Define these events consistently across product, site, CRM, and billing:

- `workflow_review_booked`
- `trial_or_pilot_started`
- `tenant_created`
- `first_user_invited`
- `first_customer_imported`
- `first_ticket_resolved`
- `first_asset_linked`
- `first_dispatch_completed`
- `rmm_connected`
- `week_1_activated`
- `pilot_converted`
- `subscription_expanded`
- `churn_requested`

Weekly dashboard: visitors → qualified leads → discoveries → pilots → activated pilots → paid conversions; activation time; cost per qualified opportunity; pipeline by source; win/loss reason; support hours per account; retained usage by workflow.

## 8. Social-media targeting plan

### 8.1 LinkedIn: primary B2B channel

Target United States and Canada initially. Separate campaigns by persona:

- Job titles: Owner, Founder, President, Managing Director, Service Manager, Service Delivery Manager, Help Desk Manager, IT Operations Manager, Technical Operations Manager.
- Functions/seniority: IT, operations, owner/partner, manager/director.
- Company size: 2–50 employees for the beachhead; test 51–200 separately.
- Industries: IT services and IT consulting, computer/network security, managed services where available.
- Skills/groups: managed services, IT service management, RMM, help desk, network administration.
- Exclude current customers, employees, students, recruiters, and irrelevant enterprise accounts.
- Use matched account lists after building a clean target-account database.

LinkedIn supports professional targeting dimensions such as company size/industry/name and job title/seniority; keep each audience large enough to deliver and test one major targeting variable at a time. See [LinkedIn's targeting overview](https://business.linkedin.com/content/dam/business/marketing-solutions/global/en_US/site/pdf/product-sheets/Product%20One-Sheeter-Display.pdf).

Creative angles:

- “Your RMM sees the device. Who owns the customer workflow?”
- “From alert to ticket to approved action—with one audit trail.”
- “A practical migration checklist for small MSPs.”

### 8.2 Reddit: research and high-intent context

Use transparent founder participation organically. For ads, test eligible communities related to MSP, sysadmin, IT managers, networking, and small-business technology; eligibility must be checked in Ads Manager. Add contextual keywords such as “PSA migration,” “ticketing system,” “ConnectWise alternative,” “RMM integration,” “dispatch,” and “SLA.” Reddit supports community, interest, keyword, and custom-audience targeting; community targeting can reach people who engaged with selected communities even when they browse elsewhere. See [Reddit community and interest targeting](https://www.business.reddit.com/advertise/targeting/community-and-interest) and [keyword targeting](https://www.business.reddit.com/advertise/targeting/keyword).

Use native, specific copy and do not imitate an organic customer testimonial. Test community, keyword, and retargeting in separate ad groups.

### 8.3 Google Search and YouTube

Search should focus on high-intent phrases and competitor terms only when ad and landing-page claims are factual. Use negative keywords for jobs, salaries, definitions, training, free downloads, consumer repair, and unrelated field-service industries.

For YouTube, build custom segments from search terms, relevant product URLs, and apps, then retarget engaged site visitors and video viewers. Google documents that custom segments can use keywords, URLs, and apps to reach relevant interests or purchase intent: [Google Ads custom segments](https://support.google.com/google-ads/answer/9805516).

### 8.4 Meta

Use Meta primarily for retargeting site visitors, video viewers, and opted-in customer lists. Broad cold B2B job targeting is less reliable than LinkedIn or contextual search. Meta supports broad/detailed targeting and custom audiences, but recommends care with over-narrow interest audiences: [Meta audience targeting](https://www.facebook.com/business/ads/ad-targeting).

### 8.5 Organic cadence

- LinkedIn: three posts/week—operator insight, visual workflow, customer evidence.
- YouTube: one 5–8 minute workflow video and two shorts/week.
- Reddit: contribute only when useful; no posting quota.
- Email newsletter: twice monthly, one operational lesson and one product proof.
- X or Bluesky: optional repurposing, not a primary pipeline commitment.

## 9. Multimedia materials plan

### Existing assets

The repository contains a social card, hero image, two marketing posters, three audio tracks, a promotional HTML composition, and a video rendering script. Treat these as prototypes. They need a consistent visual system, current pricing/messages, captions, accessibility text, licenses, and claim review before campaign use.

### Priority production kit

1. **3-minute product tour (16:9):** problem → ticket intake → asset context → dispatch/RMM action → result → CTA.
2. **Five 30–45 second workflow clips (16:9, 1:1, 9:16):** one outcome each, burned-in captions, no feature montage.
3. **Interactive demo:** anonymized sample tenant with guided hotspots and no login friction.
4. **Security overview animation (60–90 sec):** tenant boundary, identity, permissions, audit, backup/restore.
5. **Customer story template:** problem, baseline, rollout, measured outcome, quote, limitations.
6. **Sales deck (10 slides):** ICP problem, workflow, differentiation, proof, security, onboarding, pricing, pilot.
7. **One-page solution briefs:** owner, service manager, field operations, security reviewer.
8. **Screenshot library:** consistent sample data, desktop/mobile, light/dark where relevant, callout-free masters.
9. **Brand kit:** logo variants, safe area, color tokens, typography, icon rules, voice, motion, thumbnail templates.
10. **Webinar kit:** title card, lower third, demo runbook, backup recording, captions, follow-up clips.

### Flagship video storyboard

| Time | Visual | Narration/message |
|---:|---|---|
| 0–10s | Inbox, RMM alerts, spreadsheet, phone | “The work is connected. The tools often are not.” |
| 10–30s | Request becomes classified ticket | Show one clean intake and SLA workflow |
| 30–55s | Asset and recent alert context | “See the customer, device, history, and risk together.” |
| 55–85s | Dispatch and technician mobile flow | Assignment, notes, photo, signature, time |
| 85–110s | Governed RMM action and audit | Keep the chosen RMM; preserve approval and evidence |
| 110–140s | Resolution, client update, reporting | Demonstrate closure, not dashboard decoration |
| 140–165s | Security/recovery proof | Tenant controls, audit, restore evidence |
| 165–180s | Product and CTA | “Book a workflow review.” |

### Creative requirements

- Never show real customer or credential data.
- Use a stable demo tenant and scripted data reset.
- Provide captions, transcript, audio description where needed, thumbnail alt text, and sufficient contrast.
- Export 4K/1080p master, web-optimized MP4/WebM, 1:1 and 9:16 crops, caption files, clean/no-music versions, and still frames.
- Maintain a claims sheet with source, owner, approval date, and expiration date for every numeric or competitive statement.
- Secure commercial rights for music, fonts, stock assets, voice, and customer logos.

## 10. Claim and document governance

The existing marketing folder is valuable as a working library, but several documents conflict with the product or present unsupported claims as facts. Immediately review:

- Three-tier $50/$100/$150 pricing versus implemented Free/$29/$79+$12.
- “Free for five technicians” versus implemented one-user Free.
- “Six RMM providers,” “more than any competitor,” and feature matrices—verify actual production connector depth, not provider class names.
- “45-minute setup,” “15+ hours saved,” “$2,400+ saved per technician,” “60% cheaper,” and market-share statements—replace with study results or label as hypotheses.
- Native mobile, QuickBooks sync, on-prem, 24/7 support, unlimited API, and compliance claims—confirm delivery and contractual support before publication.
- Credit-card acceptance language conflicts with a PayPal-only billing implementation.

Create one product catalog owned by product management containing plan, entitlement, limit, availability status, evidence link, and last-reviewed date. Website and sales material should be generated or reviewed against it before every release.

## 11. Prioritized action plan

### Next 14 days

- Freeze a release candidate and run all environment-backed launch gates.
- Choose the MSP beachhead and remove unrelated lead messages.
- Make pricing canonical across code, PayPal, site, and documents.
- Build the product/claims catalog.
- Recruit the first three paid design partners.
- Instrument activation and workflow outcomes.

### Days 15–45

- Complete typed repository extraction for one hot domain as the pattern.
- Split the network and permissions pages.
- Implement import/onboarding and integration-health workflows.
- Produce the 3-minute tour, security brief, and pilot deck.
- Run 15 more interviews and publish no unsupported numbers.

### Days 46–90

- Reach 8–12 active design partners.
- Publish two measured case studies.
- Validate one acquisition channel and one repeatable demo/pilot motion.
- Review support cost, retention, activation, and willingness to pay.
- Decide which low-adoption modules to hide, defer, or retire.

## 12. Final verdict

FieldserviceIT has enough product and engineering depth to earn serious design-partner conversations today. It should not add more breadth to look complete. Its next stage is to become **provably dependable, easy to adopt, commercially consistent, and sharply positioned**.

The winning version of the business is not “another platform with every MSP feature.” It is the small-team operations hub that demonstrably connects an MSP's chosen RMM, service desk, assets, field execution, and customer communication—with less implementation burden and stronger operational evidence. The next 90 days should be judged by activated design partners, retained workflows, measured outcomes, and production proof—not modules shipped or traffic acquired.
