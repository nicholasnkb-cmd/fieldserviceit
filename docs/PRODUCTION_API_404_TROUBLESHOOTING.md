# Production API 404 Errors - Troubleshooting Guide

**Issue**: Direct API calls to `https://fieldserviceit.com/v1/auth/login` return `404 Not Found`

**Status**: Investigated June 10, 2026  
**Priority**: CRITICAL - API is inaccessible despite frontend loading

---

## Root Cause Analysis

The Nginx configuration at `infra/nginx.conf` shows:
```nginx
location /v1/ {
  limit_req zone=api burst=50 nodelay;
  proxy_pass http://backend;
  ...
}
```

This should route `/v1/*` requests to the backend. However, the backend returns 404.

### Possible Causes

1. **Backend Not Running or Unhealthy**
   - Container crashes on startup
   - Database connection fails
   - Port 4000 not listening

2. **CORS_ORIGIN Misconfigured**
   - `CORS_ORIGIN` env var not set to `https://fieldserviceit.com`
   - Backend rejects cross-origin requests

3. **Nginx Routing Issues**
   - `/v1/` prefix not being stripped before proxying
   - Backend receives `/v1/` in path but routes are at `/auth/login`
   - Regex or location matching failure

4. **Backend Global Prefix Issue**
   - In `main.ts` line 17: `app.setGlobalPrefix('v1')`
   - This adds `/v1/` to ALL routes
   - With Nginx also routing `/v1/`, requests become `/v1/v1/*`

5. **Load Balancer or Reverse Proxy**
   - Hostinger may have an additional reverse proxy
   - API subdomain routing different from frontend domain

---

## Diagnostics to Run

### 1. Check Backend Health (via Frontend Console)
```javascript
fetch('https://fieldserviceit.com/v1/health', {
  method: 'GET',
  credentials: 'include'
}).then(r => r.json()).then(d => console.log(d))
```

**Expected Response**: `{ status: "ok", timestamp: "...", version: "1.0.0" }`  
**If 404**: Backend not responding or Nginx routing broken

### 2. Check Nginx Logs (via Hostinger hPanel)
- Go to Applications → api.fieldserviceit.com
- View error logs: Look for "upstream timed out" or "404"
- Check access logs: Verify requests arrive at Nginx

### 3. Check Backend Container Logs (via Hostinger SSH)
```bash
# SSH into Hostinger server
ssh user@server.ip

# Find Docker container
docker ps | grep fieldservice

# View backend logs
docker logs <container-id> --tail 100 --follow
```

**Look for**:
- `[Bootstrap] Server running on port 4000` - Good
- `Error connecting to database` - Database issue
- `PANIC: timer has gone away` - Prisma issue
- No logs = container not running

### 4. Verify NestJS Routes
Check that all controllers are properly decorated:
```typescript
@Controller('auth')  // Routes at /auth not /v1/auth
export class AuthController {
  @Post('login')     // Final route: /v1/auth/login (v1 added globally)
  async login() { ... }
}
```

### 5. Check CORS Configuration
```bash
# From browser console, check response headers:
fetch('https://fieldserviceit.com/v1/auth/login', {
  method: 'OPTIONS',
  headers: { 'Origin': 'https://fieldserviceit.com' }
}).then(r => console.log({
  headers: r.headers,
  status: r.status,
  'access-control-allow-origin': r.headers.get('access-control-allow-origin')
}))
```

---

## Quick Fixes to Try

### Fix 1: Verify Backend Container is Running
```bash
# Connect via Hostinger hPanel → Terminal
docker ps
docker restart <container-id>  # If not running, restart it
```

### Fix 2: Check/Fix CORS_ORIGIN Environment Variable
In Hostinger hPanel:
1. Go to Applications → api.fieldserviceit.com
2. Environment Variables → Add/Update:
   - `CORS_ORIGIN`: `https://fieldserviceit.com`
   - `FRONTEND_URL`: `https://fieldserviceit.com`
3. Redeploy application

### Fix 3: Fix Nginx Double Prefix Issue
**Current issue**: Nginx routes `/v1/` to backend, but NestJS also adds `/v1/` prefix

**Option A**: Remove global prefix from NestJS (main.ts line 17)
```typescript
// Comment out or remove this line:
// app.setGlobalPrefix('v1');
```
Then update Nginx to expect routes without prefix.

**Option B**: Strip `/v1/` in Nginx before proxying
```nginx
location /v1/ {
  proxy_pass http://backend/;  # Note trailing slash strips /v1/
  rewrite ^/v1/(.*)$ /$1 break; # Alternative: explicit rewrite
  ...
}
```

### Fix 4: Verify Backend Can Connect to Database
```bash
# SSH into server
docker exec <backend-container> npm run test:e2e
# Or check with health endpoint
curl http://localhost:4000/v1/health
```

### Fix 5: Check if API Subdomain is Different
Hostinger may have separate subdomains:
- Frontend: `https://fieldserviceit.com`
- API: `https://api.fieldserviceit.com` (different domain)

If so, CORS must allow both origins:
```typescript
// In main.ts
app.enableCors({
  origin: ['https://fieldserviceit.com', 'https://api.fieldserviceit.com'],
  credentials: true,
});
```

---

## Long-Term Monitoring

### 1. Add Health Check Endpoint ✅ (DONE)
- Implemented: `GET /v1/health`
- Returns: `{ status, timestamp, version, database: { status, latency } }`
- Set up Kubernetes liveness probe to monitor this

### 2. Enable Structured Logging ✅ (DONE)
- Added correlation ID middleware
- Middleware captures request context
- Logs include correlation ID for tracing

### 3. Setup Alerting
- Monitor health endpoint response time
- Alert if backend takes >5 seconds to respond
- Alert on 404 errors in API logs

### 4. Testing
Run these tests regularly:
```bash
# Test API connectivity
npm run test:e2e -- permission-scopes-and-array.spec.ts
npm run test:e2e -- asset-enrollment.e2e-spec.ts

# Test health endpoint
curl https://fieldserviceit.com/v1/health
```

---

## If All Else Fails

### Nuclear Option: Redeploy Everything
1. **SSH into Hostinger**
2. **Backup database**: `mysqldump -u user -p database > backup.sql`
3. **Kill containers**: `docker-compose down`
4. **Pull latest**: `git pull origin master`
5. **Rebuild**: `npm run build`
6. **Restart**: `docker-compose up -d`
7. **Verify**: `curl https://fieldserviceit.com/v1/health`

---

## Prevention

1. ✅ Add health check endpoint → Deploy monitoring
2. ✅ Add structured logging → Debug issues faster
3. ✅ Add E2E tests → Catch regressions early
4. ✅ Add correlation IDs → Trace requests across services
5. Setup CI/CD automated tests before production deployment
6. Setup uptime monitoring (Pingdom, UptimeRobot, etc.)

---

## References

- **NestJS Global Prefix**: https://docs.nestjs.com/faq/global-prefix
- **Nginx Proxy Configuration**: https://nginx.org/en/docs/http/ngx_http_proxy_module.html
- **CORS Specification**: https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS
- **Backend Logs**: `C:\Projects\FieldserviceIT\backend-start.out.log`
- **Frontend Logs**: `C:\Projects\FieldserviceIT\frontend-nextstart.out.log`
