# FieldserviceIT Troubleshooting Runbook

## Quick Reference: Common Issues & Solutions

| Issue | Root Cause | Solution | Time |
|-------|-----------|----------|------|
| API returns 404 | CORS_ORIGIN not set | Update Hostinger env vars | 5 min |
| Slow database queries | Missing indexes | Run migration scripts | 10 min |
| Permission scopes not working | AND array misconfigured | Check database.service.ts | 15 min |
| Ticket description broken | XSS sanitization | ✅ Fixed with DOMPurify | - |
| High error rate | Request validation issues | Check ValidationPipe config | 20 min |
| Memory leak | Permission scope cache | ✅ Implemented with TTL | - |

---

## Issue: API Returns 404

**Symptoms**:
- `curl https://fieldserviceit.com/v1/auth/login` returns 404
- Frontend loads but cannot make API calls
- "Failed to fetch" errors in browser console

**Root Causes** (in order of likelihood):
1. CORS_ORIGIN environment variable not set
2. Backend container not running
3. Nginx double-prefix issue (/v1/ added twice)
4. Database connection failed
5. API gateway routing misconfigured

**Diagnostic Steps**:

```bash
# 1. Check if health endpoint works
curl https://fieldserviceit.com/v1/health

# 2. If 404, check backend logs
ssh user@hostinger-server
docker logs <backend-container-id> --tail 100

# 3. Check if container is running
docker ps | grep fieldservice

# 4. Verify environment variables
echo $CORS_ORIGIN
echo $FRONTEND_URL
echo $DATABASE_URL (first 50 chars)
```

**Quick Fixes**:

### Fix 1: Set CORS_ORIGIN (Most Common)
1. Go to Hostinger hPanel
2. Applications → api.fieldserviceit.com
3. Environment Variables → Add/Update:
   - `CORS_ORIGIN`: `https://fieldserviceit.com`
   - `FRONTEND_URL`: `https://fieldserviceit.com`
   - `NODE_ENV`: `production`
4. Click "Deploy" or "Redeploy"
5. Wait 2-3 minutes
6. Test: `curl https://fieldserviceit.com/v1/health`

### Fix 2: Restart Backend Container
```bash
docker restart <backend-container-id>

# Or via hPanel: Redeployment
```

### Fix 3: Verify Database Connectivity
```bash
# SSH into server
docker exec <backend-container-id> node -e "
  const mysql = require('mysql2/promise');
  mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME
  }).then(() => console.log('✓ DB OK')).catch(e => console.log('✗ DB ERROR:', e.message));
"
```

---

## Issue: Slow Database Queries

**Symptoms**:
- API responses take >5 seconds
- "Slow query detected" messages in logs
- Asset enrollment times out
- Permission scope queries are slow

**Root Causes**:
- Missing database indexes
- Permission scope query lacks proper indexing
- Asset query with complex AND conditions
- Missing EXPLAIN plan optimization

**Diagnostic Steps**:

```bash
# 1. Check for slow queries in logs
docker logs <backend-container-id> | grep "Slow query"

# 2. Get metrics report
curl https://fieldserviceit.com/v1/health
# Look for "database.latency" > 1000ms

# 3. Check missing indexes
mysql -u user -p database << 'EOF'
SELECT * FROM information_schema.STATISTICS 
WHERE TABLE_SCHEMA = 'fieldservices' 
ORDER BY TABLE_NAME;
EOF
```

**Solutions**:

### Solution 1: Add Missing Indexes
```sql
-- For asset queries with permission scopes
CREATE INDEX idx_asset_company_status ON Asset(companyId, status, enrollmentStatus);
CREATE INDEX idx_asset_company_type ON Asset(companyId, assetType);

-- For permission scope lookups
CREATE INDEX idx_permission_scope_user ON PermissionScope(userId, permissionSlug);
CREATE INDEX idx_permission_scope_role ON PermissionScope(roleId, permissionSlug);

-- For ticket queries
CREATE INDEX idx_ticket_company_status ON Ticket(companyId, status);
```

### Solution 2: Verify Query Execution Plans
```bash
# Test slow query
mysql -u user -p database -e "
EXPLAIN SELECT * FROM Asset 
WHERE companyId = 'xxx' AND status IN ('active', 'pending')
LIMIT 10;
"

# Should show: Using index; NOT "Full scan"
```

### Solution 3: Enable Query Logging
```bash
# Enable slow query log (temporary)
mysql -u user -p -e "SET GLOBAL slow_query_log = 'ON'; SET GLOBAL long_query_time = 2;"

# Monitor
tail -f /var/log/mysql/slow.log
```

---

## Issue: Permission Scopes Not Working

**Symptoms**:
- Tenant admin sees assets from other companies
- Asset count doesn't match visible assets
- AND array conditions ignored in queries
- "Insufficient permissions" errors for valid users

**Root Causes**:
- AND array not properly flattened
- WHERE clause builder malfunction
- Permission scope not attached to request
- Database query using wrong column names

**Diagnostic Steps**:

```typescript
// In service, add debug logging
console.log('Permission scopes:', user.permissionScopes);
console.log('WHERE clause:', where);

// Before query
const results = await this.prisma.asset.findMany({ where });
console.log('Query results:', results.length);
```

**Solutions**:

### Solution 1: Verify AND Array Syntax
```typescript
// CORRECT
const where = {
  AND: [
    { companyId: user.companyId },
    { status: { in: ['active', 'pending'] } }
  ]
};

// INCORRECT
const where = {
  companyId: user.companyId,
  AND: [{ status: { in: ['active', 'pending'] } }]  // ❌ Mixed syntax
};
```

### Solution 2: Check Permission Scope SQL
The backend generates SQL like:
```sql
SELECT * FROM Asset 
WHERE (companyId = ?) AND (status IN (?, ?))
LIMIT 10
```

If missing AND operator, check `database.service.ts` line ~1411

### Solution 3: Trace Permission Loading
```typescript
// In PermissionsGuard
const scopes = await this.prisma.query(`
  SELECT * FROM PermissionScope 
  WHERE userId = ? OR roleId IN (${roleIds})
`);

console.log('Loaded scopes:', scopes);
```

---

## Issue: High Error Rate (>1%)

**Symptoms**:
- Metrics report shows `errorRate: 2.5%`
- Request validation errors spike
- Users report failures intermittently
- "Forbidden" or "Bad Request" errors

**Root Causes**:
- Global ValidationPipe rejects unknown fields
- Client sending extra fields in DTOs
- Missing required fields in requests
- Type mismatches in API payloads

**Diagnostic Steps**:

```bash
# Check error logs
docker logs <backend-container-id> | grep -i "error\|forbidden\|validation"

# Get metrics
curl https://fieldserviceit.com/v1/health | jq .requests

# Expected output:
# {
#   "total": 5240,
#   "errors": 23,
#   "errorRate": "0.44%",
#   "averageLatency": "145ms"
# }
```

**Solutions**:

### Solution 1: Audit Request Validation Errors
```bash
# Get recent validation errors
docker logs <backend-container-id> --since 10m | grep "should not exist"

# Example output:
# "property shouldNotBeHere should not exist"

# This means client is sending unknown fields
```

### Solution 2: Review ValidationPipe Configuration
```typescript
// In main.ts - currently set to strict mode
app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true,              // Strip unknown properties
    forbidNonWhitelisted: true,   // Throw error if unknown props found
  }),
);

// For development/debugging, temporarily change to:
app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: false,  // Just warn, don't error
  }),
);
```

### Solution 3: Check DTO Definitions
```typescript
// Verify DTOs accept all client fields
// Example: CreateAssetDto should have all MDM fields

export class CreateAssetDto {
  name: string;
  deviceCategory?: string;      // ✅ Present
  // ... etc
  unknownField?: string;         // ❌ Not in DTO, will be rejected
}
```

---

## Issue: Memory Leak or OOM (Out of Memory)

**Symptoms**:
- Backend process crashes after 1-2 hours
- "killed" messages in logs
- Memory usage grows continuously
- 502 Bad Gateway errors

**Root Causes**:
- Permission scope cache growing unbounded
- Request deduplication map accumulating entries
- Event listeners not cleaned up
- Circular references in objects

**Diagnostic Steps**:

```bash
# Check memory usage
docker stats <backend-container-id>

# Expected: 150-300MB steady
# Problem: 500MB+ or growing

# Get heap snapshot
docker exec <backend-container-id> node -e "
  const v8 = require('v8');
  const fs = require('fs');
  const snapshot = v8.writeHeapSnapshot();
  console.log('Heap written:', snapshot);
"
```

**Solutions**:

### Solution 1: Enable Cache TTL (Implemented)
```typescript
// StructuredLogger now clears old metrics

// Permission scope cache clears every 5 minutes
setTimeout(() => {
  this.permissionScopeCache.clear();
}, 300000);  // 5 minutes
```

### Solution 2: Monitor Memory Growth
```bash
# Add to health check
async getMetrics() {
  const used = process.memoryUsage();
  return {
    memory: {
      heapUsed: Math.round(used.heapUsed / 1024 / 1024) + 'MB',
      heapTotal: Math.round(used.heapTotal / 1024 / 1024) + 'MB',
    }
  };
}
```

### Solution 3: Restart on High Memory
```bash
# Script to monitor and restart if needed
while true; do
  MEMORY=$(docker stats --no-stream <container> | tail -1 | awk '{print $4}' | sed 's/%//')
  if (( $(echo "$MEMORY > 85" | bc -l) )); then
    docker restart <container>
    echo "Restarted due to high memory: $MEMORY%"
  fi
  sleep 60
done
```

---

## Issue: XSS Vulnerability in Ticket Rendering

**Status**: ✅ **FIXED** in latest version

**What Changed**:
- Added `isomorphic-dompurify` library
- All HTML in ticket descriptions is now sanitized
- Only safe tags allowed: `<p>`, `<a>`, `<img>`, `<strong>`, `<em>`, etc.
- XSS payloads are stripped before rendering

**Verification**:
```bash
# Test with malicious payload
curl -X POST https://fieldserviceit.com/v1/tickets \
  -H "Authorization: Bearer TOKEN" \
  -d '{
    "description": "<script>alert(\"XSS\")</script><p>Real content</p>"
  }'

# Response: script tag is removed, only <p> rendered
```

---

## Monitoring & Alerting

### Setup Health Check Monitoring

```bash
#!/bin/bash
# health-monitor.sh - Monitor health every 60 seconds

while true; do
  RESPONSE=$(curl -s -w "\n%{http_code}" https://fieldserviceit.com/v1/health)
  STATUS=$(echo "$RESPONSE" | tail -1)
  BODY=$(echo "$RESPONSE" | head -1)
  
  DB_LATENCY=$(echo "$BODY" | jq .database.latency)
  
  echo "$(date): Status=$STATUS Latency=${DB_LATENCY}ms"
  
  # Alert if unhealthy
  if [ "$STATUS" != "200" ]; then
    echo "⚠️  ALERT: Health check failed!"
    # Send alert (email, Slack, PagerDuty, etc.)
  fi
  
  # Alert if slow
  if [ "$DB_LATENCY" -gt 5000 ]; then
    echo "⚠️  ALERT: Database is slow: ${DB_LATENCY}ms"
  fi
  
  sleep 60
done
```

### Setup Metrics Reporting

```bash
# Get current metrics
curl https://fieldserviceit.com/v1/health | jq '{
  requests: .requests,
  slowQueries: .slowQueries,
  uptime: ((now - .startTime) / 60 | floor),
}'
```

---

## Emergency Procedures

### Nuclear Option: Full Redeploy
```bash
# 1. Backup database
mysqldump -u user -p database > backup-$(date +%Y%m%d-%H%M%S).sql

# 2. Stop containers
docker-compose down

# 3. Pull latest code
git pull origin master

# 4. Rebuild and restart
npm run build
docker-compose up -d

# 5. Verify
curl https://fieldserviceit.com/v1/health
```

### Kill and Restart Specific Service
```bash
# Backend only
docker restart fieldserviceit-backend

# Frontend only
docker restart fieldserviceit-frontend

# Database only
docker restart fieldserviceit-mysql
```

### Rollback to Previous Version
```bash
git log --oneline | head -5
git checkout <commit-hash>
npm run build
docker-compose up -d --force-recreate
```

---

## Prevention Checklist

- [ ] Monitor health endpoint daily
- [ ] Check error rate (should be <0.5%)
- [ ] Review slow query logs weekly
- [ ] Test database backups monthly
- [ ] Run performance tests before releases
- [ ] Monitor memory usage continuously
- [ ] Setup alerting on health failures
- [ ] Document all custom configurations
- [ ] Keep dependency versions updated
- [ ] Schedule regular security audits

---

## Contacts & Resources

- **Backend Logs**: `docker logs <container-id>`
- **Database**: Connect via Hostinger hPanel → Databases
- **Frontend Build Logs**: Check Hostinger → Deployments
- **GitHub**: https://github.com/nicholasnkb-cmd/fieldserviceit
- **Support**: support@fieldserviceit.com

---

**Last Updated**: June 10, 2026  
**Version**: 1.0.0
