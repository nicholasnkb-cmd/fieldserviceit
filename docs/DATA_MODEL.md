# Data Model — Multi-Tenant Schema

## Entity Relationship Overview

```
Company 1──N User
Company 1──N Ticket
Company 1──N Asset
Company 1──N Workflow
Company 1──N Contract

User 1──N Ticket (created)
User 1──N Ticket (assigned)
User 1──N Dispatch
User 1──N Notification

Ticket N──1 Asset
Ticket N──1 Contract
Ticket N──1 SLA
Ticket 1──N TimelineEntry
Ticket 1──N Dispatch

Asset N──1 AssetType
Asset 1──N Ticket
Asset 1──N Contract

Workflow 1──N WorkflowStep
Workflow 1──N WorkflowRun
WorkflowRun 1──N WorkflowRunStep
```

## SQL Schema

The runtime database is MySQL. `backend/src/database/database.service.ts` is the active data access layer and ensures the required tables on startup. `backend/schema.sql` is a reference SQL script for manual setup.

The `backend/prisma/` files are legacy helpers and should not be treated as the source of truth unless the project intentionally migrates back to Prisma.

### Core Tables

| Table | Description | Tenant Scope |
|-------|-------------|-------------|
| `Company` | Tenant organizations | Root (no companyId) |
| `User` | All platform users | companyId |
| `Ticket` | ITSM tickets (incidents, requests, problems, changes) | companyId |
| `TicketTimeline` | Ticket activity log | via ticket/company context |
| `TicketAttachment` | Ticket files | via ticket/company context |
| `Asset` | MDM/CMDB device records for desktops, laptops, mobile devices, servers, kiosks, IoT, printers, and network hardware | companyId |
| `Contract` | Service contracts / agreements | companyId |
| `SLA` | SLA definitions and targets | companyId |
| `Workflow` | Workflow templates | companyId |
| `WorkflowStep` | Individual workflow steps | via workflow/company context |
| `WorkflowRun` | Workflow execution instances | companyId |
| `WorkflowRunStep` | Per-step execution status | via workflow run/company context |
| `Dispatch` | Field technician dispatch records | companyId |
| `Notification` | User notifications | companyId |
| `NotificationPreference` | Per-user notification settings | via user/company context |
| `AuditLog` | Immutable audit trail | companyId |
| `Session` | Auth sessions / refresh tokens | via user/company context |
| `Plan` | Billing plans | Shared |
| `CompanyPlan` | Tenant subscription plan | companyId |
| `UsageRecord` | Billing usage counters | companyId |

### Key Field Conventions

- **id:** UUID v4 primary key
- **companyId:** UUID foreign key (null for shared/system rows)
- **createdAt/updatedAt:** Auto-managed timestamps
- **deletedAt:** Nullable soft-delete timestamp
- **status:** Enum string field

### Ticket Status Enum

```
OPEN → ASSIGNED → IN_PROGRESS → PENDING → RESOLVED → CLOSED
  ↘ ESCALATED
```

### Asset Types Enum

```
COMPUTER, SERVER, PRINTER, SWITCH, IP_PHONE, CLOUD_INSTANCE, NETWORK_DEVICE, VIRTUAL_MACHINE, OTHER
```

### Priority Enum

```
LOW, MEDIUM, HIGH, CRITICAL
```

### User Roles (RBAC)

```
SUPER_ADMIN     # Platform-wide admin
TENANT_ADMIN    # Company admin
TECHNICIAN      # Field/service technician
CLIENT          # End user / requestor
READ_ONLY       # View-only access
```
