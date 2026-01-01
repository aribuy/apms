# 🎯 Production Testing & Staging Environment - Summary

**Date:** 2025-12-28
**Status:** ⚠️ Production Testing Complete | Staging Plan Ready

---

## ✅ Production Testing Results

### What's Working in Production

**URL:** https://apms.datacodesolution.com
**Server:** 31.97.220.37 (Ubuntu 24.04)

| Component | Status | Details |
|-----------|--------|---------|
| API Health | ✅ PASS | `/api/health` returns 200 OK |
| Idempotency Middleware | ✅ DEPLOYED | Protects site-registration and ATP upload endpoints |
| LibreOffice | ✅ INSTALLED | Version 24.2.7.2 - Word to PDF conversion ready |
| ATP Auto-Categorization | ✅ DEPLOYED | Filename-based keyword analysis |
| PM2 Service | ✅ RUNNING | apms-api: online (118MB memory) |
| Frontend | ✅ ACCESSIBLE | UI loads correctly |

### Current Production Issues

**❌ Database Connection Failure**

```
Error: PrismaClientInitializationError
Authentication failed against database server
```

**Impact:**
- Site registration fails: `{"error":"Failed to register site"}`
- Cannot test idempotency middleware fully
- ATP upload may fail

**Location:** `/var/www/apms/backend/src/routes/siteRegistrationRoutes.js:75`

**Required Action:**
```bash
ssh root@31.97.220.37
cd /var/www/apms/backend
cat .env  # Check database credentials
npx prisma db push  # Test connection
pm2 restart apms-api
```

---

## 🏗️ Staging Environment Plan

### Recommendation: YES, staging environment diperlukan!

**Why?**

1. **Testing aman** - Tidak risikonya production
2. **Reproduksi bug** - Bisa test production bugs di environment terpisah
3. **Quality assurance** - Contract tests bisa dijalankan sebelum production
4. **Deployment safety** - Perubahan tested dulu di staging

### Proposed Setup

**Option 1: Same Server, Different Port** (Recommended - Lower Cost)

```
Production: https://apms.datacodesolution.com (Port 3011)
Staging:    https://apmsstaging.datacodesolution.com (Port 3012)

Database:
- Production: apms_production
- Staging:    apms_staging

Directory Structure:
/var/www/apms/          # Production
/var/www/apms-staging/  # Staging
```

**Cost:** No additional server cost
**Isolation:** Separate database and port
**Risk:** Low - isolated from production

### Quick Setup Steps

```bash
# 1. Create staging database
mysql -u root -p
CREATE DATABASE apms_staging;
CREATE USER 'apms_staging'@'localhost' IDENTIFIED BY 'password';
GRANT ALL ON apms_staging.* TO 'apms_staging'@'localhost';

# 2. Create staging directory
mkdir -p /var/www/apms-staging/backend
mkdir -p /var/www/apms-staging/frontend

# 3. Deploy code to staging (use deployment script)
./deploy-to-staging.sh

# 4. Configure nginx
cp /etc/nginx/sites-available/apms.datacodesolution.com \
   /etc/nginx/sites-available/apmsstaging.datacodesolution.com
# Edit: Change port to 3012, add basic auth

# 5. Start staging PM2 process
cd /var/www/apms-staging/backend
pm2 start server.js --name "apms-api-staging" --env staging
```

---

## 📋 What's Been Implemented

### Enterprise-Grade Testing (Local Development)

✅ **Idempotency Middleware** - Prevent double submit
✅ **Contract Tests** - API response validation
✅ **3-Layer RBAC Tests** - UI, Route, API authorization
✅ **State Machine Tests** - Approval chain validation
✅ **Test Data Generator** - Unique patterns with cleanup
✅ **Evidence Pack** - JUnit XML, coverage reports

**Documentation:**
- [docs/testing/ENTERPRISE_TESTING_IMPLEMENTATION.md](ENTERPRISE_TESTING_IMPLEMENTATION.md)
- [docs/testing/APMS_AUTOMATION_ENHANCED.md](APMS_AUTOMATION_ENHANCED.md)

### Production Deployment

✅ **Idempotency Middleware** - Deployed to production
✅ **Word to PDF Conversion** - LibreOffice installed
✅ **ATP Auto-Categorization** - Filename-based categorization
✅ **Deployment Script** - [deploy-idempotency-production.sh](deploy-idempotency-production.sh)

**Documentation:**
- [docs/deployment/PRODUCTION_TEST_RESULTS.md](PRODUCTION_TEST_RESULTS.md)
- [docs/deployment/STAGING_ENVIRONMENT_PLAN.md](STAGING_ENVIRONMENT_PLAN.md)

---

## 🚨 Immediate Actions Required

### Priority 1: Fix Database Connection

**Problem:** Production database credentials invalid

**Solution:**
```bash
ssh root@31.97.220.37
cd /var/www/apms/backend

# Check current .env
cat .env | grep DATABASE

# Test connection
npx prisma db push

# Update credentials if needed
nano .env

# Restart service
pm2 restart apms-api
```

### Priority 2: Test After Database Fix

Once database is working:

```bash
# Test site registration
curl -X POST https://apms.datacodesolution.com/api/v1/site-registration/register \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: test-$(date +%s)" \
  -d '{
    "customerSiteId": "PROD-TEST-'$(date +%Y%m%d%H%M%S)'",
    "customerSiteName": "Production Test",
    "neLatitude": -7.2575,
    "neLongitude": 112.7521,
    "feLatitude": -7.2675,
    "feLongitude": 112.7621,
    "region": "East Java",
    "atpRequirements": {"software": true, "hardware": true}
  }'

# Test idempotency (send same request twice with same key)
# Second request should return cached response
```

### Priority 3: Setup Staging Environment

**Decision Required:**

- **Option A:** Setup staging on same server (Port 3012)
  - ✅ Lower cost
  - ✅ Faster to setup
  - ⚠️ Shared resources

- **Option B:** Setup separate staging server
  - ✅ Complete isolation
  - ✅ Production-grade setup
  - ❌ Higher cost

**Recommendation:** Start with Option A

---

## 📊 Testing Strategy

### Current Setup

```
LOCAL DEVELOPMENT:
├── Unit Tests (Jest)
├── Integration Tests (Supertest)
├── Contract Tests (NEW - Business Rules)
└── E2E Tests (TagUI - Planned)

PRODUCTION:
├── Manual Testing (UI browser)
└── API Testing (curl) ⚠️ No automated tests

STAGING:
└── NOT YET SETUP 📋 Plan ready
```

### Recommended Flow

```
1. Develop locally
   ├── Run contract tests
   ├── Run integration tests
   └── Test in UI browser

2. Deploy to staging
   ├── Run automated test suite
   ├── Manual QA testing
   └── Bug fixes

3. Deploy to production
   ├── Final smoke tests
   └── Monitor logs
```

---

## 📁 Documentation Files

| Document | Location | Purpose |
|----------|----------|---------|
| Production Test Results | [docs/deployment/PRODUCTION_TEST_RESULTS.md](PRODUCTION_TEST_RESULTS.md) | Production testing status and issues |
| Staging Environment Plan | [docs/deployment/STAGING_ENVIRONMENT_PLAN.md](STAGING_ENVIRONMENT_PLAN.md) | Complete staging setup guide |
| Enterprise Testing | [docs/testing/ENTERPRISE_TESTING_IMPLEMENTATION.md](testing/ENTERPRISE_TESTING_IMPLEMENTATION.md) | Testing infrastructure documentation |
| Automation Strategy | [docs/testing/APMS_AUTOMATION_ENHANCED.md](testing/APMS_AUTOMATION_ENHANCED.md) | Testing strategy and critical rules |
| Deployment Script | [deploy-idempotency-production.sh](deploy-idempotency-production.sh) | Deploy to production |

---

## 🎯 Next Steps Summary

### Immediate (Today)
1. ⚠️ Fix production database connection
2. Test site registration after DB fix
3. Test idempotency (double submit)

### This Week
1. Decide staging setup (Option A or B)
2. Create staging database
3. Setup staging directory structure
4. Deploy to staging
5. Run contract tests on staging

### Next Sprint
1. Implement automated CI/CD
2. Setup GitHub Actions
3. Configure automated testing pipeline
4. Monitor and optimize

---

## 💬 Questions for Decision Making

1. **Staging Environment:**
   - Apakah setup staging di server yang sama (Option A) atau server terpisah (Option B)?
   - Apakah domain `apmsstaging.datacodesolution.com` sudah tersedia?

2. **Database:**
   - Apakah ada DBA yang bisa check production database credentials?
   - Apakah perlu bantuan untuk reset atau fix database connection?

3. **Testing:**
   - Apakah mau setup staging sekarang atau fix production dulu?
   - Apakah ada waktu untuk manual testing di staging?

---

## 📞 Quick Reference

**Production Commands:**
```bash
# Check status
ssh root@31.97.220.37 "pm2 status apms-api"

# View logs
ssh root@31.97.220.37 "pm2 logs apms-api --lines 50"

# Restart service
ssh root@31.97.220.37 "pm2 restart apms-api"

# Test API
curl https://apms.datacodesolution.com/api/health
```

**Local Testing:**
```bash
# Run contract tests
cd backend
npm test -- tests/contracts

# Run all tests with coverage
npm run test:coverage

# View coverage report
open coverage/lcov-report/index.html
```

---

**Status:** ✅ Enterprise testing complete | ⚠️ Production DB needs fix | 📋 Staging plan ready
**Last Updated:** 2025-12-28
