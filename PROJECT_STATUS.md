# TeleCore APMS - Project Status Documentation

## Current System Status: ✅ FULLY OPERATIONAL

### Domain & Branding
- **System Name**: TeleCore APMS (Advanced Project Management System)
- **Domain**: @apms.com
- **Database**: PostgreSQL (apms_local)
- **Ports**: Backend: 3011, Frontend: 3000

### Authentication System ✅
**All test users working:**
- admin@apms.com / Admin123! (ADMIN role)
- site.manager@apms.com / test123 (SITE_MANAGER role)
- vendor.admin@apms.com / test123 (VENDOR_ADMIN role)
- field.engineer@apms.com / test123 (FOP_RTS role)
- business.ops@apms.com / test123 (BO role)

**Login Endpoint**: `POST /api/v1/auth/login`

### RBAC System ✅
**Permission Structure**:
- **VENDOR roles**: Can upload ATP documents only
- **APPROVAL roles**: Can review/approve ATP documents only
- **SITE_MANAGER**: Access to sites and tasks modules
- **ADMIN**: Full system access

**Key Files**:
- `backend/src/utils/atpPermissions.js` - Permission definitions
- `frontend/src/hooks/usePermissions.js` - Frontend permission checks
- `backend/src/middleware/atpAuth.js` - API protection

### ATP System ✅
**Workflow Paths**:
- Hardware ATP: FOP_RTS → REGION_TEAM → RTH
- Software ATP: BO → SME → HEAD_NOC

**ATP Scopes** ✅:
- ATP Scope, RAN, PLN Upgrade, Dismantle Keep, Dismantle Drop
- MW, MW Upgrade, VLAN Tagging, IPRAN, IBS Lamp Site, Mini CME
- **API**: `GET /api/v1/scopes`
- **Component**: `ScopeSelector.tsx` (renamed to Site Type)

**User Management System** ✅ NEW:
- **User List**: Display all test users with CRUD operations
- **Role Management**: Assign roles to users with real-time updates
- **Permission Mapping**: Role-to-module access control matrix
- **APIs**: `/api/v1/users`, `/api/v1/users/roles`, `/api/v1/modules`, `/api/v1/permissions`
- **Components**: `UserList.tsx`, `RoleManagement.tsx`, `PermissionMapping.tsx`

**Features**:
- Digital document management
- Template system
- File uploads
- Role-based access control
- Scope selection in upload form

### Database Schema ✅
**Migrations**:
- `006_enhance_atp_digital_documents.sql` - ATP documents
- `007_add_atp_scopes.sql` - ATP scopes table (PostgreSQL)

### Recent Updates ✅
- **Access Control**: Removed adminOnly restriction from main route
- **ATP Scopes**: Added 11 ATP scopes with PostgreSQL integration
- **Database**: Confirmed PostgreSQL usage (not MySQL)
- **API Integration**: Scopes API working with pg client
- **User Management**: Complete user management system with test users
- **Role Management**: Role assignment and management interface
- **Permission Mapping**: Role-to-module access control matrix

### Key Components
- `frontend/src/App.tsx` - Main application with dashboard
- `frontend/src/components/auth/LoginPage.tsx` - APMS branded login
- `frontend/src/components/ATPManagement/` - ATP management system
- `frontend/src/components/ATPManagement/ScopeSelector.tsx` - Site type selector
- `frontend/src/components/UserManagement/` - User management system
- `frontend/src/components/UserManagement/RoleManagement.tsx` - Role assignment
- `frontend/src/components/UserManagement/PermissionMapping.tsx` - Role-module permissions
- `backend/server.js` - Main server with auth endpoints
- `backend/src/routes/scopeRoutes.js` - ATP scopes API
- `backend/src/routes/userRoutes.js` - User management API

### Startup Commands
```bash
# Backend
cd backend && node server.js

# Frontend  
cd frontend && npm start
```

### Database Connection
- **Type**: PostgreSQL
- **Database**: apms_local
- **URL**: postgresql://endik@localhost:5432/apms_local

## System Ready for Production ✅