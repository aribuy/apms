# TeleCore APMS - Site Registration Module UI/UX Design

## User Journey Flow
**From**: Site Management > Site Registration → **To**: Complete Site Registration & Optional ATP Task Creation

---

## Page 1: Site Registration Dashboard
**URL**: `/site-management/registration`
**Purpose**: Main hub for site registration activities

### UI Layout:
```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ TeleCore APMS Portal                                    Search...  3  admin      │
│                                                                        admin      │
├─────────────────────────────────────────────────────────────────────────────────┤
│ Dashboard                           Site Management > Site Registration          │
│ User Management                                                                  │
│ Task Management                     Back to Site Management                      │
│ Site Management ←                                                               │
│ BOM Management                      ┌─────────────────────────────────────────┐ │
│ Document Management                 │ Site Registration Overview              │ │
│ Master Data                         │                                         │ │
│ System Administration               │ ┌─────────┐ ┌─────────┐ ┌─────────┐     │ │
│ Monitoring & Reporting              │ │Registered│ │Pending  │ │Failed   │     │ │
│                                     │ │Today     │ │Review   │ │Validation│     │ │
│                                     │ │   12     │ │   3     │ │   1     │     │ │
│                                     │ └─────────┘ └─────────┘ └─────────┘     │ │
│                                     │                                         │ │
│                                     │ ┌─────────┐ ┌─────────┐ ┌─────────┐     │ │
│                                     │ │East Java│ │Central  │ │West Java│     │ │
│                                     │ │   45    │ │Java: 38 │ │   41    │     │ │
│                                     │ └─────────┘ └─────────┘ └─────────┘     │ │
│                                     └─────────────────────────────────────────┘ │
│                                                                                 │
│                                     Registration Methods                        │
│                                     ┌─────────────────────────────────────────┐ │
│                                     │ + [Register Single Site]                │ │
│                                     │ + [Bulk Registration]                   │ │
│                                     │ 👁️ [View Registered Sites]              │ │
│                                     │ 📊 [Registration Reports]               │ │
│                                     │ 🔧 [Manage Pending Reviews]             │ │
│                                     └─────────────────────────────────────────┘ │
│                                                                                 │
│                                     Recent Registrations                       │
│                                     ┌─────────────────────────────────────────┐ │
│                                     │ • JKTB025: Registered (10 min ago)     │ │
│                                     │ • JKTB024: Pending review              │ │
│                                     │ • JKTB023: Registration complete       │ │
│                                     │ • JKTB022: Failed validation           │ │
│                                     └─────────────────────────────────────────┘ │
│                                                                                 │
│ Logout                                                                         │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## Page 2: Single Site Registration Form
**URL**: `/site-management/registration/single`
**Purpose**: Register individual site with comprehensive information

### UI Layout:
```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ TeleCore APMS Portal                                    Search...  3  admin      │
├─────────────────────────────────────────────────────────────────────────────────┤
│ Site Management > Registration > Single Site                                   │
│                                                                                 │
│ ⬅️ Back to Registration    + REGISTER NEW SITE                                  │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│ Step 1: Basic Site Information                                                 │
│ ┌─────────────────────────────────────────────────────────────────────────────┐ │
│ │ Site Identification                                                         │ │
│ │                                                                             │ │
│ │ Customer Site ID: [JAW-JI-SMP-4240_JAW-JI-SMP-3128_Y25_MWU0-04]           │ │
│ │ Customer Site Name: [GILIGENTING BRINGSANG_KALIANGET                    ] │ │
│ │                                                                             │ │
│ │ Near End Information                     Far End Information               │ │
│ │ NE Tower ID: [JAW-JI-SMP-4240]          FE Tower ID: [JAW-JI-SMP-3128]    │ │
│ │ NE Name: [GILIGENTING BRINGSANG]        FE Name: [KALIANGET            ] │ │
│ │                                                                             │ │
│ │ Distribution Unit (Optional)                                               │ │
│ │ DU ID: [JAW-JI-SMP-4240_JAW-JI-SMP-3128_Y25_MWU0-04                    ] │ │
│ │ DU Name: [PABERASAN SUMENEP RELOCATION_JUNGKAT RAAS                    ] │ │
│ └─────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                 │
│ Step 2: Geographic Information                                                 │
│ ┌─────────────────────────────────────────────────────────────────────────────┐ │
│ │ GPS Coordinates (Required)                                                  │ │
│ │                                                                             │ │
│ │ Near End Coordinates              Far End Coordinates                      │ │
│ │ Latitude: [-7.1234567]            Latitude: [-7.2345678]                  │ │
│ │ Longitude: [112.9876543]          Longitude: [112.8765432]                │ │
│ │                                                                             │ │
│ │ 📍 [Auto-detect from Address] 🗺️ [Open Map Picker]                         │ │
│ │                                                                             │ │
│ │ Regional Assignment                                                         │ │
│ │ Delivery Region: [East Java ▼]                                             │ │
│ │ Coverage Area: [Sumenep District]                                          │ │
│ └─────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                 │
│ Step 3: Technical Specifications                                               │
│ ┌─────────────────────────────────────────────────────────────────────────────┐ │
│ │ Activity & Work Scope                                                       │ │
│ │                                                                             │ │
│ │ Activity Flow: [13. MW Upg Upgrade N+0 Change Antenna              ▼]     │ │
│ │ SOW Category: [Upgrade N+0                                          ▼]     │ │
│ │ Project Code: [Y25_MWU0-04]                                                │ │
│ │                                                                             │ │
│ │ Technical Details (Optional)                                               │ │
│ │ Frequency Band: [18GHz ▼]    Link Capacity: [1Gbps ▼]                     │ │
│ │ Antenna Size: [0.6m ▼]       Equipment Type: [Aviat CTR8000 ▼]           │ │
│ └─────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                 │
│ [❌ Cancel] [💾 Save Draft] [➡️ Continue to ATP Setup]                          │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## Page 3: ATP Requirements Configuration
**URL**: `/site-management/registration/single/atp-setup`
**Purpose**: Configure ATP testing requirements for the registered site

### UI Layout:
```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ TeleCore APMS Portal                                    Search...  3  admin      │
├─────────────────────────────────────────────────────────────────────────────────┤
│ Site Management > Registration > ATP Requirements Setup                        │
│                                                                                 │
│ ⬅️ Back to Site Info    🔧 ATP REQUIREMENTS CONFIGURATION                       │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│ Site: JKTB001 - GILIGENTING BRINGSANG_KALIANGET                               │
│                                                                                 │
│ Step 4: ATP Testing Requirements                                               │
│ ┌─────────────────────────────────────────────────────────────────────────────┐ │
│ │ Required ATP Types (Based on Activity: MW Upgrade)                         │ │
│ │                                                                             │ │
│ │ ☑️ Software ATP Required                                                    │ │
│ │    ✅ Configuration testing                                                 │ │
│ │    ✅ License verification                                                  │ │
│ │    ✅ Performance validation                                                │ │
│ │    ✅ Integration testing                                                   │ │
│ │                                                                             │ │
│ │ ☑️ Hardware ATP Required                                                    │ │
│ │    ✅ Physical installation check                                           │ │
│ │    ✅ Cable & connection verification                                       │ │
│ │    ✅ Power & grounding validation                                          │ │
│ │    ✅ Environmental compliance                                              │ │
│ │                                                                             │ │
│ │ ☐ Special Testing Requirements                                              │ │
│ │    ☐ Security audit testing                                                │ │
│ │    ☐ Redundancy failover testing                                           │ │
│ │    ☐ Load testing (high capacity links)                                    │ │
│ └─────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                 │
│ Step 5: Assignment & Scheduling                                                │
│ ┌─────────────────────────────────────────────────────────────────────────────┐ │
│ │ Document Controller Assignment                                              │ │
│ │                                                                             │ │
│ │ Auto-assigned: DocCtrl_EastJava (Based on region)                         │ │
│ │ Override: [Select different controller ▼]                                  │ │
│ │                                                                             │ │
│ │ Priority & Scheduling                                                       │ │
│ │ Priority Level: ● High  ○ Medium  ○ Low                                     │ │
│ │ Target Completion: [2025-10-30] (7 days for High priority)                │ │
│ │                                                                             │ │
│ │ Notification Settings                                                       │ │
│ │ ☑️ Email assigned document controller                                       │ │
│ │ ☑️ Create calendar reminders                                                │ │
│ │ ☑️ Send escalation alerts for overdue tasks                                │ │
│ └─────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                 │
│ [⬅️ Back] [💾 Save without ATP] [✅ Register Site + Create ATP Tasks]          │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## Page 4: Registration Confirmation
**URL**: `/site-management/registration/success`
**Purpose**: Confirm successful site registration and ATP task creation

### UI Layout:
```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ TeleCore APMS Portal                                    Search...  3  admin      │
├─────────────────────────────────────────────────────────────────────────────────┤
│ Site Management > Registration > Success                                       │
│                                                                                 │
│ ✅ SITE REGISTRATION COMPLETED                                                  │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│ 🎉 Site Registration Successful!                                               │
│ ┌─────────────────────────────────────────────────────────────────────────────┐ │
│ │ ✅ Registration Summary:                                                    │ │
│ │                                                                             │ │
│ │ Site ID: JKTB001                                                           │ │
│ │ Site Name: GILIGENTING BRINGSANG_KALIANGET                                │ │
│ │ Region: East Java                                                          │ │
│ │ Registration Time: 16 Oktober 2025, 14:30 WIB                             │ │
│ │ Status: Active                                                             │ │
│ │                                                                             │ │
│ │ 🔧 ATP Tasks Created:                                                       │ │
│ │ • Software ATP Task (ID: ATP-SW-JKTB001-001)                              │ │
│ │   - Assigned to: DocCtrl_EastJava                                          │ │
│ │   - Due date: 30 Oktober 2025                                             │ │
│ │   - Priority: High                                                         │ │
│ │                                                                             │ │
│ │ • Hardware ATP Task (ID: ATP-HW-JKTB001-001)                              │ │
│ │   - Assigned to: DocCtrl_EastJava                                          │ │
│ │   - Due date: 30 Oktober 2025                                             │ │
│ │   - Priority: High                                                         │ │
│ │                                                                             │ │
│ │ 📧 Notifications Sent:                                                      │ │
│ │ • Email sent to DocCtrl_EastJava@company.com                              │ │
│ │ • Calendar invites created                                                 │ │
│ │ • Task assignments updated in system                                       │ │
│ └─────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                 │
│ 🔗 Quick Actions:                                                               │
│ ┌─────────────────────────────────────────────────────────────────────────────┐ │
│ │ 👁️ [View Site Details]                                                      │ │
│ │ 📋 [View ATP Tasks]                                                         │ │
│ │ + [Register Another Site]                                                  │ │
│ │ 📊 [View Site Reports]                                                      │ │
│ │ 📤 [Upload Document for this Site]                                         │ │
│ │ 🗺️ [View Site on Map]                                                       │ │
│ └─────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                 │
│ 📋 Next Steps:                                                                  │
│ 1. Document controller will upload ATP documents                              │
│ 2. ATP testing will be scheduled and executed                                 │
│ 3. Results will be reviewed and approved                                      │
│ 4. Site will be marked as operational upon completion                         │
│                                                                                 │
│ [🏠 Back to Dashboard] [📍 Site Management] [➕ Register New Site]             │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## Page 5: Bulk Site Registration
**URL**: `/site-management/registration/bulk`
**Purpose**: Register multiple sites simultaneously

### UI Layout:
```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ TeleCore APMS Portal                                    Search...  3  admin      │
├─────────────────────────────────────────────────────────────────────────────────┤
│ Site Management > Registration > Bulk Registration                             │
│                                                                                 │
│ ⬅️ Back to Registration    📁 BULK SITE REGISTRATION                            │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│ Registration Methods                                                           │
│ ┌─────────────────────────────────────────────────────────────────────────────┐ │
│ │ Choose Registration Method:                                                 │ │
│ │                                                                             │ │
│ │ ● CSV/Excel Upload                                                          │ │
│ │   Upload spreadsheet with multiple site data                               │ │
│ │                                                                             │ │
│ │ ○ API Integration                                                           │ │
│ │   Import from external system via API                                      │ │
│ │                                                                             │ │
│ │ ○ Manual Batch Entry                                                        │ │
│ │   Enter multiple sites using form interface                                │ │
│ └─────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                 │
│ Step 1: File Upload                                                            │
│ ┌─────────────────────────────────────────────────────────────────────────────┐ │
│ │ 📋 Required Information:                                                    │ │
│ │ • Site identification (Customer Site ID, Name)                             │ │
│ │ • Tower information (NE/FE Tower IDs and Names)                            │ │
│ │ • GPS coordinates (all four coordinates required)                          │ │
│ │ • Regional assignment and activity details                                 │ │
│ │ • ATP requirements and assignments                                         │ │
│ │                                                                             │ │
│ │ 📥 [Download Registration Template] 📚 [Registration Guide]                │ │
│ │                                                                             │ │
│ │        📁 Drag & Drop Registration File Here                               │ │
│ │                  or Click to Browse                                        │ │
│ │                                                                             │ │
│ │              Supported: CSV, Excel (.xlsx)                                 │ │
│ │                 Max size: 25MB                                             │ │
│ │                                                                             │ │
│ │ [📁 Choose File]                                                            │ │
│ └─────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                 │
│ Step 2: Validation & Preview                                                   │
│ ┌─────────────────────────────────────────────────────────────────────────────┐ │
│ │ ⏳ Upload a file to see validation results                                  │ │
│ └─────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                 │
│ [❌ Cancel] [🔄 Reset]                                                          │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## Page 6: Site Management View
**URL**: `/site-management/registration/view`
**Purpose**: View and manage all registered sites

### UI Layout:
```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ TeleCore APMS Portal                                    Search...  3  admin      │
├─────────────────────────────────────────────────────────────────────────────────┤
│ Site Management > Registration > View Sites                                    │
│                                                                                 │
│ ⬅️ Back to Registration    👁️ REGISTERED SITES (156 total)                      │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│ 🔍 Filters & Search:                                                            │
│ ┌─────────────────────────────────────────────────────────────────────────────┐ │
│ │ Region: [All Regions ▼] | Status: [All Status ▼] | ATP: [All Types ▼]      │ │
│ │ Date Range: [Last 30 days ▼] | Search: [Site ID or Name...]                │ │
│ └─────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                 │
│ 📊 Site Statistics:                                                             │
│ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐                   │
│ │ Total   │ │ Active  │ │ ATP     │ │ ATP     │ │ Pending │                   │
│ │ Sites   │ │ Sites   │ │ Pending │ │Complete │ │ Review  │                   │
│ │  156    │ │  142    │ │   23    │ │  119    │ │   14    │                   │
│ └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘                   │
│                                                                                 │
│ 📋 Registered Sites List:                                                      │
│ ┌─┬─────────┬──────────────────┬─────────┬─────────┬──────────┬──────────┬─────┐ │
│ │☐│Site ID  │Site Name         │Region   │Status   │ATP SW    │ATP HW    │Action│ │
│ ├─┼─────────┼──────────────────┼─────────┼─────────┼──────────┼──────────┼─────┤ │
│ │☐│JKTB001  │GILIGENTING_KAL.. │East Java│Active   │✅Complete│✅Complete│[👁️] │ │
│ │☐│JKTB002  │MBTS_ARJASA_KAN.. │East Java│Active   │⏳Pending │✅Complete│[👁️] │ │
│ │☐│JKTB003  │SIDOASIH_DAMPEL   │Cent Java│Active   │📝Review  │📝Review  │[👁️] │ │
│ │☐│JKTB004  │BOJONG_CIKEAS     │Jabodetab│Pending  │❌Failed  │⏳Pending │[👁️] │ │
│ │☐│JKTB005  │MALABAR_CIATEUL   │West Java│Active   │✅Complete│⏳Pending │[👁️] │ │
│ └─┴─────────┴──────────────────┴─────────┴─────────┴──────────┴──────────┴─────┘ │
│                                                                                 │
│ 📤 Bulk Actions:                                                               │
│ [📧 Send Notifications] [📥 Export Sites] [🔄 Refresh Status] [📊 Generate Report] │
│                                                                                 │
│ Pagination: [← Previous] [1] [2] [3] [4] [5] [Next →]   Showing 1-20 of 156   │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## Advanced Features & Integration

### 1. GPS Coordinate Integration
```javascript
// Auto-detect coordinates from address
const getCoordinatesFromAddress = async (address) => {
    const response = await geocodingService.geocode(address);
    return {
        latitude: response.lat,
        longitude: response.lng,
        accuracy: response.accuracy
    };
};

// Validate coordinates for Indonesia bounds
const validateIndonesiaCoordinates = (lat, lng) => {
    return (lat >= -11 && lat <= 6) && (lng >= 95 && lng <= 141);
};
```

### 2. Smart Auto-Assignment
```javascript
// Auto-assign document controller based on region
const autoAssignDocController = (region) => {
    const assignments = {
        'East Java': 'DocCtrl_EastJava',
        'Central Java': 'DocCtrl_CentralJava',
        'West Java': 'DocCtrl_WestJava',
        'Jabodetabek': 'DocCtrl_Jakarta'
    };
    return assignments[region] || 'DocCtrl_Default';
};

// Auto-determine ATP requirements based on activity
const determineAtpRequirements = (activityFlow) => {
    const requirements = {
        'MW Upg': { software: true, hardware: true },
        'MW New': { software: true, hardware: true },
        'Reroute': { software: true, hardware: false },
        'Change Antenna': { software: false, hardware: true }
    };
    
    for (let key in requirements) {
        if (activityFlow.includes(key)) {
            return requirements[key];
        }
    }
    
    return { software: true, hardware: true }; // Default
};
```

### 3. Real-time Validation
```javascript
// Form validation with real-time feedback
const validateSiteRegistration = (formData) => {
    const errors = {};
    
    // Required field validation
    if (!formData.customerSiteId) {
        errors.customerSiteId = 'Customer Site ID is required';
    }
    
    // GPS coordinate validation
    if (!validateIndonesiaCoordinates(formData.neLatitude, formData.neLongitude)) {
        errors.coordinates = 'Coordinates must be within Indonesia bounds';
    }
    
    // Duplicate site ID check
    if (existingSites.includes(formData.customerSiteId)) {
        errors.customerSiteId = 'Site ID already exists';
    }
    
    return {
        isValid: Object.keys(errors).length === 0,
        errors
    };
};
```

### 4. Integration with Task Management
```javascript
// Create ATP tasks after successful site registration
const createAtpTasksForSite = async (siteData) => {
    const tasks = [];
    
    if (siteData.atpSoftwareRequired) {
        tasks.push({
            siteId: siteData.customerSiteId,
            type: 'software',
            assignedTo: siteData.assignedDocController,
            priority: siteData.priority,
            dueDate: calculateDueDate(siteData.priority),
            status: 'pending_upload'
        });
    }
    
    if (siteData.atpHardwareRequired) {
        tasks.push({
            siteId: siteData.customerSiteId,
            type: 'hardware',
            assignedTo: siteData.assignedDocController,
            priority: siteData.priority,
            dueDate: calculateDueDate(siteData.priority),
            status: 'pending_upload'
        });
    }
    
    return await Promise.all(tasks.map(task => createAtpTask(task)));
};
```

### 5. Mobile-Responsive Design
```css
/* Mobile adaptations for site registration forms */
@media (max-width: 768px) {
    .registration-form {
        padding: 1rem;
    }
    
    .form-row {
        flex-direction: column;
    }
    
    .coordinate-inputs {
        grid-template-columns: 1fr;
        gap: 0.5rem;
    }
    
    .action-buttons {
        flex-direction: column;
        gap: 0.5rem;
    }
}
```

This comprehensive Site Registration module integrates seamlessly with your existing TeleCore APMS interface while providing robust functionality for both individual and bulk site registration, complete with ATP task creation workflow.