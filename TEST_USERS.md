# TeleCore APMS - Test Users & Roles

## Test User Credentials

### 1. System Administrator
- **Email**: `admin@apms.com`
- **Password**: `Admin123!`
- **Role**: `ADMIN`
- **Permissions**: Full system access, all modules

### 2. Site Manager
- **Email**: `site.manager@apms.com`
- **Password**: `test123`
- **Role**: `SITE_MANAGER`
- **Permissions**: Site management, task management

### 3. Vendor Admin (ATP Upload)
- **Email**: `vendor.admin@apms.com`
- **Password**: `test123`
- **Role**: `VENDOR_ADMIN`
- **Permissions**: ATP document upload only

### 4. Vendor Staff (ATP Upload)
- **Email**: `vendor.staff@apms.com`
- **Password**: `test123`
- **Role**: `VENDOR_STAFF`
- **Permissions**: ATP document upload only

### 5. Field Engineer (Hardware ATP Review)
- **Email**: `field.engineer@apms.com`
- **Password**: `test123`
- **Role**: `FOP_RTS`
- **Permissions**: Hardware ATP review (Stage 1)

### 6. Region Supervisor (Hardware ATP Review)
- **Email**: `region.supervisor@apms.com`
- **Password**: `test123`
- **Role**: `REGION_TEAM`
- **Permissions**: Hardware ATP review (Stage 2)

### 7. Hardware Manager (Hardware ATP Review)
- **Email**: `hardware.manager@apms.com`
- **Password**: `test123`
- **Role**: `RTH`
- **Permissions**: Hardware ATP review (Stage 3 - Final)

### 8. Business Operations (Software ATP Review)
- **Email**: `business.ops@apms.com`
- **Password**: `test123`
- **Role**: `BO`
- **Permissions**: Software ATP review (Stage 1)

### 9. Technical Expert (Software ATP Review)
- **Email**: `technical.expert@apms.com`
- **Password**: `test123`
- **Role**: `SME`
- **Permissions**: Software ATP review (Stage 2)

### 10. NOC Head (Software ATP Review)
- **Email**: `noc.head@apms.com`
- **Password**: `test123`
- **Role**: `HEAD_NOC`
- **Permissions**: Software ATP review (Stage 3 - Final)

## ATP Workflow Testing

### Hardware ATP Workflow
1. **Upload**: `vendor.admin@apms.com` or `vendor.staff@apms.com`
2. **Review Stage 1**: `field.engineer@apms.com` (FOP_RTS)
3. **Review Stage 2**: `region.supervisor@apms.com` (REGION_TEAM)
4. **Final Approval**: `hardware.manager@apms.com` (RTH)

### Software ATP Workflow
1. **Upload**: `vendor.admin@apms.com` or `vendor.staff@apms.com`
2. **Review Stage 1**: `business.ops@apms.com` (BO)
3. **Review Stage 2**: `technical.expert@apms.com` (SME)
4. **Final Approval**: `noc.head@apms.com` (HEAD_NOC)

## Login Testing
```bash
# Test all logins
cd backend && node test-all-logins.js
```

## Access URLs
- **Login Page**: http://localhost:3000/login
- **Dashboard**: http://localhost:3000/
- **API Health**: http://localhost:3011/api/health