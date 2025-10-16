# ✅ Domain Change: TeleCore.com → AMPS.com

## 🎯 Perubahan yang Dilakukan

### 1. Database Updates ✅
```sql
-- Updated 12 email addresses
UPDATE users SET email = REPLACE(email, '@telecore.com', '@amps.com') 
WHERE email LIKE '%@telecore.com%';
```

### 2. Backend Configuration ✅
- **Admin Login**: `admin@telecore.com` → `admin@amps.com`
- **Server Name**: "TeleCore APMS API" → "AMPS API"
- **Health Check**: Service name updated

### 3. Test Users Updated ✅
```
Vendor Administration:
├── vendor.admin@amps.com (VENDOR_ADMIN)
└── vendor.staff@amps.com (VENDOR_STAFF)

Hardware Workflow:
├── field.engineer@amps.com (FOP_RTS)
├── region.supervisor@amps.com (REGION_TEAM)
└── hardware.manager@amps.com (RTH)

Software Workflow:
├── business.ops@amps.com (BO)
├── technical.expert@amps.com (SME)
└── noc.head@amps.com (HEAD_NOC)
```

### 4. Documentation Updated ✅
- System title: "TeleCore APMS" → "AMPS"
- All references updated

## 🧪 Test Results

### ✅ All Tests Passing:
- Server running: AMPS API
- Admin login: admin@amps.com ✅
- VENDOR_ADMIN upload: Working ✅
- Database: 12 users updated ✅

## 🚀 New Login Credentials

### Frontend Login:
```
URL: http://localhost:3000
Email: admin@amps.com
Password: Admin123!
```

### RBAC Test Users:
```
Vendor: vendor.admin@amps.com / test123
Field: field.engineer@amps.com / test123
Business: business.ops@amps.com / test123
```

## 📋 Verification Commands

```bash
# Test admin login
curl -X POST http://localhost:3011/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@amps.com","password":"Admin123!"}'

# Check database
psql "postgresql://endik@localhost:5432/apms_local" -c "
SELECT email, role FROM users WHERE email LIKE '%@amps.com%';"

# Run domain test
node test-amps-domain.js
```

## 🎉 Domain Change Complete!

**AMPS (Advanced Project Management System) sekarang menggunakan domain @amps.com untuk semua user accounts dan system branding.**