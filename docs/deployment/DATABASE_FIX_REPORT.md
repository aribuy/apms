# Production Database Fix Report

**Date:** 2025-12-28
**Status:** ✅ DATABASE CONNECTION FIXED | ⚠️ CODE UPDATE NEEDED

---

## 🎯 Issue Summary

### Problem 1: Database Connection - ✅ FIXED

**Root Cause:** Incorrect database configuration in `.env` file

**Issues Found:**
1. Database name mismatch: `.env` had `apms_local`, actual database is `apms_db`
2. User mismatch: `.env` had `endik`, actual user is `apms_user`
3. Authentication method: Using Unix socket (peer auth) instead of TCP
4. Missing password: User `apms_user` requires password

**Solution Applied:**
```bash
# Updated .env with correct configuration:
DB_HOST=127.0.0.1  # TCP connection instead of localhost
DB_PORT=5432
DB_NAME=apms_db
DB_USER=apms_user
DB_PASS=Apms@2024!

DATABASE_URL="postgresql://apms_user:Apms@2024!@127.0.0.1:5432/apms_db"
```

**Verification:**
```bash
npx prisma db push --skip-generate
# Result: ✅ Your database is now in sync with Prisma schema. Done in 354ms
```

---

### Problem 2: Code Using Wrong Table Name - ⚠️ NEEDS FIX

**Root Cause:** Code uses `prisma.site_registrations` but table name is `prisma.sites`

**Location:** `/var/www/apms/backend/src/routes/siteRegistrationRoutes.js:75`

**Current Code:**
```javascript
const site = await prisma.site_registrations.create({
  data: {
    customer_site_id: customerSiteId,
    customer_site_name: customerSiteName,
    // ...
  }
});
```

**Should Be:**
```javascript
const site = await prisma.sites.create({
  data: {
    site_id: customerSiteId,      // Changed from customer_site_id
    site_name: customerSiteName,  // Changed from customer_site_name
    region: region,
    ne_latitude: neLatitude,
    ne_longitude: neLongitude,
    fe_latitude: feLatitude,
    fe_longitude: feLongitude,
    status: 'ACTIVE',
    workflow_stage: 'REGISTERED',
    // ...
  }
});
```

**Table Schema (sites):**
| Column | Type | Notes |
|--------|------|-------|
| id | text (UUID) | Primary key, auto-generated |
| site_id | varchar(100) | UNIQUE - This is customer_site_id |
| site_name | varchar(255) | This is customer_site_name |
| region | varchar(100) | ✓ Match |
| ne_latitude | decimal(10,8) | ✓ Match |
| ne_longitude | decimal(11,8) | ✓ Match |
| fe_latitude | decimal(10,8) | ✓ Match |
| fe_longitude | decimal(11,8) | ✓ Match |
| status | varchar(50) | Default: 'ACTIVE' |
| workflow_stage | varchar(50) | Default: 'REGISTERED' |
| atp_required | boolean | Default: true |
| atp_type | varchar(20) | Default: 'BOTH' |

---

## 🔧 Required Changes

### File: `/var/www/apms/backend/src/routes/siteRegistrationRoutes.js`

**Lines to Update:**

1. **Line 75-99** (Site creation)
   ```javascript
   // OLD:
   const site = await prisma.site_registrations.create({
     data: {
       customer_site_id: customerSiteId,
       customer_site_name: customerSiteName,
       ne_tower_id: neTowerId,
       ne_tower_name: neTowerName,
       fe_tower_id: feTowerId,
       fe_tower_name: feTowerName,
       ne_latitude: parseFloat(neLatitude),
       ne_longitude: parseFloat(neLongitude),
       fe_latitude: parseFloat(feLatitude),
       fe_longitude: parseFloat(feLongitude),
       region: region,
       // ...
     }
   });

   // NEW:
   const site = await prisma.sites.create({
     data: {
       site_id: customerSiteId,
       site_name: customerSiteName,
       region: region,
       ne_latitude: new neLatitude,  // Keep as string, will be converted to Decimal
       ne_longitude: new neLongitude,
       fe_latitude: new feLatitude,
       fe_longitude: new feLongitude,
       status: 'ACTIVE',
       workflow_stage: 'REGISTERED',
       atp_required: true,
       atp_type: atpRequirements?.software && atpRequirements?.hardware ? 'BOTH' :
                  atpRequirements?.software ? 'SOFTWARE' :
                  atpRequirements?.hardware ? 'HARDWARE' : 'BOTH',
       // Note: tower fields might need to be stored in JSON or separate table
     }
   });
   ```

2. **Lines 101-146** (ATP Tasks creation)
   ```javascript
   // OLD: relatedSiteId: site.id
   // NEW: site_id: site.id

   const atpTasks = [];

   if (atpRequirements?.software) {
     const swTask = await prisma.tasks.create({
       data: {
         taskCode: `ATP-SW-${customerSiteId}-001`,
         taskType: 'ATP_SOFTWARE',
         title: `Software ATP Task - ${customerSiteId}`,
         description: `Software ATP testing for ${customerSiteName}`,
         status: 'pending',
         priority: 'high',
         assignedTo: assignedController,
         siteId: site.id,  // Changed from relatedSiteId
         dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
       }
     });
     atpTasks.push(swTask);
   }

   if (atpRequirements?.hardware) {
     const hwTask = await prisma.tasks.create({
       data: {
         taskCode: `ATP-HW-${customerSiteId}-001`,
         taskType: 'ATP_HARDWARE',
         title: `Hardware ATP Task - ${customerSiteId}`,
         description: `Hardware ATP testing for ${customerSiteName}`,
         status: 'pending',
         priority: 'high',
         assignedTo: assignedController,
         siteId: site.id,  // Changed from relatedSiteId
         dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
       }
     });
     atpTasks.push(hwTask);
   }
   ```

3. **Other occurrences:**
   - Line 234: `prisma.site_registrations.findFirst` → `prisma.sites.findFirst`
   - Line 261: `prisma.site_registrations.deleteMany` → `prisma.sites.deleteMany`

---

## 📋 Tasks Schema

**Table:** `tasks`
**Key Fields for ATP:**

| Field | Type | Notes |
|-------|------|-------|
| id | text (UUID) | Primary key |
| task_code | varchar(50) | UNIQUE - Format: `ATP-SW-{SITEID}-001` |
| task_type | varchar(50) | Values: `ATP_SOFTWARE`, `ATP_HARDWARE` |
| title | varchar(255) | Human-readable title |
| description | text | Detailed description |
| assigned_to | text | User ID (foreign key to users.id) |
| status | varchar(20) | Default: `pending` |
| priority | varchar(20) | Default: `normal` |
| site_id | text | Foreign key to sites.id |
| due_date | timestamp(6) | Due date |

---

## 🚀 Quick Fix Script

```bash
#!/bin/bash

# Fix siteRegistrationRoutes.js for production
sshpass -p 'Qazwsx123.Qazwsx123.' ssh -o StrictHostKeyChecking=no root@31.97.220.37 << 'ENDSSH'
cd /var/www/apms/backend

# Backup file
cp src/routes/siteRegistrationRoutes.js src/routes/siteRegistrationRoutes.js.backup-$(date +%Y%m%d)

# Apply fix using sed
sed -i 's/prisma\.site_registrations\.create/prisma.sites.create/g' src/routes/siteRegistrationRoutes.js
sed -i 's/prisma\.site_registrations\.findFirst/prisma.sites.findFirst/g' src/routes/siteRegistrationRoutes.js
sed -i 's/prisma\.site_registrations\.deleteMany/prisma.sites.deleteMany/g' src/routes/siteRegistrationRoutes.js
sed -i 's/customer_site_id/site_id/g' src/routes/siteRegistrationRoutes.js
sed -i 's/customer_site_name/site_name/g' src/routes/siteRegistrationRoutes.js
sed -i 's/relatedSiteId/siteId/g' src/routes/siteRegistrationRoutes.js

echo "✓ File updated"
pm2 restart apms-api
ENDSSH
```

⚠️ **WARNING:** This quick fix is basic. Field mapping needs manual review!

---

## 🧪 Testing After Fix

### Test 1: Site Registration
```bash
curl -X POST https://apms.datacodesolution.com/api/v1/site-registration/register \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: test-$(date +%s)" \
  -d '{
    "customerSiteId": "TEST-'$(date +%Y%m%d%H%M%S)'",
    "customerSiteName": "Test Site",
    "neLatitude": -7.2575,
    "neLongitude": 112.7521,
    "feLatitude": -7.2675,
    "feLongitude": 112.7621,
    "region": "East Java",
    "atpRequirements": {"software": true, "hardware": true}
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Site registered successfully",
  "data": {
    "site": {
      "id": "...",
      "site_id": "TEST-...",
      "site_name": "Test Site",
      "status": "ACTIVE"
    },
    "atpTasks": [
      {
        "id": "...",
        "task_code": "ATP-SW-TEST-...-001",
        "task_type": "ATP_SOFTWARE"
      },
      {
        "id": "...",
        "task_code": "ATP-HW-TEST-...-001",
        "task_type": "ATP_HARDWARE"
      }
    ]
  }
}
```

### Test 2: Verify Database
```bash
ssh root@31.97.220.37
sudo -u postgres psql -d apms_db -c "SELECT id, site_id, site_name, status FROM sites ORDER BY created_at DESC LIMIT 5;"
sudo -u postgres psql -d apms_db -c "SELECT id, task_code, task_type, status FROM tasks ORDER BY created_at DESC LIMIT 5;"
```

---

## 📊 Database Configuration Summary

### Current (Fixed) Configuration

```env
DATABASE_URL="postgresql://apms_user:Apms@2024!@127.0.0.1:5432/apms_db"
```

### Connection Details

| Parameter | Value |
|-----------|-------|
| Host | 127.0.0.1 (TCP) |
| Port | 5432 |
| Database | apms_db |
| User | apms_user |
| Password | Apms@2024! |
| PostgreSQL Version | 16.11 (Ubuntu) |

### Tables

| Table | Owner | Purpose |
|-------|--------|---------|
| sites | apms_user | Site registrations |
| tasks | apms_user | ATP tasks |
| atp_documents | apms_user | ATP documents |
| users | apms_user | User accounts |
| ... | ... | ... |

---

## 📞 Next Steps

### Immediate
1. ✅ Database connection - FIXED
2. ⚠️ Update code to use correct table names
3. ⚠️ Test site registration
4. ⚠️ Test ATP task creation

### Short-Term
1. Update Prisma schema to match existing tables
2. Create migration for missing fields (tower info, etc.)
3. Test all API endpoints
4. Run contract tests

### Long-Term
1. Create staging environment
2. Implement database migrations
3. Setup CI/CD pipeline
4. Automated testing

---

**Last Updated:** 2025-12-28 02:35 UTC
**Status:** ⚠️ Database fixed, code update pending
