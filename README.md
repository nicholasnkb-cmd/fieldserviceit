# FieldserviceIT

Multi-tenant enterprise workflow + IT operations platform (ITSM/MSP).

## Architecture

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14, React 18, Tailwind CSS, shadcn/ui, Zustand |
| Backend | Node.js 20, NestJS 10, REST |
| Database | MySQL 8.0 |
| Auth | JWT, bcrypt |
| Real-time | Socket.IO (WebSocket) |
| Infra | Hostinger (shared/cloud hosting), Docker |

## Project Structure

```
FieldserviceIT/
├── docs/                        # Architecture & design docs
├── backend/                     # NestJS API server (port 4000)
│   ├── schema.sql               # Reference SQL schema
│   ├── prisma/                  # Legacy schema/seed helpers
│   └── src/
│       ├── common/              # Guards, decorators, interceptors
│       ├── config/              # App configuration
│       ├── database/            # MySQL SQL data access layer
│       └── modules/             # Feature modules
│           ├── admin/           # Platform & tenant admin (roles, permissions, audit logs)
│           ├── auth/            # Authentication & authorization
│           ├── billing/         # Plans, Stripe subscriptions, usage counters
│           ├── cmdb/            # Asset/CMDB management
│           ├── companies/       # Tenant management
│           ├── field-service/   # Technician dispatch & mobile
│           ├── health/          # API/database health checks
│           ├── notifications/   # In-app notifications & email delivery
│           ├── reporting/       # Analytics & BI reports
│           ├── rmm-integration/ # RMM provider sync (ConnectWise, Datto, NinjaOne)
│           ├── search/          # Cross-domain search
│           ├── settings/        # Tenant settings & branding
│           ├── tickets/         # ITSM ticketing (incidents, requests, problems, changes)
│           ├── uploads/         # Avatar, attachment, dispatch photo & signature uploads
│           ├── users/           # User management
│           └── workflow/        # Workflow definitions & runs
├── frontend/                    # Next.js application (port 3000)
│   └── src/
│       ├── app/                 # Pages (login, dashboard, admin)
│       ├── components/          # UI components
│       ├── lib/                 # API client, utilities
│       ├── stores/              # Zustand state management
│       └── types/               # TypeScript types
├── infra/                       # Infrastructure configs
│   ├── docker-compose.yml       # Local development (MySQL, MailHog)
│   ├── kubernetes/              # K8s manifests (reference)
│   └── nginx.conf               # Reverse proxy config (reference)
└── .github/workflows/           # CI/CD pipelines
```

## Quick Start (Development)

### Prerequisites
- Node.js 20
- Docker (for MySQL)

### Backend

```bash
cd backend
npm install
copy .env.example .env          # Edit DATABASE_URL for your DB
npm run seed                    # Populate plans, roles, demo company, users, assets, and sample ticket
npm run start:dev
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Using Docker (full stack)

```bash
docker compose -f infra/docker-compose.yml up -d
```

## Deployment

Target: **Hostinger shared/cloud hosting** (Node.js 20 + MySQL 8.0).

The backend creates/ensures its MySQL tables at startup through the SQL data access layer.
Docker-based local deployment is defined in `infra/docker-compose.yml`.
Use `docs/HOSTINGER_DEPLOYMENT.md` plus the Hostinger env templates in `backend/.env.hostinger.example` and `frontend/.env.hostinger.example` for production setup.

Production database name on Hostinger:

```env
DATABASE_URL=mysql://USERNAME:PASSWORD@HOST:3306/u209468809_fieldserviceit
```

## Core Modules

- **ITSM** — Incident, request, problem, change management with SLAs
- **CMDB / MDM** — Asset tracking (computers, servers, printers, switches, IP phones, cloud) with MDM enrollment, compliance, and remote commands
- **Field Service** — Technician dispatch, GPS, signatures, photo uploads
- **RMM Integration** — ConnectWise, Datto, NinjaOne sync
- **Workflow Engine** — Custom workflow definitions, triggers, and run tracking
- **Billing** — Plan management, Stripe subscriptions, usage counters
- **Notifications** — In-app notifications and email delivery (password reset, ticket updates)
- **Admin** — Platform/tenant admin: roles, permissions, audit logs, system readiness
- **Search** — Cross-domain search across tickets, assets, contacts
- **Settings** — Tenant settings and branding
- **Uploads** — Avatar, attachment, dispatch photo, and signature uploads
- **Health** — API and database connectivity health checks
- **Granular Permissions** — 25 permissions across 6 groups, 5 system roles
- **Multi-Tenant** — Row-level isolation via companyId

## Seed Accounts

| Email | Password | Role |
|-------|----------|------|
| super@fieldserviceit.com | admin123 | SUPER_ADMIN |
| admin@acme.com | admin123 | TENANT_ADMIN |
| client@acme.com | client123 | CLIENT |
| tech1@acme.com | tech123 | TECHNICIAN |
| tech2@acme.com | tech123 | TECHNICIAN |

If these accounts do not exist, run `npm run seed` inside `backend/` after MySQL is running and `DATABASE_URL` points at the target database.

## License

Proprietary — All rights reserved.
