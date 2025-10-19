# Site Management - Detailed User Journey

## 🎯 **Overview**
Complete user journey for Site Management system in TeleCore APMS, covering all scenarios from login to site registration with enhanced duplicate validation.

## 👤 **User Profile**
- **Role**: Document Control (doc.control@aviat.com)
- **Permissions**: Site Management, ATP Process Control
- **Objective**: Register sites for ATP process flow approval

---

## 🚀 **User Journey Flow**

### **Step 1: System Access**
```
Login Page → Enter Credentials → Dashboard
```

**User Actions:**
1. Navigate to `http://localhost:3000/login`
2. Enter email: `doc.control@aviat.com`
3. Enter password: `test123`
4. Click "Login"

**System Response:**
- Authentication successful
- Redirect to Dashboard
- Show user info: "doc.control" with "DOC_CONTROL" role

---

### **Step 2: Navigate to Site Management**
```
Dashboard → Site Management Module
```

**User Actions:**
1. From Dashboard, click "Site Management" module card
2. Or use sidebar navigation

**System Response:**
- Display Site Management interface
- Show current registered sites count
- Display sites table with existing data

**Current State Display:**
```
Site Management
Registered Sites (9 total)
[Add Sites Button]

Site ID     | Site Name           | Type | Region      | City       | Status | Created    | Actions
------------|--------------------|----- |-------------|------------|--------|------------|----------
YGYA001     | YOGYA MALIOBORO    | MW   | Central Java| Yogyakarta | ACTIVE | 10/19/2025 | 👁️ ✏️ 🗑️
JKTB001     | PANYAKALAN         | MW   | Jakarta     | Jakarta    | ACTIVE | 10/19/2025 | 👁️ ✏️ 🗑️
...         | ...                | ...  | ...         | ...        | ...    | ...        | ...
```

---

### **Step 3: Initiate Site Upload**
```
Site Management → Add Sites Modal
```

**User Actions:**
1. Click "Add Sites" button

**System Response:**
- Open "Add Sites" modal
- Display upload interface with options

**Modal Interface:**
```
Add Sites
─────────────────────────────────────────

Upload Sites
Upload CSV/Excel file with one or multiple sites

[Download Template] 

┌─────────────────────────────────────────┐
│  📤 Drag & Drop Registration File Here  │
│           or Click to Browse            │
│                                         │
│           [Choose File]                 │
└─────────────────────────────────────────┘
```

---

### **Step 4: Download Template (Optional)**
```
Add Sites Modal → Download Template
```

**User Actions:**
1. Click "Download Template" button

**System Response:**
- Generate CSV template file
- Auto-download: `site_registration_template.csv`
- Template includes sample data and proper headers

**Template Structure:**
```csv
Customer Site ID,Customer Site Name,NE Tower ID,NE Name,FE Tower ID,FE Name,NE Latitude,NE Longitude,FE Latitude,FE Longitude,Region,Coverage Area,Activity Flow,SOW Category,Project Code,Frequency,Capacity,Antenna Size,Equipment Type,Task Type,Priority,Due Date,Task Description
JAW-JI-SMP-4240_JAW-JI-SMP-3128_Y25_MWU0-04,GILIGENTING BRINGSANG_KALIANGET,JAW-JI-SMP-4240,GILIGENTING BRINGSANG,JAW-JI-SMP-3128,KALIANGET,-7.1234567,112.9876543,-7.2345678,112.8765432,East Java,Sumenep District,13. MW Upg Upgrade N+0 Change Antenna,Upgrade N+0,Y25_MWU0-04,18GHz,1Gbps,0.6m,Aviat CTR8000,ATP,High Priority,2024-01-15,MW Upgrade with antenna change
```

---

### **Step 5: File Upload**
```
Add Sites Modal → File Selection → Upload
```

**User Actions:**
1. **Option A**: Drag & drop CSV/Excel file to upload area
2. **Option B**: Click "Choose File" and select file from computer

**System Response:**
- Validate file type (CSV, .xlsx, .xls only)
- Check file size (max 25MB)
- Display upload confirmation

**Upload Confirmation:**
```
✅ File uploaded: site_template.csv
```

---

### **Step 6: File Validation Process**
```
File Upload → Automatic Validation → Results Display
```

**System Process:**
1. **File Processing**: Parse CSV/Excel data
2. **Data Validation**: Check required fields, GPS coordinates, formats
3. **Duplicate Detection**: Check against existing database
4. **Results Compilation**: Generate validation summary

**Validation Display:**
```
✅ Validation Complete!

┌─────────────┬─────────────┬─────────────┐
│      8      │      1      │      1      │
│ Valid Records│  Warnings   │   Errors    │
└─────────────┴─────────────┴─────────────┘
```

---

### **Step 7A: No Duplicates Scenario**
```
Validation Complete → Process Sites (Clean Upload)
```

**User Actions:**
1. Review validation summary
2. Click "✅ Process 8 Valid Sites"

**System Response:**
- Insert all valid sites to database
- Show success message
- Auto-refresh site list
- Close modal

**Success Message:**
```
"Processing 8 valid sites... 8 sites registered successfully! (0 duplicates skipped)"
```

**Updated Site List:**
- Total sites: Previous count + 8 new sites
- New sites appear in table with current date

---

### **Step 7B: Duplicates Detected Scenario**
```
Validation Complete → Duplicate Warning → User Choice
```

**System Response:**
- Detect existing Site IDs in database
- Display duplicate warning with options

**Duplicate Warning Display:**
```
⚠️ Duplicate Sites Detected!
Found 8 existing sites with same IDs:

• JKTB001 - PANYAKALAN
• JKTB002 - KEMAYORAN  
• SUMRI001 - MEDAN PLAZA
• JKTB003 - SENAYAN
• JKTB004 - THAMRIN
• BDGB001 - BANDUNG PLAZA
• SBYB001 - SURABAYA CENTER
• YGYA001 - YOGYA MALIOBORO

┌─────────────────────────┐ ┌─────────────────────────┐ ┌─────────────────────────┐
│  🔄 Modify Existing     │ │ ⏭️ Skip Duplicates &    │ │  🚫 Cancel Upload       │
│     Sites               │ │   Add New Only          │ │                         │
└─────────────────────────┘ ┌─────────────────────────┐ └─────────────────────────┘

📋 Download Validation Report
```

---

### **Step 8A: Modify Existing Sites**
```
Duplicate Warning → Modify Existing Sites → Update Process
```

**User Actions:**
1. Click "🔄 Modify Existing Sites"

**System Process:**
1. Update existing sites with new data from upload
2. Preserve Site IDs, update other fields
3. Set updated_at timestamp

**System Response:**
```
"8 sites updated successfully!"
```

**Result:**
- Site count remains same
- Existing sites updated with new information
- Site names may show "UPDATED" suffix for testing
- Updated dates reflect modification time

---

### **Step 8B: Skip Duplicates**
```
Duplicate Warning → Skip Duplicates → Process New Only
```

**User Actions:**
1. Click "⏭️ Skip Duplicates & Add New Only"

**System Process:**
1. Filter out duplicate Site IDs
2. Insert only new/unique sites
3. Skip existing sites without modification

**System Response:**
```
"Processing 8 valid sites... 0 sites registered successfully! (8 duplicates skipped)"
```

**Result:**
- Site count remains same (no new sites added)
- Existing sites unchanged
- All uploaded sites were duplicates

---

### **Step 8C: Cancel Upload**
```
Duplicate Warning → Cancel Upload → Return to Site Management
```

**User Actions:**
1. Click "🚫 Cancel Upload"

**System Response:**
- Close modal without any changes
- Return to Site Management main view
- No database modifications
- File upload cancelled

---

### **Step 9: Download Validation Report (Optional)**
```
Any Validation State → Download Report
```

**User Actions:**
1. Click "📋 Download Validation Report"

**System Response:**
- Generate detailed CSV report
- Auto-download: `validation_report_YYYY-MM-DD.csv`
- Include all validation results with status

**Report Content:**
```csv
Customer Site ID,Site Name,Region,City,Validation Result
JKTB001,PANYAKALAN,Jakarta,Jakarta,✅ VALID
JKTB002,KEMAYORAN,Jakarta,Jakarta,✅ VALID
SITE_ERROR,INVALID_SITE,Invalid Region,Invalid City,❌ ERROR: Invalid region
SITE_WARNING,WARNING_SITE,Valid Region,Valid City,⚠️ WARNING: Missing coordinates
```

---

### **Step 10: Site Management Operations**
```
Site List → Individual Site Actions
```

**Available Actions per Site:**

#### **👁️ View Site**
**User Actions:**
1. Click view icon (👁️) for any site

**System Response:**
- Open read-only site details modal
- Display all site information
- No editing capabilities

#### **✏️ Edit Site**
**User Actions:**
1. Click edit icon (✏️) for any site
2. Modify site details in form
3. Click "Save Changes"

**System Response:**
- Open editable site details modal
- Allow modification of site name, region, city
- Site ID remains read-only
- Update database on save

#### **🗑️ Delete Site**
**User Actions:**
1. Click delete icon (🗑️) for any site
2. Confirm deletion in dialog

**System Response:**
- Show confirmation dialog
- Delete site from database if confirmed
- Update site list and counter
- Show success message

---

## 📊 **User Journey Metrics**

### **Success Scenarios:**
1. **Clean Upload**: 8 new sites → Total increases by 8
2. **Modify Existing**: 8 sites updated → Total remains same, data updated
3. **Skip Duplicates**: 0 new sites → Total remains same, no changes
4. **Mixed Upload**: X new + Y duplicates → Total increases by X

### **Error Handling:**
1. **Invalid File Type**: Clear error message, file rejected
2. **File Too Large**: Size limit warning, upload blocked
3. **Network Error**: Retry option, graceful failure
4. **Database Error**: Error message, rollback protection

### **User Feedback:**
1. **Progress Indicators**: Loading states during processing
2. **Clear Messages**: Specific success/error notifications
3. **Visual Feedback**: Color-coded validation results
4. **Action Confirmation**: Confirmation dialogs for destructive actions

---

## 🎯 **User Goals Achievement**

### **Primary Goal: Site Registration**
✅ **Achieved**: Sites successfully registered for ATP process

### **Secondary Goals:**
✅ **Bulk Upload**: Multiple sites uploaded efficiently  
✅ **Duplicate Handling**: Clear options for managing conflicts  
✅ **Data Validation**: Comprehensive validation with reporting  
✅ **Error Prevention**: Proactive duplicate detection  
✅ **Data Integrity**: Safe update/skip options for existing data  

### **User Experience Quality:**
✅ **Intuitive Interface**: Clear navigation and actions  
✅ **Informative Feedback**: Detailed status messages  
✅ **Flexible Options**: Multiple ways to handle duplicates  
✅ **Error Recovery**: Graceful handling of edge cases  
✅ **Efficiency**: Streamlined workflow for bulk operations  

---

## 🔄 **Integration with ATP Process**

### **Next Steps After Site Registration:**
1. **Sites Available**: Registered sites appear in ATP submission forms
2. **Site Selection**: Users can select sites for ATP document upload
3. **Workflow Routing**: Sites determine regional approval routing
4. **Process Tracking**: Sites linked to ATP approval workflows

### **Data Flow:**
```
Site Registration → ATP Document Upload → Workflow Assignment → Approval Process
```

---

**Last Updated**: December 19, 2024  
**Version**: 2.2.0  
**Status**: Complete User Journey Documentation  
**Tested**: ✅ All scenarios validated and working