# TeleCore APMS - Implementation Guide

## Quick Start

### 1. System Startup
```bash
# Backend (Terminal 1)
cd backend
node server.js
# Server runs on localhost:3011

# Frontend (Terminal 2) 
cd frontend
npm start
# App runs on localhost:3000
```

### 2. Test Login
- URL: http://localhost:3000/login
- Test user: `admin@apms.com` / `Admin123!`
- Or: `site.manager@apms.com` / `test123`

## Core Architecture

### Authentication Flow
1. **Login**: `POST /api/v1/auth/login` with email/password
2. **Token Storage**: localStorage stores `apms_token` and `apms_user`
3. **Route Protection**: `ProtectedRoute` component checks authentication
4. **RBAC**: `usePermissions` hook controls feature access

### Permission System
```javascript
// Check permissions in components
const { hasPermission } = usePermissions();
if (hasPermission('atp', 'upload')) {
  // Show upload button
}
```

### Role Mapping
- **VENDOR_ADMIN/VENDOR_STAFF**: ATP upload only
- **FOP_RTS/REGION_TEAM/RTH**: Hardware ATP approval
- **BO/SME/HEAD_NOC**: Software ATP approval  
- **SITE_MANAGER**: Site and task management
- **ADMIN**: Full access

## Key Implementation Files

### Backend Core
- `server.js` - Main server with auth endpoints
- `src/utils/atpPermissions.js` - Permission definitions
- `src/middleware/atpAuth.js` - Route protection
- `migrations/006_enhance_atp_digital_documents.sql` - Database schema

### Frontend Core
- `src/App.tsx` - Main application with routing
- `src/contexts/AuthContext.tsx` - Authentication state
- `src/hooks/usePermissions.js` - Permission checking
- `src/components/auth/LoginPage.tsx` - Login interface

### ATP System
- `src/components/ATPManagement/` - ATP management UI
- `src/components/ATPManagement/ScopeSelector.tsx` - Site type selector
- `src/routes/atpRoutes.js` - ATP API endpoints
- `src/components/ATPManagement/DigitalFormBuilder.tsx` - Dynamic forms

### User Management System
- `src/components/UserManagement/UserList.tsx` - User CRUD operations
- `src/components/UserManagement/RoleManagement.tsx` - Role assignment
- `src/components/UserManagement/PermissionMapping.tsx` - Role-module permissions
- `src/routes/userRoutes.js` - User management API

## Database Setup

### Required Tables
```sql
-- From migration 006
- digital_documents (ATP documents)
- document_templates (ATP templates)  
- document_attachments (file uploads)
- sites, users, organizations (existing)
```

### Test Data
- All test users pre-configured in `server.js`
- No database seeding required for basic testing

## API Endpoints

### Authentication
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/logout` - User logout

### Dashboard
- `GET /api/dashboard/stats` - Dashboard statistics
- `GET /api/dashboard/activities` - Recent activities

### ATP Management
- `GET /api/v1/atp/documents` - List ATP documents
- `POST /api/v1/atp/documents` - Create ATP document
- `PUT /api/v1/atp/documents/:id` - Update ATP document
- `GET /api/v1/scopes` - List ATP scopes (site types)

### User Management
- `GET /api/v1/users` - List all users
- `POST /api/v1/users/create` - Create new user
- `PUT /api/v1/users/update/:id` - Update user
- `DELETE /api/v1/users/delete/:id` - Delete user
- `GET /api/v1/users/roles` - List all available roles
- `PUT /api/v1/users/:id/role` - Assign role to user

### Permission Management
- `GET /api/v1/modules` - List all system modules
- `GET /api/v1/permissions` - Get role-module permissions
- `POST /api/v1/permissions` - Save permission mappings

## Troubleshooting

### Common Issues
1. **Access Denied**: Check user role and permissions in `atpPermissions.js`
2. **Login Failed**: Verify endpoint `/api/v1/auth/login` and credentials
3. **Module Not Showing**: Check `usePermissions` hook implementation
4. **API 404**: Ensure backend server running on port 3011

### Debug Commands
```bash
# Test login API
curl -X POST http://localhost:3011/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@apms.com", "password": "Admin123!"}'

# Test all logins
cd backend && node test-all-logins.js
```

## Deployment Notes

### Environment Variables
- `NODE_ENV=production` for production build
- Backend API URL configured in `frontend/src/utils/apiClient.ts`

### Production URLs
- Frontend: TBD
- Backend: https://apms.datacodesolution.com

### Build Commands
```bash
# Frontend build
cd frontend && npm run build

# Backend (already production ready)
cd backend && node server.js
```

## Next Steps for New Features

1. **Add New Role**: Update `atpPermissions.js`, `server.js`, and role definitions
2. **Add New Module**: Create component, add to `App.tsx` modules array, and update permission mappings
3. **Add New API**: Create route file and register in `server.js`
4. **Add New Permission**: Update permission definitions, UI checks, and permission mapping matrix
5. **Add New User**: Use User Management interface or API endpoints
6. **Modify Role Permissions**: Use Permission Mapping interface to assign module access

## System Status: ✅ PRODUCTION READY