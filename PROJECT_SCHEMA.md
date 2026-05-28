# FieldserviceIT Project Schema

This document describes the current project structure and runtime schema. The database target is SQL, specifically MySQL 8.0. The active backend data access layer is `backend/src/database/database.service.ts`, exposed through `PrismaService` for compatibility with existing service names.

## Runtime Topology

```mermaid
flowchart LR
  Browser["Browser / Client"]
  Frontend["Next.js Frontend\nfrontend/"]
  Api["NestJS API\nbackend/src/"]
  DbLayer["SQL Data Access Layer\nbackend/src/database/"]
  MySQL["MySQL 8.0"]
  Mail["SMTP / MailHog"]
  Storage["Local uploads or S3-compatible storage"]
  Realtime["Socket.IO"]

  Browser --> Frontend
  Frontend -->|REST /v1| Api
  Frontend <-->|WebSocket| Realtime
  Api --> DbLayer
  DbLayer --> MySQL
  Api --> Mail
  Api --> Storage
  Api --> Realtime
```

## Repository Layout

| Path | Purpose |
|------|---------|
| `README.md` | Project overview and quick start |
| `ARCHITECTURE.md` | System architecture notes |
| `LIFECYCLE.md` | Deployment and lifecycle guide |
| `docs/` | API, data model, infrastructure, and security docs |
| `backend/` | NestJS API server |
| `backend/src/main.ts` | API bootstrap, CORS, Helmet, validation, Swagger |
| `backend/src/app.module.ts` | Root backend module wiring |
| `backend/src/database/` | MySQL SQL service and global database provider |
| `backend/src/modules/` | Backend feature modules |
| `backend/schema.sql` | Reference MySQL schema for manual setup |
| `backend/prisma/` | Legacy schema/seed helpers, not the active source of truth |
| `frontend/` | Next.js app |
| `frontend/src/app/` | App Router pages and route groups |
| `frontend/src/components/` | Shared UI/layout components |
| `frontend/src/lib/` | API client, sockets, utilities |
| `frontend/src/stores/` | Zustand state |
| `infra/` | Docker Compose, Nginx, Kubernetes reference configs |

## Backend Module Schema

| Module | Main Responsibility |
|--------|---------------------|
| `AuthModule` | Login, registration, JWT, refresh sessions, password reset, email verification |
| `UsersModule` | Tenant-scoped user management and profile operations |
| `CompaniesModule` | Tenant/company records and company administration |
| `AdminModule` | Platform and tenant admin operations, roles, permissions, audit logs |
| `TicketsModule` | Ticket lifecycle, timeline, assignment, comments, exports, WebSocket events |
| `CmdbModule` | MDM-style device inventory, compliance status, enrollment state, and remote management actions |
| `FieldServiceModule` | Dispatch, technician work, field-service status updates |
| `WorkflowModule` | Workflow definitions and workflow runs |
| `NotificationsModule` | In-app notifications and email delivery |
| `ReportingModule` | Ticket, SLA, technician, asset, and trend reports |
| `RmmIntegrationModule` | RMM provider configuration and sync logic |
| `SettingsModule` | Tenant settings and branding |
| `SearchModule` | Cross-domain search |
| `UploadsModule` | Avatar, attachment, dispatch photo, and signature uploads |
| `BillingModule` | Plans, company plans, Stripe billing, usage counters |
| `HealthModule` | API/database health checks |

## Data Access Schema

The active database provider is global:

```mermaid
flowchart TD
  DatabaseModule["DatabaseModule"]
  PrismaService["PrismaService\ncompatibility wrapper"]
  DatabaseService["DatabaseService\nmysql2 pool + SQL methods"]
  MySQL["MySQL"]

  DatabaseModule --> PrismaService
  PrismaService --> DatabaseService
  DatabaseService --> MySQL
```

`DatabaseService` exposes repository-style properties used by backend services:

| Repository Property | SQL Table |
|---------------------|-----------|
| `user` | `User` |
| `company` | `Company` |
| `ticket` | `Ticket` |
| `ticketTimeline` | `TicketTimeline` |
| `ticketAttachment` | `TicketAttachment` |
| `asset` | `Asset` with MDM device fields for category, ownership, enrollment, compliance, security, telecom, and check-in state |
| `contract` | `Contract` |
| `sla` | `SLA` |
| `dispatch` | `Dispatch` |
| `notification` | `Notification` |
| `session` | `Session` |
| `role` | `Role` |
| `permission` | `Permission` |
| `userRole` | `UserRole` |
| `rolePermission` | `RolePermission` |
| `auditLog` | `AuditLog` |
| `workflow` | `Workflow` |
| `workflowRun` | `WorkflowRun` |
| `rmmProviderConfig` | `RmmProviderConfig` |
| `ticketTemplate` | `TicketTemplate` |
| `timeEntry` | `TimeEntry` |
| `kbArticle` | `KbArticle` |
| `plan` | `Plan` |
| `companyPlan` | `CompanyPlan` |
| `usageRecord` | `UsageRecord` |

## Core SQL Entity Relationships

```mermaid
erDiagram
  Company ||--o{ User : has
  Company ||--o{ Ticket : owns
  Company ||--o{ Asset : owns
  Company ||--o{ Dispatch : owns
  Company ||--o{ Workflow : owns
  Company ||--o{ Notification : owns
  Company ||--o| CompanyPlan : subscribes

  User ||--o{ Ticket : creates
  User ||--o{ Ticket : assigned
  User ||--o{ Session : authenticates
  User ||--o{ Dispatch : performs
  User ||--o{ UserRole : has

  Role ||--o{ UserRole : assigned
  Role ||--o{ RolePermission : grants
  Permission ||--o{ RolePermission : included

  Ticket ||--o{ TicketTimeline : records
  Ticket ||--o{ TicketAttachment : has
  Ticket ||--o{ Dispatch : schedules
  Ticket }o--|| Asset : references
  Ticket }o--|| SLA : governed_by

  Workflow ||--o{ WorkflowStep : contains
  Workflow ||--o{ WorkflowRun : executes
  WorkflowRun ||--o{ WorkflowRunStep : records

  Plan ||--o{ CompanyPlan : selected_by
  Company ||--o{ UsageRecord : tracks
```

## Frontend Route Schema

| Route Area | Path Pattern | Purpose |
|------------|--------------|---------|
| Public home | `/` | Landing/home entry |
| Auth | `/login`, `/register`, `/register-business`, `/forgot-password`, `/reset-password`, `/verify-email` | Public auth flows |
| Public ticketing | `/submit-ticket`, `/track` | Submit and track public tickets |
| App shell | `/(app)/layout.tsx` | Authenticated application layout |
| Dashboard | `/dashboard`, `/dashboards`, `/all`, `/favorites`, `/history` | Operational dashboards and grouped views |
| Tickets | `/tickets`, `/tickets/new`, `/tickets/[id]`, `/tickets/board`, `/my-tickets` | Ticket work queues and lifecycle |
| Assets | `/assets`, `/assets/new` | CMDB asset management |
| Dispatch | `/dispatch` | Field-service scheduling and status |
| Reports | `/reports` | Reporting and analytics |
| Search | `/search` | Cross-domain search |
| Billing | `/billing` | Plans, usage, subscription management |
| Integrations | `/integrations/rmm` | RMM provider setup |
| Settings/Profile | `/settings`, `/profile` | Tenant and user preferences |
| Admin | `/admin`, `/admin/users`, `/admin/company`, `/admin/companies`, `/admin/roles`, `/admin/permissions`, `/admin/audit-logs` | Tenant/platform administration |

## Request Flow

```mermaid
sequenceDiagram
  participant UI as Next.js UI
  participant API as NestJS API
  participant Guard as Guards/Pipes
  participant Service as Feature Service
  participant SQL as DatabaseService
  participant DB as MySQL

  UI->>API: REST request /v1/*
  API->>Guard: JWT, tenant, role, permission, validation
  Guard->>Service: Authorized request
  Service->>SQL: Repository-style method call
  SQL->>DB: Parameterized SQL query
  DB-->>SQL: Rows/result
  SQL-->>Service: Domain object
  Service-->>API: Response DTO/object
  API-->>UI: JSON response
```

## Source Of Truth

| Concern | Source |
|---------|--------|
| Active database behavior | `backend/src/database/database.service.ts` |
| Reference SQL schema | `backend/schema.sql` |
| Backend module wiring | `backend/src/app.module.ts` and each `*.module.ts` |
| Frontend route map | `frontend/src/app/` |
| API client behavior | `frontend/src/lib/api.ts` |
| Local full-stack runtime | `infra/docker-compose.yml` |
