# TeleCore APMS Project Info

## Database Schema (User)
- id, email, username, name, contactNumber, userType, status

## API Endpoints
- GET /api/v1/users
- POST /api/v1/users/create  
- PUT /api/v1/users/update/:id
- DELETE /api/v1/users/delete/:id
- GET /api/v1/organizations/list
- GET /api/v1/workgroups/list

## Known Issues & Solutions
1. Blank page → Field mismatch → Check UserList.tsx interfaces
2. API crash → Check pm2 logs → Fix userRoutes.js
3. Build error → TypeScript interface mismatch

## Component Locations
/frontend/src/components/
├── UserManagement/
│   ├── UserList.tsx (User interface + FormData interface)
│   └── ErrorBoundary.tsx
├── OrganizationManagement/
└── WorkgroupManagement/
