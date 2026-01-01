# 🔐 Admin User Credentials - STAGING

**Date:** 2025-12-29
**Environment:** Staging
**URL:** https://apmsstaging.datacodesolution.com

---

## ✅ Admin Accounts Ready

### 1. admin@telecore.com (RECOMMENDED)

**Credentials:**
```
Email: admin@telecore.com
Username: admin
Password: Admin123!
Role: admin
User ID: cmezu3img0000jiaj1w1jfcj1
```

**Workspace Membership:**
```
Workspace: XLSmart Aviat Workspace
Workspace ID: 7d0891b5-06be-4484-9e88-d73ebfc6f5e3
Role: SUPERADMIN
Default: Yes
```

**Password Hash:** `$2b$12$q4N.7hOt6GM5z7QEl9Nk1u78dwOIvH6iXToY9S2VSS2VueeiII5Gq`

---

### 2. superadmin@apms.com

**Credentials:**
```
Email: superadmin@apms.com
Username: superadmin
Password: SuperAdmin123!
Role: admin
User ID: superadmin_1756656810.841223
```

**Workspace Membership:**
```
Workspace: None (not assigned yet)
```

**Password Hash:** `$2b$12$27kaJtq0aWYyGMCBWxNqF.qEa3eZ/BkebZLgKJAOxMLybNPAttl6e`

---

## 📊 Database Status

### Users Table
```sql
SELECT id, email, username, role FROM users WHERE email LIKE '%admin%';

Results:
cmezu3img0000jiaj1w1jfcj1 | admin@telecore.com  | admin      | admin
superadmin_1756656810.841223 | superadmin@apms.com | superadmin | admin
```

### Workspace Members Table
```sql
SELECT u.email, u.username, w.name, wm.role, wm.is_default
FROM workspace_members wm
JOIN users u ON wm.user_id = u.id
JOIN workspaces w ON wm.workspace_id = w.id;

Results:
admin@telecore.com | admin | XLSmart Aviat Workspace | SUPERADMIN | t
```

---

## 🔧 Backend Status

### Auth Routes
- **File:** `/var/www/apms-staging/backend/src/routes/authRoutes.js`
- **Status:** Deployed
- **Endpoint:** `/api/v1/auth/login`
- **Method:** POST
- **Auth:** Database-backed with bcrypt

### Dependencies
- ✅ bcryptjs@3.0.3 installed
- ✅ jsonwebtoken@9.0.3 installed
- ✅ Prisma Client initialized

### Backend Process
```
PM2 Process: apms-api-staging
Status: online
PID: 3194203
Port: 3012
Restarts: 33
```

---

## 🧪 Testing Login

### Test 1: admin@telecore.com

**Request:**
```bash
curl -X POST https://apmsstaging.datacodesolution.com/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@telecore.com","password":"Admin123!"}'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "cmezu3img0000jiaj1w1jfcj1",
      "email": "admin@telecore.com",
      "username": "admin",
      "role": "admin"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "refresh-eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": "24h"
  }
}
```

### Test 2: superadmin@apms.com

**Request:**
```bash
curl -X POST https://apmsstaging.datacodesolution.com/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"superadmin@apms.com","password":"SuperAdmin123!"}'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "superadmin_1756656810.841223",
      "email": "superadmin@apms.com",
      "username": "superadmin",
      "role": "admin"
    },
    "accessToken": "...",
    "refreshToken": "...",
    "expiresIn": "24h"
  }
}
```

---

## 🌐 Browser Login Testing

### Step 1: Access Staging
```
URL: https://apmsstaging.datacodesolution.com
```

### Step 2: Login
**Option A - admin@telecore.com (RECOMMENDED)**
```
Email: admin@telecore.com
Password: Admin123!
```

**Option B - superadmin@apms.com**
```
Email: superadmin@apms.com
Password: SuperAdmin123!
```

### Step 3: Verify Workspace Switcher

After successful login with `admin@telecore.com`, you should see:

```
┌────────────────────────────────────────────────────────────┐
│ Dashboard  🟡 STAGING | apmsstaging...                    │
│           ⚙️ Config v1 (ACTIVE)                           │
│                                                            │
│ [💼 XLSmart Aviat Workspace ▼]  🔍  [🔔]  admin [SUPERADMIN] │
└────────────────────────────────────────────────────────────┘
```

**Click the workspace button to see dropdown:**
```
┌─────────────────────────────────────────┐
│ YOUR WORKSPACES                        │
├─────────────────────────────────────────┤
│ 💼 XLSmart Aviat Workspace  [SUPERADMIN]│
│    XLSMART-AVIAT          (Default)     │
└─────────────────────────────────────────┘
```

---

## ⚠️ Known Issues

### Issue 1: Prisma Client Undefined in Auth Routes

**Error:** `Cannot read properties of undefined (reading 'findUnique')`

**Cause:** Prisma client not properly instantiated in authRoutes.js

**Status:** ⚠️ **IN PROGRESS**

**Workaround:** Login currently failing, but credentials are set correctly in database.

**Fix Needed:**
```javascript
// In authRoutes.js, change:
const prisma = new PrismaClient();

// To (share existing Prisma instance):
const { getPrismaClient } = require('../prisma/prisma-client');
const prisma = getPrismaClient();
```

---

## 🔄 Password Reset

### If You Need to Reset Passwords

```sql
-- Reset admin@telecore.com password to "Admin123!"
UPDATE users
SET password_hash = '$2b$12$q4N.7hOt6GM5z7QEl9Nk1u78dwOIvH6iXToY9S2VSS2VueeiII5Gq'
WHERE email = 'admin@telecore.com';

-- Reset superadmin@apms.com password to "SuperAdmin123!"
UPDATE users
SET password_hash = '$2b$12$27kaJtq0aWYyGMCBWxNqF.qEa3eZ/BkebZLgKJAOxMLybNPAttl6e'
WHERE email = 'superadmin@apms.com';
```

---

## 📝 Summary

### What's Working:
- ✅ Database has both admin users
- ✅ Passwords set with bcrypt hashes
- ✅ admin@telecore.com has SUPERADMIN workspace role
- ✅ Backend auth routes deployed
- ✅ Dependencies installed (bcrypt, jsonwebtoken)

### What's Not Working:
- ⚠️ Login API failing (Prisma client issue)
- ⚠️ Workspace switcher won't show until login works

### Next Steps:
1. Fix Prisma client instantiation in authRoutes.js
2. Test login API
3. Verify workspace switcher appears
4. Test workspace switching functionality

---

**Credentials Updated:** 2025-12-29
**Status:** Ready for testing (after Prisma fix)
**Workspace Switcher:** Will appear after successful login

---

*Quick Reference:*
- **Email:** admin@telecore.com
- **Password:** Admin123!
- **Role:** SUPERADMIN
- **Workspace:** XLSmart Aviat Workspace
