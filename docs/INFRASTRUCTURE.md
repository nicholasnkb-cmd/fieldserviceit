# Infrastructure — Deployment

## Architecture

```
Cloudflare CDN/WAF
       │
  Load Balancer (AWS ALB / Nginx Ingress)
       │
  Kubernetes Cluster (EKS / AKS / GKE)
       │
  ┌────┴────┐          ┌───────────┐
  │ Backend │  ───→    │ MySQL 8.0 │
  │ Pods    │          │ Managed DB│
  └─────────┘          └───────────┘
       │
  ┌────┴────┐          ┌───────────┐
  │ Frontend│          │ Mail      │
  │ Pods    │          │ SMTP      │
  └─────────┘          └───────────┘
       │
  ┌────┴────┐
  │ File    │
  │ Storage │ (S3 / GCS — photos, signatures, attachments)
  └─────────┘
```

## Docker Compose (Development)

```yaml
services:
  mysql:
    image: mysql:8.0
    environment:
      MYSQL_DATABASE: fieldserviceit
      MYSQL_USER: app
      MYSQL_PASSWORD: ${DB_PASSWORD}
    volumes:
      - mysqldata:/var/lib/mysql
    ports:
      - "3306:3306"

  backend:
    build: ./backend
    environment:
      DATABASE_URL: mysql://app:${DB_PASSWORD}@mysql:3306/fieldserviceit
      JWT_SECRET: ${JWT_SECRET}
    ports:
      - "4000:4000"
    depends_on:
      - mysql

  frontend:
    build: ./frontend
    environment:
      NEXT_PUBLIC_API_URL: http://localhost:4000
    ports:
      - "3000:3000"
```

## Hostinger Production Database

Use the Hostinger MySQL database name in the backend environment:

```env
DATABASE_URL=mysql://USERNAME:PASSWORD@HOST:3306/u209468809_fieldserviceit
```

Replace `USERNAME`, `PASSWORD`, and `HOST` with the values shown in Hostinger hPanel.

## Kubernetes Manifests (see `infra/kubernetes/`)

Includes:
- `namespace.yaml` — Isolation per environment
- `backend-deployment.yaml` — NestJS app pods
- `frontend-deployment.yaml` — Next.js app pods
- `configmap.yaml` — App configuration
- `secrets.example.yaml` — Non-deployable shape reference only. Provision the `app-secrets`
  Secret outside source control with the hosting platform, an external secret manager, or a
  SOPS-encrypted manifest that is never committed in plaintext.
- `ingress.yaml` — Nginx Ingress + TLS
- `hpa.yaml` — Horizontal Pod Autoscaler
- `pdb.yaml` — Pod Disruption Budget
- `network-policy.yaml` — Pod network isolation

## CI/CD Pipeline (GitHub Actions)

See `.github/workflows/`

- **PR Check:** lint → typecheck → test → build
- **Staging Deploy:** On merge to `develop` — deploy to staging cluster
- **Production Deploy:** On tag/release — deploy to prod cluster (canary)

## Terraform (Infrastructure as Code)

See `infra/terraform/`

Manages:
- VPC / networking
- EKS cluster (or AKS/GKE)
- Managed MySQL instance
- S3 bucket for file storage
- Cloudflare DNS / WAF
- IAM roles / service accounts

## Monitoring & Observability

- **Logs:** Loki + Promtail (structured JSON logging)
- **Metrics:** Prometheus + Grafana dashboards
- **Traces:** OpenTelemetry (Tempo/Jaeger)
- **Alerts:** AlertManager (PagerDuty / Slack)

## Backup & Disaster Recovery

- MySQL: Daily snapshots plus point-in-time recovery where supported by the provider
- Files: S3 versioning + cross-region replication
- DR: Multi-region standby cluster (1-hour RPO, 4-hour RTO)
