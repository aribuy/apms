# APMS (ATP Process Management System)

## Overview
Complete ATP (Acceptance Test Procedure) workflow management system with multi-stage approval process, task management, and document upload capabilities.

## Recent Updates (Latest)

### Task Management Enhancement
- **Table Format**: Converted from card-based to table format with pagination and search
- **ATP Type Separation**: Tasks now separated by Software/Hardware types
  - Sites with `atp_type='SOFTWARE'` → 1 Software task
  - Sites with `atp_type='HARDWARE'` → 1 Hardware task  
  - Sites with `atp_type='BOTH'` → 2 tasks (Software + Hardware)
- **Individual Upload Modal**: Click "Perform" opens modal with:
  - Task details (code, site, ATP type)
  - Document upload functionality
  - Preview of existing uploaded documents
  - Complete task button after upload
- **Bulk Upload**: Upload multiple ATP documents at once
- **Auto Task Generation**: Sites with `atp_required=true` automatically generate tasks

### Database Schema
- **Sites Table**: Enhanced with ATP columns (`atp_required`, `atp_type`, `workflow_stage`)
- **Tasks Table**: Separate tasks for Software and Hardware ATP types
- **Auto Triggers**: Automatic task generation when sites uploaded

## Features

### 1. Site Management
- Bulk site upload via CSV/Excel
- ATP configuration per site (Software/Hardware/Both)
- Workflow stage tracking
- 23-column CSV template support

### 2. Task Management
- **Pending Tasks**: Shows tasks with `status='pending'`
- **All Tasks**: Shows all ATP-related tasks
- **Table Format**: 
  - Task Code, Task Name, ATP Type, Site ID, Site Name
  - Priority, Status, Created Date, Actions
- **Search & Pagination**: 10 items per page with search functionality
- **Individual Actions**: Perform button opens upload modal

### 3. ATP Workflow Engine
- **Multi-stage Approval**: Role-based workflow stages
- **Workflow Types**:
  - SOFTWARE: BO → SME → HEAD_NOC
  - HARDWARE: FOP_RTS → REGION_TEAM → RTH
  - BOTH: Combined 5-stage flow
- **Document Management**: Upload, review, approve ATP documents
- **Punchlist Management**: Track and resolve issues

### 4. Document Upload
- **Individual Upload**: Per-task document upload with modal
- **Bulk Upload**: Multiple documents at once
- **Format Support**: PDF, DOC, DOCX (25MB limit)
- **Auto-complete**: Tasks auto-complete after document upload
- **Preview**: Show existing uploaded documents

## API Endpoints

### Sites
- `GET /api/v1/sites` - Get all sites with ATP filtering
- `POST /api/v1/sites/bulk-upload` - Bulk upload sites
- `GET /api/v1/sites/template` - Download CSV template

### Tasks  
- `GET /api/v1/tasks` - Get all tasks with filtering
- `GET /api/v1/tasks?status=pending` - Get pending tasks
- `PUT /api/v1/tasks/:id` - Update task status

### ATP Documents
- `POST /api/v1/atp/upload` - Upload individual ATP document
- `POST /api/v1/atp/bulk-upload` - Bulk upload ATP documents
- `GET /api/v1/atp/document/:taskCode` - Check existing document

### ATP Workflow
- `POST /api/v1/atp/workflow/initialize` - Initialize ATP workflow
- `POST /api/v1/atp/workflow/review` - Submit review decision
- `GET /api/v1/atp/workflow/stats` - Get workflow statistics

## Database Structure

### Sites Table
```sql
- id (UUID, PK)
- site_id (VARCHAR, unique)
- site_name (VARCHAR)
- scope (VARCHAR) - MW/NE/FE
- region, city (VARCHAR)
- atp_required (BOOLEAN)
- atp_type (VARCHAR) - SOFTWARE/HARDWARE/BOTH
- workflow_stage (VARCHAR) - REGISTERED/ATP_PENDING/ATP_SUBMITTED
- status (VARCHAR) - ACTIVE/INACTIVE
```

### Tasks Table
```sql
- id (UUID, PK)
- task_code (VARCHAR) - TSK-{SITE_ID}-{NUM}
- task_type (VARCHAR) - ATP_SOFTWARE/ATP_HARDWARE
- title, description (VARCHAR)
- status (VARCHAR) - pending/in_progress/completed
- priority (VARCHAR) - high/normal/low
- site_id (UUID, FK to sites)
- result_data (JSONB) - document info
```

## Installation & Setup

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- npm/yarn

### Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Configure DATABASE_URL in .env
npm run migrate
npm start
```

### Frontend Setup
```bash
cd frontend
npm install
npm start
```

### Database Migration
```bash
# Run migrations
psql -h localhost -U endik -d apms_local -f migrations/013_redesign_sites_atp.sql
psql -h localhost -U endik -d apms_local -f migrations/014_auto_task_generation.sql
```

## Usage

### 1. Upload Sites
1. Go to Site Management
2. Download CSV template
3. Fill site data with ATP configuration
4. Upload CSV file
5. Tasks automatically generated for sites with `atp_required=true`

### 2. Manage Tasks
1. Go to Task Management → Pending Tasks
2. View tasks separated by Software/Hardware
3. Click "Perform" to upload ATP document
4. Modal shows task details and upload interface
5. Upload document and complete task

### 3. Bulk Document Upload
1. In Task Management, click "Upload Documents"
2. Select multiple PDF/Word files
3. Files auto-matched to tasks by filename pattern
4. Tasks auto-completed after successful upload

## File Structure
```
/backend
  /src/routes
    - siteRoutes.js (Site management)
    - taskRoutes.js (Task CRUD)
    - atpUploadRoutes.js (Individual upload)
    - atpBulkUploadRoutes.js (Bulk upload)
    - atpWorkflowRoutes.js (Workflow engine)
  /migrations
    - 013_redesign_sites_atp.sql
    - 014_auto_task_generation.sql

/frontend
  /src/components
    - SiteManagement/ (Site upload & management)
    - TaskManagement/ (Task list & upload modal)
      - TaskList.tsx (Main task table)
```

## Key Improvements
1. **Scalable Task Management**: Table format handles large datasets
2. **Separated ATP Types**: Clear distinction between Software/Hardware
3. **Individual Upload Modal**: Better UX for per-task document upload
4. **Auto Task Generation**: Streamlined workflow from site upload to task creation
5. **Document Preview**: Shows existing uploads to prevent duplicates
6. **Bulk Operations**: Efficient handling of multiple documents

## Next Steps
- Implement ATP workflow approval stages
- Add document versioning
- Enhance search and filtering
- Add task assignment and notifications
- Implement SLA tracking and alerts