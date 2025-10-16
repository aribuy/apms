# TeleCore APMS - Current Codebase Inventory

## Backend Structure

### Core Files
```
backend/
├── server.js                          # Main server entry point
├── .env                               # Environment configuration
├── package.json                       # Dependencies and scripts
└── src/routes/                        # API route handlers
    ├── atpRoutes.js                   # ATP management endpoints
    ├── siteRoutes.js                  # Site management endpoints
    ├── userRoutes.js                  # User management endpoints
    ├── organizationRoutes.js          # Organization management
    ├── workgroupRoutes.js             # Workgroup management
    ├── documentRoutes.js              # EATP Digital Document Management ✨
    └── taskRoutes.js                  # Task management
```

### Database
```
backend/
├── prisma/
│   ├── schema.prisma                  # Database schema definition
│   └── migrations/                    # Database migration files
└── migrations/                        # SQL migration scripts
    ├── 001_user_management_core.sql   # User system setup
    ├── 002_load_geography.sql         # Geographic data
    ├── 003_load_organizations.sql     # Organization data
    ├── 004_load_workgroups.sql        # Workgroup data
    └── 005_create_sites_table.sql     # Site management table
```

### Test & Seed Files
```
backend/
├── seed-atp-test.js                   # ATP test data seeder
├── test-atp-workflow.js               # ATP workflow testing
├── seed-users.js                      # User data seeder
└── test-*.js                          # Various test scripts
```

## Frontend Structure

### Core Application
```
frontend/src/
├── App.tsx                            # Main application component
├── index.tsx                          # React entry point
├── App.css                            # Global styles
└── contexts/
    └── AuthContext.tsx                # Authentication context
```

### Components Structure
```
frontend/src/components/
├── auth/
│   ├── LoginPage.tsx                  # Login interface
│   └── ProtectedRoute.tsx             # Route protection
├── ATPManagement/
│   ├── index.tsx                      # Main ATP interface
│   ├── ATPSubmission.tsx              # ATP submission form
│   ├── ATPReview.tsx                  # Review interface
│   ├── ATPList.tsx                    # ATP listing
│   └── PunchlistManagement.tsx       # Punchlist handling
├── SiteManagement/
│   ├── index.tsx                      # Main site interface
│   ├── SingleSiteRegistration.tsx    # Site registration wizard
│   └── BulkUpload.tsx                 # Bulk upload interface
├── UserManagement/
│   └── UserManagement.tsx             # User management interface
├── OrganizationManagement/
│   └── OrganizationManagement.tsx     # Organization management
├── WorkgroupManagement/
│   └── WorkgroupManagement.tsx        # Workgroup management
├── DocumentManagement/
│   └── DocumentManagement.tsx         # Document workflows
├── ATPManagement/
│   └── DigitalFormBuilder.tsx         # EATP Digital Form Builder ✨
└── TaskManagement.tsx                 # Task management
```

### Configuration Files
```
frontend/
├── package.json                       # Dependencies with proxy config
├── tailwind.config.js                 # Tailwind CSS configuration
├── tsconfig.json                      # TypeScript configuration
└── public/                            # Static assets
```

## Key Implementation Details

### ATP Management System
**File**: `backend/src/routes/atpRoutes.js`
- **Lines**: ~400 lines
- **Key Functions**:
  - `POST /submit` - ATP document submission
  - `POST /:id/review` - Review submission with workflow logic
  - `POST /:id/punchlist` - Punchlist item management
  - `POST /:id/quick-approve` - Quick approval process
- **Workflow Logic**: Hardware (FOP_RTS→Region_Team→RTH) vs Software (BO→SME→HEAD_NOC)
- **Database Integration**: Prisma ORM with PostgreSQL

**File**: `frontend/src/components/ATPManagement/ATPReview.tsx`
- **Lines**: ~300 lines
- **Features**: Multi-stage review interface, role-based access, checklist validation
- **State Management**: React hooks with form validation

### Site Management System
**File**: `backend/src/routes/siteRoutes.js`
- **Lines**: ~250 lines
- **Key Functions**:
  - `POST /register` - Single site registration
  - `GET /check-siteid/:id` - Site ID availability check
  - `GET /suggest-siteid` - Auto-suggestion algorithm
  - `GET /template` - CSV template generation
  - `POST /bulk-upload` - Bulk upload processing
  - `POST /api/register` - External API integration
- **File Handling**: Multer for uploads, CSV/Excel processing

**File**: `frontend/src/components/SiteManagement/SingleSiteRegistration.tsx`
- **Lines**: ~400 lines
- **Features**: 4-step wizard, real-time validation, coordinate validation
- **UX**: Progress indicator, step-by-step navigation

### Authentication System
**File**: `frontend/src/contexts/AuthContext.tsx`
- **Current**: Basic authentication with mock credentials
- **Features**: Login/logout, role-based access, protected routes
- **Limitation**: No JWT implementation, basic session management

### Database Schema (Key Tables)
```sql
-- EATP Digital Document System ✨
atp_document_templates: id, template_code, template_name, category, form_schema, checklist_items
atp_document_attachments: id, atp_id, file_name, file_path, file_type, uploaded_at

-- ATP System (Enhanced)
atp_documents: id, document_number, site_id, type, status, form_data, template_id, is_digital
atp_review_stages: id, atp_id, stage, reviewer_role, status, comments, reviewed_at
atp_punchlist_items: id, atp_id, stage, description, status, assigned_to, created_at

-- Site Management  
sites: id, site_id, site_name, site_type, region, province, city, district,
       address, latitude, longitude, altitude, tower_height, power_type,
       backup_power, fiber_connection, microwave_connection,
       contact_person, contact_phone, contact_email, status, created_at

-- User Management
users: id, username, email, password_hash, role, organization_id, created_at
organizations: id, name, type, created_at
workgroups: id, name, organization_id, created_at
```

## Code Quality & Patterns

### Backend Patterns
- **Router-based architecture** with Express.js
- **Prisma ORM** for database operations
- **Error handling** with try-catch blocks
- **Validation** at API level
- **CORS enabled** for frontend integration

### Frontend Patterns
- **Functional components** with React hooks
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **Context API** for state management
- **Responsive design** with mobile-first approach

### Current Technical Debt
1. **Authentication**: Basic implementation, needs JWT
2. **Error Handling**: Inconsistent across components
3. **Validation**: Mix of client/server-side validation
4. **File Upload**: Basic implementation, needs enhancement
5. **Real-time Features**: No WebSocket implementation
6. **Testing**: Limited test coverage
7. **Documentation**: Inline comments minimal

## Dependencies

### Backend Dependencies
```json
{
  "express": "^4.x",
  "prisma": "^5.x", 
  "@prisma/client": "^5.x",
  "cors": "^2.x",
  "helmet": "^7.x",
  "morgan": "^1.x",
  "multer": "^1.x",
  "xlsx": "^0.x",
  "dotenv": "^16.x"
}
```

### Frontend Dependencies
```json
{
  "react": "^19.x",
  "react-dom": "^19.x",
  "react-router-dom": "^6.x",
  "typescript": "^4.x",
  "tailwindcss": "^3.x",
  "lucide-react": "^0.x",
  "axios": "^1.x"
}
```

## Performance Considerations
- **Database**: Indexed on key fields (site_id, atp_id)
- **Frontend**: Component-based lazy loading potential
- **API**: RESTful design with efficient queries
- **File Upload**: Stream processing for large files

## Security Implementation
- **Helmet.js** for security headers
- **CORS** configuration
- **Input validation** on API endpoints
- **SQL injection protection** via Prisma ORM
- **XSS protection** via React's built-in escaping

## Deployment Configuration
- **Backend**: Node.js server on port 3011
- **Frontend**: React dev server on port 3000 with proxy
- **Database**: PostgreSQL with Prisma migrations
- **Environment**: Development setup with .env files

This inventory provides a complete picture of the current codebase for EATP development planning.