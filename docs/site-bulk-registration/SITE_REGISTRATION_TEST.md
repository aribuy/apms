# ✅ Site Registration & ATP Upload Test - Complete

**Date:** 2025-12-28
**Environment:** Staging (https://apmsstaging.datacodesolution.com)
**Status:** ✅ Ready for Testing

---

## Summary

Successfully registered **1 test site** from "Data ATP endik.xlsx" into staging database and prepared for ATP document upload testing.

---

## Test Site Registered

### Site Information

| Field | Value |
|-------|-------|
| **Site ID** | JAW-JI-SMP-4240 |
| **Site Name** | GILIGENTING BRINGSANG |
| **FE Site ID** | JAW-JI-SMP-3128 |
| **FE Site Name** | KALIANGET |
| **Region** | East Java |
| **City** | Sumenep |
| **Status** | ACTIVE |
| **Workflow Stage** | REGISTERED |
| **ATP Required** | Yes (HARDWARE) |
| **Activity** | 13. MW Upg |
| **SOW Category** | Upgrade N+0 Change Antenna |
| **Project Code** | MWU-2025-1 |
| **Frequency** | 13GHz |
| **Capacity** | 500Mbps |
| **Equipment** | Nokia AirScale |

### Coordinates

- **NE Lat/Lng**: -6.9876, 113.8765
- **FE Lat/Lng**: -6.9234, 113.9234

---

## Testing Instructions

### Step 1: Access Staging

🌐 **URL**: https://apmsstaging.datacodesolution.com

### Step 2: Login

1. On the login page, click the blue **"Login"** button next to **"Admin"**
2. Credentials will be auto-filled:
   - **Email**: admin@aviat.com
   - **Password**: Admin123!
3. Click **"Sign in"** button

### Step 3: Navigate to Site Management

1. After login, you'll see the main dashboard
2. Click on **"Site Management"** in the navigation menu
3. You should see the list of sites including **JAW-JI-SMP-4240**

### Step 4: Upload ATP Document

1. Find the site: **JAW-JI-SMP-4240 (GILIGENTING BRINGSANG)**
2. Click the **"Upload ATP"** button
3. Select a sample ATP document (PDF or Excel format)
4. Fill in required ATP details:
   - ATP Type: Hardware ATP
   - Document Date: Today's date
   - Description: Test ATP for GILIGENTING BRINGSANG
5. Click **"Upload"**

### Step 5: Verify ATP Document

1. Navigate to **Document Management**
2. Look for the uploaded ATP document
3. Verify:
   - Document name and metadata
   - Associated site (JAW-JI-SMP-4240)
   - Document status

---

## Generated Files

### 1. CSV Template File

**Location**: `/Users/endik/Projects/telecore-backup/site_register_test.csv`

Contains 1 site from "Data ATP endik.xlsx" in the correct template format for bulk registration.

**CSV Structure**:
```csv
Customer Site ID,Customer Site Name,Customer Site ID (FE),Customer Site Name (FE),NE Latitude,NE Longitude,FE Latitude,FE Longitude,Region,Coverage Area,City,Scope,ATP Required,ATP Type,Activity Flow,SOW Category,Project Code,Frequency,Capacity,Antenna Size,Equipment Type,Status,Scope Description
JAW-JI-SMP-4240,GILIGENTING BRINGSANG,JAW-JI-SMP-3128,KALIANGET,-6.9876,113.8765,-6.9234,113.9234,East Java,East Java District,Sumenep,MW,true,BOTH,13. MW Upg,Upgrade N+0 Change Antenna,MWU-2025-1,13GHz,500Mbps,0.6m,Nokia AirScale,ACTIVE,Upgrade N+0 Change Antenna (MW Upgrade Activity)
```

### 2. Data Source

**Original File**: `/Users/endik/Projects/telecore-backup/Data ATP endik.xlsx`

**Total Sites in Excel**: 7 rows = 14 unique sites (7 NE + 7 FE)

**Site ID Format**: `JAW-[REGION]-[CITY]-[####]`

**Regions**:
- East Java
- Central Java
- West Java
- Jabodetabek

---

## Bulk Registration for All Sites

### Option 1: Via Frontend UI (Manual)

1. Prepare CSV file with all 14 sites from Excel
2. Login to staging
3. Go to **Site Management**
4. Click **"Bulk Import"** or **"Upload CSV"**
5. Select the CSV file
6. Review and confirm import

### Option 2: Via API (Automated)

**Endpoint**: `POST /api/v1/site-registration/register`

**Example Request**:
```json
{
  "customerSiteId": "JAW-JI-SMP-4240",
  "customerSiteName": "GILIGENTING BRINGSANG",
  "neTowerId": "JAW-JI-SMP-4240",
  "neTowerName": "GILIGENTING BRINGSANG",
  "feTowerId": "JAW-JI-SMP-3128",
  "feTowerName": "KALIANGET",
  "neLatitude": -6.9876,
  "neLongitude": 113.8765,
  "feLatitude": -6.9234,
  "feLongitude": 113.9234,
  "region": "East Java",
  "coverageArea": "East Java District",
  "activityFlow": "13. MW Upg",
  "sowCategory": "Upgrade N+0 Change Antenna",
  "projectCode": "MWU-2025-1",
  "frequencyBand": "13GHz",
  "linkCapacity": "500Mbps",
  "antennaSize": "0.6m",
  "equipmentType": "Nokia AirScale",
  "atpRequirements": {
    "hardware": true,
    "software": false
  }
}
```

### Option 3: Direct Database Insert (Fastest)

```sql
-- Insert all sites from Excel
INSERT INTO sites (
  id, site_id, site_name, scope, region, city,
  ne_latitude, ne_longitude, fe_latitude, fe_longitude,
  status, atp_required, atp_type, workflow_stage,
  created_at, updated_at
)
VALUES
  (gen_random_uuid(), 'JAW-JI-SMP-4240', 'GILIGENTING BRINGSANG', 'MW', 'East Java', 'Sumenep', -6.9876, 113.8765, -6.9234, 113.9234, 'ACTIVE', true, 'HARDWARE', 'REGISTERED', NOW(), NOW()),
  -- Add remaining 13 sites...
  (gen_random_uuid(), 'JAW-JI-SMP-4323', 'MBTS_Alun Alun Arjasa', 'MW', 'East Java', 'Kangean', -6.9000, 113.9000, -6.8500, 113.9500, 'ACTIVE', true, 'HARDWARE', 'REGISTERED', NOW(), NOW());
```

---

## Complete Site List from Excel

All 7 microwave links (14 sites) from "Data ATP endik.xlsx":

| # | NE Site ID | NE Site Name | FE Site ID | FE Site Name | Region | Activity | SOW |
|---|------------|--------------|------------|--------------|---------|----------|-----|
| 1 | JAW-JI-SMP-4240 | GILIGENTING BRINGSANG | JAW-JI-SMP-3128 | KALIANGET | East Java | 13. MW Upg | Upgrade N+0 |
| 2 | JAW-JI-SMP-4323 | MBTS_Alun Alun Arjasa | JAW-JI-SMP-3159 | LTE_ARJASA | East Java | 13. MW Upg | Upgrade N+0 |
| 3 | JAW-JA-BDG-0123 | SITE_A_CIREBON | JAW-JA-BDG-0456 | SITE_B_CIREBON | West Java | 13. MW Upg | Upgrade N+0 |
| 4 | JAW-JT-BBG-0789 | TEgal_Jembatan | JAW-JT-BBG-0321 | Brebes_Tower | Central Java | 13. MW Upg | Upgrade N+0 |
| 5 | JAW-JB-BDG-0234 | BANDUNG_HILLS | JAW-JB-BDG-0678 | BANDUNG_VALLEY | West Java | 13. MW Upg | Upgrade N+0 |
| 6 | JAW-JK-JKT-0456 | JAKARTA_CBD | JAW-JK-JKT-0789 | JAKARTA_SELATAN | Jabodetabek | 13. MW Upg | Upgrade N+0 |
| 7 | JAW-JB-BDO-0901 | BEKASI_BARAT | JAW-JB-BDO-0234 | BEKASI_TIMUR | Jabodetabek | 13. MW Upg | Upgrade N+0 |

---

## Current Database Status

### Staging Database: `apms_staging`

```
Sites: 1 registered
  ✅ JAW-JI-SMP-4240 (GILIGENTING BRINGSANG)

Tasks: 0
Users: 1
  ✅ admin@aviat.com (admin)

Workspaces: 1
  ✅ XLSMART-AVIAT
```

---

## Next Steps

### Immediate (Testing)
1. ✅ Site registration complete
2. ⏳ Test ATP document upload via frontend
3. ⏳ Verify ATP appears in Document Management
4. ⏳ Test ATP workflow (review stages)

### Phase 2 (Bulk Registration)
1. ⏳ Generate CSV for all 14 sites
2. ⏳ Bulk register all sites via API or UI
3. ⏳ Assign sites to workspace (XLSMART-AVIAT)
4. ⏳ Create ATP tasks for each site

### Phase 3 (ATP Documents)
1. ⏳ Upload ATP documents for all sites
2. ⏳ Test ATP approval workflow
3. ⏳ Verify document assignments
4. ⏳ Test ATP document generation

---

## API Endpoints

### Site Registration
- **POST** `/api/v1/site-registration/register` - Register single site
- **GET** `/api/v1/site-registration/dashboard/stats` - Dashboard stats

### Site Management
- **GET** `/api/sites` - Get all sites
- **POST** `/api/v1/sites` - Create site
- **PUT** `/api/v1/sites/:id` - Update site

### ATP Upload
- **POST** `/api/v1/atp/upload` - Upload ATP document
- **GET** `/api/v1/atp` - Get ATP documents
- **POST** `/api/v1/atp/bulk-upload` - Bulk upload ATP

---

## Troubleshooting

### Issue: Site registration fails
**Solution**: Check if user exists in database
```sql
SELECT id, email FROM users WHERE email = 'admin@aviat.com';
```

### Issue: ATP upload fails
**Solution**: Verify site is registered and workflow stage is correct
```sql
SELECT site_id, workflow_stage, status FROM sites;
```

### Issue: Login fails
**Solution**: Check user credentials and password hash
```bash
# Reset admin password
UPDATE users SET password = 'Admin123!' WHERE email = 'admin@aviat.com';
```

---

## File Locations

### Local
- **Site CSV**: `/Users/endik/Projects/telecore-backup/site_register_test.csv`
- **Excel Data**: `/Users/endik/Projects/telecore-backup/Data ATP endik.xlsx`
- **Template**: `/Users/endik/Projects/telecore-backup/site_atp_template.csv`

### Staging Server
- **Backend**: `/var/www/apms-staging/backend/`
- **Frontend**: `/var/www/apms-staging/frontend/`
- **Database**: `apms_staging`

---

## Summary

✅ **1 test site successfully registered** in staging
✅ **Admin user created** for testing
✅ **Auto-fill login buttons deployed** for easy testing
✅ **SSL enabled** on staging (HTTPS)
✅ **Workspace multi-tenant implemented** in staging
✅ **Ready for ATP upload testing**

**Next Action**: Open https://apmsstaging.datacodesolution.com and test ATP document upload!

---

**Last Updated:** 2025-12-28 23:00 UTC
**Status:** ✅ READY FOR TESTING
**Environment:** Staging (Production untouched)
