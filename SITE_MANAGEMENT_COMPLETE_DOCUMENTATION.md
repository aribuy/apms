# Site Management System - Complete Documentation

## Overview
Complete Site Management system for TeleCore APMS with PostgreSQL database integration, bulk upload capabilities, and full CRUD operations.

## Architecture

### Database Layer
- **Database**: PostgreSQL with Prisma ORM
- **Table**: `sites` with proper indexing and constraints
- **Schema Location**: `backend/prisma/schema.prisma`
- **Migration**: `backend/prisma/migrations/add_sites_table/`

### Backend API
- **Framework**: Express.js with Prisma Client
- **Routes**: `/api/sites` with full REST endpoints
- **File**: `backend/src/routes/sitesRoutes.js`

### Frontend Components
- **Main Component**: `frontend/src/components/SiteManagement/index.tsx`
- **UI Framework**: React with TypeScript
- **Styling**: Tailwind CSS

## Database Schema

```sql
CREATE TABLE "sites" (
    "id" TEXT NOT NULL,
    "site_id" VARCHAR(100) NOT NULL UNIQUE,
    "site_name" VARCHAR(255) NOT NULL,
    "site_type" VARCHAR(50) DEFAULT 'MW',
    "region" VARCHAR(100) NOT NULL,
    "city" VARCHAR(100) NOT NULL,
    "ne_latitude" DECIMAL(10,8),
    "ne_longitude" DECIMAL(11,8),
    "fe_latitude" DECIMAL(10,8),
    "fe_longitude" DECIMAL(11,8),
    "status" VARCHAR(50) DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "sites_pkey" PRIMARY KEY ("id")
);

-- Indexes
CREATE UNIQUE INDEX "sites_site_id_key" ON "sites"("site_id");
CREATE INDEX "sites_region_idx" ON "sites"("region");
CREATE INDEX "sites_status_idx" ON "sites"("status");
```

## API Endpoints

### GET /api/sites
**Description**: Retrieve all sites
**Response**: Array of site objects
```json
[
  {
    "id": "uuid",
    "site_id": "JAW-JI-SMP-4240",
    "site_name": "GILIGENTING_KALIANGET",
    "site_type": "MW",
    "region": "East Java",
    "city": "Sumenep",
    "ne_latitude": -7.1234567,
    "ne_longitude": 112.9876543,
    "fe_latitude": -7.2345678,
    "fe_longitude": 112.8765432,
    "status": "ACTIVE",
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-01T00:00:00.000Z"
  }
]
```

### POST /api/sites/bulk
**Description**: Create multiple sites with duplicate handling
**Request Body**:
```json
{
  "sites": [
    {
      "siteId": "JAW-JI-SMP-4240",
      "siteName": "GILIGENTING_KALIANGET",
      "siteType": "MW",
      "region": "East Java",
      "city": "Sumenep",
      "neLatitude": -7.1234567,
      "neLongitude": 112.9876543,
      "feLatitude": -7.2345678,
      "feLongitude": 112.8765432,
      "status": "ACTIVE"
    }
  ]
}
```

**Response**:
```json
{
  "message": "6 sites created successfully (2 duplicates skipped)",
  "created": 6,
  "total": 8
}
```

**Duplicate Handling**: 
- Uses `skipDuplicates: true` to handle duplicate Site IDs
- Returns count of successfully created sites vs total submitted
- Prevents complete transaction failure due to duplicates

### PUT /api/sites/:id
**Description**: Update existing site
**Request Body**: Site object with updated fields

### DELETE /api/sites/:id
**Description**: Delete site by ID
**Response**: Success message

## Frontend Features

### 1. Site List View
- **Table Display**: Shows all registered sites with pagination
- **Columns**: Site ID, Site Name, Type, Region, City, Status, Created Date, Actions
- **Real-time Counter**: Shows total number of sites
- **Loading State**: Displays loading indicator during API calls

### 2. Add Sites Modal
- **Single Interface**: Unified modal for all site registration methods
- **Bulk Upload**: CSV/Excel file upload with drag & drop
- **Template Download**: Provides sample CSV template
- **File Validation**: Checks file type and size (max 25MB)

### 3. Validation System
- **Real-time Validation**: Processes uploaded files
- **Validation Summary**: Shows counts of valid, warning, and error records
- **Detailed Report**: Downloadable CSV with validation results
- **Error Handling**: GPS coordinate bounds checking, required field validation

### 4. CRUD Operations
- **View Modal**: Read-only site details display
- **Edit Modal**: Editable form for site updates
- **Delete Confirmation**: Confirmation dialog before deletion
- **Real-time Updates**: Immediate UI updates after operations

## File Upload Process

### 1. Template Structure
```csv
Customer Site ID,Customer Site Name,NE Tower ID,NE Name,FE Tower ID,FE Name,NE Latitude,NE Longitude,FE Latitude,FE Longitude,Region,Coverage Area,Activity Flow,SOW Category,Project Code,Frequency,Capacity,Antenna Size,Equipment Type,Task Type,Priority,Due Date,Task Description
JAW-JI-SMP-4240_JAW-JI-SMP-3128_Y25_MWU0-04,GILIGENTING BRINGSANG_KALIANGET,JAW-JI-SMP-4240,GILIGENTING BRINGSANG,JAW-JI-SMP-3128,KALIANGET,-7.1234567,112.9876543,-7.2345678,112.8765432,East Java,Sumenep District,13. MW Upg Upgrade N+0 Change Antenna,Upgrade N+0,Y25_MWU0-04,18GHz,1Gbps,0.6m,Aviat CTR8000,ATP,High Priority,2024-01-15,MW Upgrade with antenna change
```

### 2. Validation Rules
- **GPS Coordinates**: Must be within Indonesia bounds (Lat: -11 to 6, Lng: 95 to 141)
- **Required Fields**: Site ID, Site Name, Region, City
- **Unique Constraints**: Site ID must be unique
- **File Format**: CSV or Excel (.xlsx, .xls)
- **File Size**: Maximum 25MB

### 3. Processing Flow
1. **File Upload** → Drag & drop or file picker
2. **Validation** → Real-time processing with progress indicator
3. **Summary** → Display validation results with counters
4. **Review** → Download detailed validation report
5. **Processing** → Bulk insert valid records to database with duplicate handling
6. **Completion** → Auto-refresh site list and close modal

**Duplicate Handling Process**:
- System automatically skips duplicate Site IDs
- Shows clear message: "X sites created successfully (Y duplicates skipped)"
- Prevents complete failure due to duplicate entries
- Maintains data integrity with existing records

## State Management

### Frontend State
```typescript
interface Site {
  id: number;
  site_id: string;
  site_name: string;
  site_type: string;
  region: string;
  city: string;
  status: string;
  created_at: string;
}

// Component State
const [sites, setSites] = useState<Site[]>([]);
const [loading, setLoading] = useState(false);
const [showModal, setShowModal] = useState(false);
const [showSiteModal, setShowSiteModal] = useState(false);
const [modalType, setModalType] = useState<'view' | 'edit'>('view');
const [selectedSite, setSelectedSite] = useState<any>(null);
```

### Data Flow
1. **Component Mount** → `fetchSites()` → API call → Update state
2. **Bulk Upload** → `processSites()` → API call → `fetchSites()` → Update state
3. **CRUD Operations** → API calls → Local state updates → Optimistic UI

## Error Handling

### Backend Error Handling
```javascript
try {
  const sites = await prisma.sites.findMany();
  res.json(sites);
} catch (error) {
  console.error('Error fetching sites:', error);
  res.status(500).json({ error: 'Failed to fetch sites' });
}
```

### Frontend Error Handling
```typescript
try {
  const response = await fetch('/api/sites');
  const data = await response.json();
  setSites(Array.isArray(data) ? data : []);
} catch (error) {
  console.error('Error fetching sites:', error);
  setSites([]);
}
```

## Security Considerations

### Input Validation
- **SQL Injection Prevention**: Prisma ORM with parameterized queries
- **File Upload Security**: File type and size validation
- **Data Sanitization**: Input validation on both frontend and backend

### Access Control
- **Authentication**: Integrated with TeleCore APMS auth system
- **Authorization**: Role-based access control (RBAC)
- **API Security**: Express middleware for request validation

## Performance Optimizations

### Database Optimizations
- **Indexing**: Strategic indexes on frequently queried columns
- **Connection Pooling**: Prisma connection management
- **Query Optimization**: Efficient SELECT queries with ordering

### Frontend Optimizations
- **Lazy Loading**: Components loaded on demand
- **State Management**: Efficient React state updates
- **API Caching**: Browser caching for static data

## Deployment Configuration

### Environment Variables
```env
DATABASE_URL="postgresql://username:password@localhost:5432/apms_local"
PORT=3011
```

### Database Migration
```bash
# Run migrations
npx prisma migrate dev --name add-sites-table

# Generate Prisma client
npx prisma generate

# Seed initial data (optional)
npx prisma db seed
```

### Production Deployment
1. **Database Setup**: PostgreSQL instance with proper configuration
2. **Environment Config**: Production environment variables
3. **Migration**: Run database migrations
4. **Build**: Frontend build process
5. **Server**: Start backend server with PM2 or similar

## Monitoring & Logging

### Backend Logging
- **API Requests**: Morgan middleware for HTTP logging
- **Database Operations**: Prisma query logging
- **Error Tracking**: Comprehensive error logging

### Frontend Monitoring
- **API Calls**: Console logging for development
- **User Actions**: Action tracking for analytics
- **Error Boundaries**: React error boundaries for crash prevention

## Testing Strategy

### Backend Testing
```javascript
// API endpoint testing
describe('Sites API', () => {
  test('GET /api/sites returns sites array', async () => {
    const response = await request(app).get('/api/sites');
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });
});
```

### Frontend Testing
```typescript
// Component testing
describe('SiteManagement', () => {
  test('renders site list correctly', () => {
    render(<SiteManagement />);
    expect(screen.getByText('Registered Sites')).toBeInTheDocument();
  });
});
```

## Backup & Recovery

### Database Backup
```bash
# PostgreSQL backup
pg_dump -h localhost -U username -d apms_local > backup.sql

# Restore
psql -h localhost -U username -d apms_local < backup.sql
```

### Data Export
- **CSV Export**: Built-in functionality for data export
- **API Export**: Programmatic data access via REST API
- **Bulk Operations**: Mass data operations support

## Future Enhancements

### Planned Features
1. **Advanced Filtering**: Multi-column filtering and search
2. **Bulk Operations**: Mass update/delete operations
3. **Data Visualization**: Charts and maps integration
4. **Audit Trail**: Complete change history tracking
5. **Integration**: Connection with external systems
6. **Mobile Support**: Responsive design improvements

### Technical Improvements
1. **Caching Layer**: Redis integration for performance
2. **Real-time Updates**: WebSocket for live data updates
3. **Advanced Validation**: More sophisticated business rules
4. **API Versioning**: Backward compatibility support
5. **Microservices**: Service decomposition for scalability

## Troubleshooting Guide

### Common Issues

#### Sites Not Loading
1. Check backend server status
2. Verify database connection
3. Check Prisma client initialization
4. Review API endpoint configuration

#### Upload Failures
1. Verify file format (CSV/Excel)
2. Check file size (max 25MB)
3. Validate data format
4. Review server logs for errors

#### Partial Site Creation (Less Sites Created Than Expected)
1. **Duplicate Site IDs**: Check for duplicate Site IDs in upload file
2. **Database Constraints**: Verify unique constraints on site_id field
3. **Validation Errors**: Review validation report for failed records
4. **Check Response Message**: Look for "X duplicates skipped" in success message
5. **Server Logs**: Check backend logs for detailed error information

#### Database Connection Issues
1. Verify DATABASE_URL environment variable
2. Check PostgreSQL server status
3. Validate database credentials
4. Test network connectivity

### Debug Commands
```bash
# Check database connection
npx prisma db pull

# View database data
npx prisma studio

# Reset database
npx prisma migrate reset

# Generate new migration
npx prisma migrate dev --name migration_name
```

## Support & Maintenance

### Regular Maintenance
- **Database Cleanup**: Remove old/unused records
- **Index Optimization**: Monitor and optimize database indexes
- **Log Rotation**: Manage application logs
- **Security Updates**: Keep dependencies updated

### Support Contacts
- **Technical Issues**: Development team
- **Database Issues**: Database administrator
- **Business Logic**: Product owner
- **Infrastructure**: DevOps team

## Recent Updates

### Version 2.2.0 - December 19, 2024
**Enhanced Duplicate Validation System**
- Implemented pre-processing duplicate detection with user options
- Added `/api/sites/check-duplicates` endpoint for validation
- Added `/api/sites/update-bulk` endpoint for modifying existing sites
- Enhanced UI with duplicate warning and action options
- Improved notification messages with accurate counts

**New Features:**
- ⚠️ **Duplicate Detection Warning**: Shows list of conflicting sites before processing
- 🔄 **Modify Existing Sites**: Update existing sites with new data
- ⏭️ **Skip Duplicates**: Add only new sites, skip existing ones
- 🚫 **Cancel Upload**: Cancel operation if duplicates detected
- 📊 **Accurate Notifications**: "X sites created successfully (Y duplicates skipped)"

**Enhanced User Experience:**
- Clear duplicate warning with site list
- Three action options for handling duplicates
- Accurate feedback messages
- Seamless workflow for duplicate handling

**Testing Results:**
- ✅ Duplicate detection working perfectly
- ✅ Skip duplicates: "0 sites registered successfully! (8 duplicates skipped)"
- ✅ Modify existing sites functionality implemented
- ✅ Enhanced UI with warning and options working
- ✅ All notification messages accurate

### Version 2.1.0 - December 2024
**Bug Fix: Duplicate Site ID Handling**
- Fixed bulk upload failure when duplicate Site IDs present
- Added `skipDuplicates: true` to bulk insert operation
- Enhanced response messages to show created vs skipped counts
- Improved error handling and logging for troubleshooting

**Documentation Updates Made:**
- Updated API endpoint documentation for `/api/sites/bulk` response format
- Added duplicate handling explanation in processing flow section
- Enhanced troubleshooting section with "Partial Site Creation" guidance
- Included example responses with skip counts
- Added step-by-step debugging for duplicate issues
- Updated server log checking guidance

**Testing Results:**
- ✅ Successfully tested bulk upload of 8 sites
- ✅ Database correctly shows 9 total sites (1 existing + 8 new)
- ✅ All sites properly inserted with unique Site IDs
- ✅ Frontend and database fully synchronized
- ✅ Site Management system working perfectly

**Test Data Used:**
- JKTB001 (PANYAKALAN), JKTB002 (KEMAYORAN), SUMRI001 (MEDAN PLAZA)
- JKTB003 (SENAYAN), JKTB004 (THAMRIN), BDGB001 (BANDUNG PLAZA)
- SBYB001 (SURABAYA CENTER), YGYA001 (YOGYA MALIOBORO)

**Impact**: 
- ✅ Resolves issue where only partial sites were created from bulk upload
- ✅ Prevents complete transaction failure due to duplicate entries
- ✅ Provides clear feedback on duplicate handling
- ✅ Complete documentation coverage for troubleshooting similar issues
- ✅ **CONFIRMED WORKING** - Production ready for ATP process flow

---

**Last Updated**: December 19, 2024
**Version**: 2.2.0
**Status**: Production Ready - Enhanced Duplicate Validation System
**Test Status**: ✅ PASSED - Enhanced duplicate detection with user options working perfectly