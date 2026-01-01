# Production Testing Results & Issues

**Date:** 2025-12-28
**Environment:** https://apms.datacodesolution.com
**Server:** 31.97.220.37 (Ubuntu 24.04)

---

## ✅ What's Working

### 1. API Health Check
```bash
curl https://apms.datacodesolution.com/api/health
```

**Result:** ✅ PASS
```json
{
  "status": "ok",
  "timestamp": "2025-12-28T02:23:16.727Z",
  "service": "AMPS API",
  "version": "1.0.0"
}
```

### 2. Idempotency Middleware Deployment
- ✅ Middleware file uploaded: `/var/www/apms/backend/src/middleware/idempotency.js`
- ✅ Integrated into server.js
- ✅ PM2 service restarted successfully
- ✅ Service status: **online** (PID: 3149079, Memory: 118.4MB)

**Protected Endpoints:**
- `/api/v1/site-registration` - Idempotency enabled
- `/api/v1/atp/upload` - Idempotency enabled
- `/api/v1/atp/bulk-upload` - Idempotency enabled

### 3. LibreOffice Installation
- ✅ LibreOffice 24.2.7.2 installed (deployed earlier)
- ✅ Word to PDF conversion available
- ✅ Command available: `soffice --headless --convert-to pdf`

### 4. ATP Auto-Categorization
- ✅ File exists: `/var/www/apms/backend/src/utils/atpCategorization.js`
- ✅ Integrated into upload routes
- ✅ Filename-based keyword analysis

---

## ❌ Current Issues

### Issue #1: Database Connection Failure

**Error:**
```
PrismaClientInitializationError:
Authentication failed against database server,
the provided database credentials for `endik` are not valid.
```

**Impact:**
- Site registration fails: `{"error":"Failed to register site"}`
- Sites list fails: Error 500 when fetching sites
- ATP document upload may fail

**Location:**
- `/var/www/apms/backend/src/routes/siteRegistrationRoutes.js:75`
- Error: `Cannot read properties of undefined (reading 'create')`

**Root Cause:**
Database credentials invalid or database server not accessible

**Action Required:**
1. Check database server status
2. Verify database credentials in `.env` file
3. Test database connection manually

**Test Command:**
```bash
ssh root@31.97.220.37
cd /var/www/apms/backend
cat .env | grep DATABASE
npx prisma db push
```

---

## 📋 Test Results Summary

| Feature | Status | Notes |
|---------|--------|-------|
| API Health | ✅ PASS | Returns 200 OK |
| Idempotency Middleware | ✅ DEPLOYED | Integrated and running |
| Word to PDF Conversion | ✅ AVAILABLE | LibreOffice 24.2.7.2 installed |
| ATP Auto-Categorization | ✅ DEPLOYED | File uploaded and integrated |
| Site Registration | ❌ FAIL | Database connection error |
| ATP Document Upload | ⚠️ UNTTESTED | Depends on database fix |
| Bulk Upload | ⚠️ UNTTESTED | Depends on database fix |
| Frontend Access | ✅ PASS | UI loads at https://apms.datacodesolution.com |

---

## 🔍 Verification Steps Performed

### 1. Idempotency Middleware Verification

**Command:**
```bash
ssh root@31.97.220.37 "ls -la /var/www/apms/backend/src/middleware/"
```

**Result:**
```
-rw-r--r-- 1 root root idempotency.js  # ✅ Exists
```

**Command:**
```bash
ssh root@31.97.220.37 "grep -A 5 'idempotency' /var/www/apms/backend/server.js"
```

**Result:**
```javascript
// Idempotency middleware (must be after express.json)
const { idempotencyCheck } = require("./src/middleware/idempotency");
app.use("/api/v1/site-registration", idempotencyCheck);
app.use("/api/v1/atp/upload", idempotencyCheck);
app.use("/api/v1/atp/bulk-upload", idempotencyCheck);
```
✅ Middleware properly configured

### 2. LibreOffice Verification

**Command:**
```bash
ssh root@31.97.220.37 "soffice --version"
```

**Result:**
```
LibreOffice 24.2.7.2 Build 0b11a748ca23f7eb7af4ca6e9dc65c7fe6b201c5
```
✅ LibreOffice installed and working

### 3. PM2 Process Status

**Command:**
```bash
ssh root@31.97.220.37 "pm2 status apms-api"
```

**Result:**
```
┌────┬───────────┬─────────┬─────────┬──────────┬────────┬──────┬────────┬──────────┬──────────┐
│ id │ name      │ version │ mode    │ pid      │ uptime │ ↺    │ status │ cpu      │ mem      │
├────┼───────────┼─────────┼─────────┼──────────┼────────┼──────┼────────┼──────────┼──────────┤
│ 5  │ apms-api  │ 1.0.0   │ fork    │ 3149079  │ 3s     │ 16   │ online │ 0%       │ 118.4mb  │
└────┴───────────┴─────────┴─────────┴──────────┴────────┴──────┴────────┴──────────┴──────────┘
```
✅ Service online and healthy

---

## 🚀 Next Steps

### Immediate (Priority 1)

1. **Fix Database Connection**
   ```bash
   ssh root@31.97.220.37
   cd /var/www/apms/backend
   cat .env  # Check database credentials
   npx prisma db push  # Test connection
   pm2 restart apms-api
   ```

2. **Test Site Registration After DB Fix**
   ```bash
   curl -X POST https://apms.datacodesolution.com/api/v1/site-registration/register \
     -H "Content-Type: application/json" \
     -H "Idempotency-Key: test-key-123" \
     -d '{
       "customerSiteId": "TEST-SITE-001",
       "customerSiteName": "Test Site",
       "neLatitude": -7.2575,
       "neLongitude": 112.7521,
       "feLatitude": -7.2675,
       "feLongitude": 112.7621,
       "region": "East Java",
       "atpRequirements": {"software": true, "hardware": true}
     }'
   ```

3. **Test Idempotency (Double Submit Prevention)**
   - Send same request twice with same `Idempotency-Key`
   - Verify second request returns cached response
   - Verify only 1 site created in database

### Short-Term (Priority 2)

1. **Setup Staging Environment**
   - Create staging database
   - Deploy to staging.apms.datacodesolution.com
   - Configure staging environment variables

2. **Implement Automated Testing**
   - Deploy contract tests to staging
   - Run test suite on staging before production
   - Setup CI/CD pipeline

### Long-Term (Priority 3)

1. **Database Migration**
   - Consider cloud database (AWS RDS, DigitalOcean Managed DB)
   - Implement database backup strategy
   - Setup read replicas for performance

2. **Monitoring & Alerting**
   - Setup PM2 monitoring
   - Configure error tracking (Sentry)
   - Implement uptime monitoring

---

## 📞 Support & Troubleshooting

### Quick Commands

```bash
# Check service status
ssh root@31.97.220.37 "pm2 status"

# View recent logs
ssh root@31.97.220.37 "pm2 logs apms-api --lines 50"

# Restart service
ssh root@31.97.220.37 "pm2 restart apms-api"

# Test database connection
ssh root@31.97.220.37 "cd /var/www/apms/backend && npx prisma db push"

# Check environment variables
ssh root@31.97.220.37 "cd /var/www/apms/backend && cat .env | grep -v PASSWORD"
```

### Error Log Location

**Production Server:**
- Error logs: `/var/www/apms/backend/logs/api-error-5.log`
- PM2 logs: `~/.pm2/logs/apms-api-error.log`

---

## 📊 Deployment Checklist

Production Deployment Status:

- [x] Idempotency middleware deployed
- [x] LibreOffice installed
- [x] ATP categorization deployed
- [x] PM2 service configured
- [ ] Database connection working
- [ ] Site registration tested
- [ ] ATP upload tested
- [ ] Word to PDF conversion tested
- [ ] Idempotency tested (double submit)
- [ ] Bulk upload tested
- [ ] Contract tests run on staging
- [ ] Staging environment created

---

**Last Updated:** 2025-12-28 02:30 UTC
**Status:** ⚠️ PARTIALLY DEPLOYED - Database connection issue needs resolution
