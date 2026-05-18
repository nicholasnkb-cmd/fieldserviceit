# FieldserviceIT — Deployment Handoff

## Current Status (May 15, 2026)

### ✅ Working
| Component | URL | Status |
|-----------|-----|--------|
| Frontend | `https://fieldserviceit.com` | ✅ Next.js app loads, redirects to `/login` |
| Backend API | `https://api.fieldserviceit.com` | ✅ App starts and serves requests |
| Health Check | `https://api.fieldserviceit.com/v1/health` | ✅ Returns `{"status":"ok"}` |
| Login | `POST /v1/auth/login` | ✅ Returns 401 for bad creds (DB reads + bcryptjs work) |
| MySQL Database | `u209468809_Fieldservices` on `127.0.0.1` | ✅ Connected, 26 tables |
| MySQL User | `u209468809_Nicholasnkb` / `Kimray27905` | ✅ Full privileges |
| GitHub | `fieldserviceit-backend.git` / `fieldserviceit-frontend.git` | ✅ Latest pushed |

### ❌ Known Issues
- ~~**42 TypeScript build errors**~~ ✅ **Zero TS errors** — all missing methods added to `DatabaseService`
- ~~**Missing `dist/` files in repo**~~ ✅ Build now passes cleanly (removed `|| true`)
- ~~**Register endpoint returns 500**~~ 🔄 Fixed `PrismaService` (removed broken `$connect`/`$disconnect`). **Need to test after hPanel redeploy**
- **SSH unreliable**: Times out frequently.

### 🔜 Next Steps (Priority Order)

1. **Redeploy & test register endpoint**: Go to hPanel → Node.js → `api.fieldserviceit.com` → Redeploy. Then test `POST /v1/auth/register`.

2. **If register still 500s**: Check hPanel runtime logs for `[registerPublic]` step messages. The error will be one of:
   - `generateTokens` → `session.create` fails (check Session table schema)
   - `user.create` fails (check User table constraints — `updatedAt DATETIME(3) NOT NULL`)
   - `bcryptjs` hash fails (unlikely, login works)

3. **Set up SMTP**: Add SMTP credentials to hPanel env vars for email verification and password reset.

## hPanel Configuration

### Backend App (`api.fieldserviceit.com`)
| Setting | Value |
|---------|-------|
| Repo | `fieldserviceit-backend` |
| Branch | `master` |
| Framework | NestJS |
| Node Version | 20.x |
| Root Directory | `./` |
| Build Command | `npm run build` |
| Start Command | `npm run start:hostinger` |
| Entry File | `dist/main.js` |

#### Environment Variables
| Key | Value |
|-----|-------|
| `DATABASE_URL` | `mysql://u209468809_Nicholasnkb:Kimray27905@127.0.0.1/u209468809_Fieldservices` |
| `JWT_SECRET` | `c4ed60787459dc853da407f8a4214e61780ba5436fcb9f344d31b17c6ee1acac` |
| `CORS_ORIGIN` | `https://fieldserviceit.com` |
| `FRONTEND_URL` | `https://fieldserviceit.com` |
| `NODE_ENV` | `production` |
| `SWAGGER_ENABLED` | `false` |

### Frontend App (`fieldserviceit.com`)
| Setting | Value |
|---------|-------|
| Repo | `fieldserviceit-frontend` |
| Branch | `master` |
| Framework | Next.js |
| Node Version | 20.x |

#### Environment Variables
| Key | Value |
|-----|-------|
| `NEXT_PUBLIC_API_URL` | `https://api.fieldserviceit.com` |

## Key Technical Details

### MySQL
- **Host**: `127.0.0.1:3306` (NOT `mysql.hostinger.com`)
- **Database**: `u209468809_Fieldservices`
- **User**: `u209468809_Nicholasnkb`
- **Password**: `Kimray27905`
- **phpMyAdmin**: `https://auth-db1915.hstgr.io`

### SSH
- `ssh -p 65002 u209468809@82.29.157.99` (password: `Jdf@27905`)

### Git Repos
- **Monorepo**: `https://github.com/nicholasnkb-cmd/fieldserviceit.git`
- **Backend-only**: `https://github.com/nicholasnkb-cmd/fieldserviceit-backend.git`
- **Frontend-only**: `https://github.com/nicholasnkb-cmd/fieldserviceit-frontend.git`
- Push to both: `git push origin master && git push backend-origin master --force`

### Architecture
- **Prisma replaced with `mysql2`**: `DatabaseService` (1334 lines) provides Prisma-style API using pure JS `mysql2` driver
- **`PrismaService`** (9 lines): Empty shell extending `DatabaseService`, provided globally via `DatabaseModule`
- **All services** use `this.prisma.user.create()`, `this.prisma.session.findUnique()` — these delegate to `DatabaseService`
- **`bcryptjs`** replaces native `bcrypt` to avoid compilation failures
- **UUIDs** generated manually (no Prisma `@default(uuid())`)
- **`createdAt`/`updatedAt`** injected manually on all `create` operations

### Build Process
```json
"build": "node node_modules/typescript/bin/tsc -p tsconfig.build.json"
```
1. Runs `tsc` — **zero errors**, clean build
2. Start command: `bash start-hostinger.sh` → `node dist/main.js`

### Recent Changes
| File | Change |
|------|--------|
| `backend/src/database/database.service.ts` | Added all missing methods: `groupBy`, `upsert`, `createMany`, `updateMany`, `deleteMany`, `count`, `findFirst`, `findUnique`, `create`, `update` on dispatch, notification, asset, user, role, rolePermission, userRole, rmmProviderConfig, ticket, ticketTimeline. Added `orderBy`, `include`, `take` params. Added `resolveSelectCols` helper. Widened `select` types. Added generic helpers. |
| `backend/src/modules/auth/services/auth.service.ts` | Fixed `RowDataPacket` type cast at line 192 |
| `backend/tsconfig.json` | Added `rxjs` path mapping for type declarations |
| `backend/package.json` | Build script: `|| true` → (removed, clean build now) |

### Troubleshooting
- Runtime logs show `[Bootstrap] Server running on http://0.0.0.0:PORT` when app starts
- Prisma engine panic shows `PANIC: timer has gone away` (should be gone now)
- Auth errors show `Authentication failed against database server` — check password
- If build shows "Build OK" but deploy fails → runtime issue, check runtime logs
- If subdomain shows "This Page Does Not Exist" → Node.js app not running
- If frontend shows "Failed to fetch" → check CORS or API URL
- **Register 500**: Check hPanel runtime logs for `[registerPublic]` step messages
