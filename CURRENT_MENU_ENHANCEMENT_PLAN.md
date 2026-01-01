# 🎯 Current Menu Enhancement Plan - Specific & Actionable

**Date:** 2025-12-29
**Based on:** Analysis of existing App.tsx
**Goal:** Enhance 10 existing menus for multi-tenant + versioned config support

---

## 📊 Current Menu Structure (Existing)

```
Current Modules in App.tsx:
├─ 1. Dashboard
├─ 2. User Management
├─ 3. Task Management ✅ (SUDAH DIPERBAIKI - tidak blank)
├─ 4. Site Management
├─ 5. BOM Management
├─ 6. Document Management
├─ 7. ATP Checklist Templates
├─ 8. ATP Process Management
├─ 9. Master Data
├─ 10. System Administration
└─ 11. Monitoring & Reporting
```

---

## 🎯 Enhancement Priority per Menu

### 🔴 HIGH PRIORITY (Critical for Multi-Tenant + Versioned Config)

#### **Menu 1: Dashboard** ⭐⭐⭐⭐⭐
**Current:** Stats cards, module cards, activities
**Enhancement Needed:** ✅ YES - CRITICAL

**What to Add:**
1. ✅ **Workspace Switcher** (P0) - IN HEADER
   - Dropdown to switch workspaces
   - Show current workspace name
   - Show active config badge

2. ✅ **Config Status Indicator** (P0)
   - Badge: "Config v1 (ACTIVE)" or "DRAFT exists"
   - Color-coded: 🟢 ACTIVE / 🟡 DRAFT

3. ✅ **Environment Banner** (P0)
   - Already exists for staging (line 506-510)
   - Improve: Add hostname, version number

4. ✅ **Workspace-Aware Stats** (P1)
   - Filter stats by workspace
   - Show stats for current workspace only

**Implementation:** Modify `<Header />` component
**File:** `frontend/src/App.tsx` (lines 488-546)
**Effort:** 2-3 days

---

#### **Menu 2: User Management** ⭐⭐⭐⭐⭐
**Current:** Component: `UserManagement`
**Enhancement Needed:** ✅ YES - CRITICAL

**What to Add:**
1. ✅ **Workspace Members Tab** (P0)
   - Add to existing UserManagement component
   - Show members per workspace
   - Add/remove members
   - Assign roles per workspace

2. ✅ **Role per Workspace** (P0)
   - Current: Global role only
   - New: Role can vary by workspace
   - Roles: Admin, Manager, Approver, Vendor, User

3. ✅ **Invite User to Workspace** (P1)
   - Email invite flow
   - Set default workspace

**File to Modify:** `frontend/src/components/UserManagement/UserManagement.tsx`
**Effort:** 3-5 days

---

#### **Menu 3: Task Management** ⭐⭐⭐⭐⭐
**Current:** Component: `TaskManagement` ✅ SUDAH DIPERBAIKI
**Enhancement Needed:** ✅ YES - BUT LESS URGENT

**What to Add:**
1. ✅ **Workspace Filter** (P0)
   - Filter tasks by current workspace
   - Auto-filter on load

2. ✅ **Config Version Indicator** (P1)
   - Show which config version task belongs to
   - Badge on task row

**File to Modify:** `frontend/src/components/TaskManagement/TaskList.tsx`
**Effort:** 1-2 days

---

#### **Menu 4: Site Management** ⭐⭐⭐⭐
**Current:** Component: `SiteManagement`
**Enhancement Needed:** ✅ YES - IMPORTANT

**What to Add:**
1. ✅ **Workspace Filter** (P0)
   - Sites belong to workspace
   - Auto-filter by current workspace

2. ✅ **Scope Selection** (P0)
   - Scope dropdown (from atp_scope_master)
   - Filter by active config

**File to Modify:** `frontend/src/components/SiteManagement/index.tsx`
**Effort:** 2-3 days

---

#### **Menu 5: BOM Management** ⭐⭐⭐⭐
**Current:** Listed in menu
**Enhancement Needed:** ✅ YES - IMPORTANT

**What to Add:**
1. ✅ **Rename to "Config Versions"** (P0)
   - BOM Management = Config Versions
   - Add lifecycle management UI

2. ✅ **Config Actions** (P0)
   - Create Draft
   - Activate (SUPERSEDE old ACTIVE)
   - View history
   - Diff viewer

3. ✅ **Import Config** (P1)
   - Upload xlsx/csv
   - Validate before import

**New Component:** `frontend/src/components/ConfigVersions/ConfigVersions.tsx`
**Effort:** 5-7 days

---

#### **Menu 6: Document Management** ⭐⭐⭐⭐
**Current:** Component: `DocumentManagement`
**Enhancement Needed:** ✅ YES - MODERATE

**What to Add:**
1. ✅ **Workspace Filter** (P0)
   - Documents filtered by workspace

2. ✅ **Workflow Reference** (P1)
   - Show which config version document uses
   - Show freeze-by-reference info

**File to Modify:** `frontend/src/components/DocumentManagement/DocumentManagement.tsx`
**Effort:** 2-3 days

---

#### **Menu 9: Master Data** ⭐⭐⭐⭐⭐
**Current:** Listed in menu
**Enhancement Needed:** ✅ YES - VERY IMPORTANT

**What to Add:**
1. ✅ **Master Data Hub** (P0) - NEW COMPREHENSIVE UI
   - Combine all master data management here
   - Sub-menus:
     - ATP Scope Master
     - Vendor Master
     - Approval Roles
     - Approval Policies
     - Clusters

2. ✅ **Version Filter** (P0)
   - Toggle: "Active Only" / "All Versions"
   - Show config_version_id for each record

3. ✅ **CRUD Operations** (P0)
   - Create/Edit (auto-inject workspace_id, configVersionId)
   - Delete (with reference check)

**New Component:** `frontend/src/components/MasterDataHub/MasterDataHub.tsx`
**Effort:** 7-10 days

---

#### **Menu 10: System Administration** ⭐⭐⭐⭐⭐
**Current:** Listed in menu
**Enhancement Needed:** ✅ YES - CRITICAL

**What to Add:**
1. ✅ **Workspace Management** (P0) - NEW SECTION
   - List workspaces
   - Create/Edit workspace
   - Activate/Deactivate workspace

2. ✅ **Audit Logs Viewer** (P0) - NEW SECTION
   - Filter by workspace, entity, action, user, date
   - Export CSV/PDF
   - Show who did what

3. ✅ **Data Integrity Dashboard** (P1)
   - Orphan checks
   - FK violation attempts
   - Health score

**New Components:**
- `frontend/src/components/Administration/WorkspaceManagement.tsx`
- `frontend/src/components/Administration/AuditLogs.tsx`
- `frontend/src/components/Administration/DataIntegrity.tsx`

**Effort:** 5-7 days

---

### 🟡 MEDIUM PRIORITY (Nice to Have)

#### **Menu 7: ATP Checklist Templates** ⭐⭐⭐
**Current:** Component: `ATPTemplateManagement`
**Enhancement Needed:** ⚠️ OPTIONAL

**What to Add:**
1. ✅ **Workspace Filter** (P1)
   - Templates scoped to workspace

2. ✅ **Config Version Association** (P1)
   - Link template to config version

**File to Modify:** `frontend/src/components/ATPTemplateManagement/ATPTemplateManagement.tsx`
**Effort:** 2-3 days

---

#### **Menu 8: ATP Process Management** ⭐⭐⭐
**Current:** Component: `ATPManagement`
**Enhancement Needed:** ⚠️ MODERATE

**What to Add:**
1. ✅ **Rename to "My Inbox"** (P1)
   - Focus on pending approvals
   - Show tasks awaiting user's approval

2. ✅ **Workflow Filter** (P0)
   - Show workflows for current workspace

3. ✅ **Approval Queue** (P0)
   - Prioritized approval list
   - Batch approve/reject

**File to Modify:** `frontend/src/components/ATPManagement/ATPManagement.tsx`
**Effort:** 3-4 days

---

#### **Menu 11: Monitoring & Reporting** ⭐⭐⭐⭐
**Current:** Listed in menu
**Enhancement Needed:** ⚠️ MODERATE

**What to Add:**
1. ✅ **Workspace-Based Reports** (P1)
   - Filter by workspace

2. ✅ **Config Version History** (P1)
   - Track config changes over time

**New Component:** `frontend/src/components/Monitoring/Reports.tsx`
**Effort:** 4-5 days

---

## 🚀 Detailed Enhancement Plan

### **Phase 1: Foundation (Week 1-2)** - CRITICAL

#### **A. Global UI Components (Shared Across All Menus)**

**1. Workspace Context Bar in Header** ⭐⭐⭐⭐⭐
**Location:** Modify `<Header />` component
**File:** `frontend/src/App.tsx` lines 488-546

**Changes:**
```typescript
// Add workspace switcher to header (line 489-546)
const Header = () => {
  const { currentWorkspace, userWorkspaces, switchWorkspace } = useWorkspaceContext();
  const [anchorEl, setAnchorEl] = useState(null);

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 px-4 md:px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Workspace Switcher */}
        <div className="flex items-center space-x-3">
          <Button
            onClick={(e) => setAnchorEl(e.currentTarget)}
            endIcon={<ArrowDropDown />}
            sx={{ textTransform: 'none' }}
          >
            <WorkIcon className="w-5 h-5 mr-1" />
            {currentWorkspace?.name || 'Select Workspace'}
          </Button>

          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={() => setAnchorEl(null)}
          >
            {userWorkspaces.map((ws) => (
              <MenuItem
                key={ws.id}
                onClick={() => switchWorkspace(ws.id)}
                selected={ws.id === currentWorkspace?.id}
              >
                {ws.name}
              </MenuItem>
            ))}
          </Menu>
        </div>

        {/* Active Config Badge */}
        {activeConfigs && activeConfigs.length > 0 && (
          <Chip
            label={`Config v${activeConfigs[0].versionNumber} (${activeConfigs[0].status})`}
            color={activeConfigs[0].status === 'ACTIVE' ? 'success' : 'warning'}
            size="small"
          />
        )}
      </div>
    </header>
  );
};
```

**2. Environment Banner Enhancement**
**Location:** Already exists at line 506-510
**Enhancement:**
```typescript
// Improve environment badge (line 506-510)
{process.env.REACT_APP_ENVIRONMENT === 'staging' && (
  <Tooltip title={`Host: ${window.location.hostname}`}>
    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 border border-orange-200">
      🟡 STAGING | apmsstaging.datacodesolution.com
    </span>
  </Tooltip>
)}

// Add for production
{process.env.REACT_APP_ENVIRONMENT === 'production' && (
  <Tooltip title={`Host: ${window.location.hostname}`}>
    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200">
      🔴 PRODUCTION | apms.datacodesolution.com
    </span>
  </Tooltip>
)}
```

**Effort:** 2-3 days

---

### **Phase 2: Core Menus Enhancement (Week 3-4)**

#### **B. Menu 2: User Management → Add Workspace Members**

**Create:** `frontend/src/components/UserManagement/WorkspaceMembers.tsx`

**Features:**
- Tab: "Users" (existing)
- Tab: "Workspace Members" (NEW)
- Add member form
- Remove member
- Change role per workspace

**UI Structure:**
```typescript
<Tabs>
  <Tab label="Users">
    {/* Existing user management */}
  </Tab>
  <Tab label="Workspace Members">
    <WorkspaceMemberList workspaceId={currentWorkspace.id} />
  </Tab>
</Tabs>
```

**Backend API Needed:**
```typescript
// GET /api/v1/workspaces/:workspaceId/members
// POST /api/v1/workspaces/:workspaceId/members
// PUT /api/v1/workspaces/:workspaceId/members/:userId
// DELETE /api/v1/workspaces/:workspaceId/members/:userId
```

**Effort:** 3-5 days

---

#### **C. Menu 5 → Menu 5: Config Versions (Rename from BOM)**

**Rename:** "BOM Management" → "Config Versions"

**Create:** `frontend/src/components/ConfigVersions/ConfigVersionsList.tsx`

**Features:**
1. **List configs** per workspace
2. **Status badges:** DRAFT / ACTIVE / SUPERSEDED
3. **Actions:**
   - Create Draft
   - Activate (with confirmation)
   - View history
   - Diff viewer

**UI Display:**
```
Config Versions - XLSMART-AVIAT
┌─────────────────────────────────────────────────┐
│ [Import Config] [Active Only ▼]              │
├─────────────────────────────────────────────────┤
│ Ver | Status    | Source   | Created   | Actions │
│─────┼───────────┼──────────┼──────────┼─────────│
│ v2  | 🟡 DRAFT  | SCOPE    | 2 days ago│ [Activate]│
│ v1  | 🟢 ACTIVE | SCOPE    | 1 week ago│ [View]    │
│ v1  | 🔵 SUPER | APPROVAL  | 2 weeks  │ [View]    │
└─────────────────────────────────────────────────┘
```

**Backend API Needed:**
```typescript
// GET /api/v1/config-versions?workspaceId=xxx
// POST /api/v1/config-versions (create DRAFT)
// POST /api/v1/config-versions/:id/activate (activate)
// GET /api/v1/config-versions/:id/diff/:compareWithId (diff)
```

**Effort:** 5-7 days

---

#### **D. Menu 9 → Master Data Hub (Comprehensive)**

**Create:** `frontend/src/components/MasterDataHub/MasterDataHub.tsx`

**Structure:**
```
Master Data Hub
├─ Entity Selector: [ATP Scope ▼]
├─ Version Toggle: ☑ Active Only | Show All Versions
├─ Data Table (CRUD)
└─ Actions: [Import] [Export] [Bulk Edit]

Entities:
- ATP Scope Master
- Vendor Master
- Approval Role Master
- Approval Policy Master
- Cluster Master
- Cluster Approver Master
```

**Features:**
1. **Entity Selector** (dropdown)
2. **Auto-inject** workspace_id and configVersionId
3. **Version Toggle** - Show active only or all versions
4. **CRUD Operations** - Create, Edit, Delete (with protection)

**Backend API Needed:**
```typescript
// Generic master data API
// GET /api/v1/master-data/:entity?workspaceId=xxx&configVersionId=xxx&status=active
// POST /api/v1/master-data/:entity
// PUT /api/v1/master-data/:entity/:id
// DELETE /api/v1/master-data/:entity/:id (with reference check)
```

**Effort:** 7-10 days

---

### **Phase 3: Operational Excellence (Week 5-6)**

#### **E. Menu 8 → Menu 8: My Inbox (Rename from ATP Process Management)**

**Rename:** "ATP Process Management" → "My Inbox"

**Enhancement:**
1. Focus on pending approvals
2. Workflow filter by workspace
3. Prioritized list (overdue first)

**Create:** `frontend/src/components/MyInbox/MyInbox.tsx`

**Features:**
```
My Inbox - Pending Approvals (3)
┌────────────────────────────────────────────┐
│ Filter: [Overdue] [By Site ▼] [Priority ▼] │
├────────────────────────────────────────────┤
│ Workflow        | Site  | Stage | Due    │ Action │
│─────────────────┼──────┼───────┼────────┼────────│
│ ATP-Tower-A-HW  │ A    │ 2/3  | Overdue│[Approve]│
│ ATP-Tower-B-SW  │ B    │ 1/2  | Tomorr│[Review] │
│ Punchlist-P1    │ C    │ 3/3  | 2 days │[View]   │
└────────────────────────────────────────────┘
```

**Effort:** 3-4 days

---

#### **F. Menu 10: System Administration Enhancement**

**Create 3 New Sub-Menus:**

**1. Workspace Management** (P0)
- File: `frontend/src/components/Administration/WorkspaceManagement.tsx`
- CRUD for workspaces
- Activate/deactivate workspace

**2. Audit Logs Viewer** (P0)
- File: `frontend/src/components/Administration/AuditLogs.tsx`
- Filter by workspace, entity, action, user, date
- Export CSV/PDF
- Show: config activations, approvals, deletes

**3. Data Integrity Dashboard** (P1)
- File: `frontend/src/components/Administration/DataIntegrity.tsx`
- Orphan checks (should be 0)
- FK violation attempts
- Health score

**Backend API Needed:**
```typescript
// Workspaces
// GET /api/v1/workspaces
// POST /api/v1/workspaces
// PUT /api/v1/workspaces/:id
// DELETE /api/v1/workspaces/:id

// Audit Logs
// GET /api/v1/audit-logs?workspaceId=xxx&entity=xxx&action=xxx&userId=xxx&startDate=xxx&endDate=xxx

// Data Integrity
// GET /api/v1/admin/integrity-check
// Returns: orphan counts, FK violations, health score
```

**Effort:** 5-7 days

---

## 📊 Enhancement Summary Table

| Menu | Current State | Enhancement Priority | What to Add | Effort |
|------|--------------|---------------------|-------------|--------|
| **1. Dashboard** | ✅ Working | ⭐⭐⭐⭐⭐ CRITICAL | Workspace switcher, Config badge, Env banner | 2-3 days |
| **2. User Management** | ✅ Exists | ⭐⭐⭐⭐⭐ CRITICAL | Workspace members tab, Role per workspace | 3-5 days |
| **3. Task Management** | ✅ Fixed | ⭐⭐⭐⭐ IMPORTANT | Workspace filter, Config indicator | 1-2 days |
| **4. Site Management** | ✅ Exists | ⭐⭐⭐⭐ IMPORTANT | Workspace filter, Scope selection | 2-3 days |
| **5. BOM → Config Versions** | ✅ Listed | ⭐⭐⭐⭐⭐ VERY IMPORTANT | Lifecycle UI (Draft/Activate), Import, Diff | 5-7 days |
| **6. Document Management** | ✅ Exists | ⭐⭐⭐ MODERATE | Workspace filter, Workflow reference | 2-3 days |
| **7. ATP Templates** | ✅ Exists | ⭐⭐⭐ OPTIONAL | Workspace filter, Config association | 2-3 days |
| **8. ATP Process → My Inbox** | ✅ Exists | ⭐⭐⭐⭐ IMPORTANT | Focus approvals, Workspace filter | 3-4 days |
| **9. Master Data** | ✅ Listed | ⭐⭐⭐⭐⭐ VERY IMPORTANT | Master Data Hub, CRUD, Version filter | 7-10 days |
| **10. System Admin** | ✅ Listed | ⭐⭐⭐⭐⭐ CRITICAL | Workspaces, Audit logs, Integrity dashboard | 5-7 days |
| **11. Monitoring** | ✅ Listed | ⭐⭐⭐ OPTIONAL | Workspace-based reports | 4-5 days |

---

## 🎯 Recommended Implementation Order

### **Sprint 1 (Week 1-2) - Foundation**
**Focus:** Global UI components that affect all menus

1. ✅ **Workspace Context Bar** (Header) - 2 days
2. ✅ **Environment Banner Enhancement** - 1 day
3. ✅ **Workspace Provider & Context** - 2 days

**Total:** 5 days

---

### **Sprint 2 (Week 3-4) - Core Menus**
**Focus:** Most critical menus for multi-tenant + versioned config

4. ✅ **User Management** (Add Workspace Members) - 4 days
5. ✅ **Config Versions** (Rename from BOM) - 6 days
6. ✅ **Master Data Hub** (Comprehensive) - 8 days

**Total:** 18 days (3.6 weeks)

---

### **Sprint 3 (Week 5-6) - Operations**
**Focus:** User-facing operational features

7. ✅ **Task Management** (Workspace filter) - 2 days
8. ✅ **Site Management** (Workspace filter) - 3 days
9. ✅ **My Inbox** (Rename from ATP Process) - 4 days
10. ✅ **System Administration** (3 new sub-menus) - 6 days

**Total:** 15 days (3 weeks)

---

## 🔧 Implementation Checklist

### **Global Components**
- [ ] Workspace context provider
- [ ] Workspace switcher component
- [ ] Config badge component
- [ ] Environment banner enhancement

### **Per Menu**
- [ ] Dashboard: Add workspace context bar
- [ ] User Management: Add workspace members tab
- [ ] Task Management: Add workspace filter
- [ ] Site Management: Add workspace filter
- [ ] BOM Management: Rename to Config Versions + lifecycle UI
- [ ] Document Management: Add workspace filter
- [ ] ATP Templates: Add workspace filter
- [ ] ATP Process: Rename to My Inbox + focus on approvals
- [ ] Master Data: Create Master Data Hub
- [ ] System Admin: Add Workspaces, Audit Logs, Integrity

---

## 📈 Estimated Timeline

**Total:** 6-8 weeks

- **Week 1-2:** Global UI components (5 features)
- **Week 3-4:** Core menu enhancements (3 menus)
- **Week 5-6:** Operations enhancements (4 menus)

**Resources:**
- 2 Frontend Developers
- 1 Backend Developer
- 1 UI/UX Designer

---

## ✅ Success Criteria

**After implementation:**
- ✅ User can switch workspaces from UI (no DB manual)
- ✅ All pages show data for current workspace only
- ✅ Config lifecycle manageable (Draft/Activate/Supersede)
- ✅ Master data manageable from UI (no DB manual)
- ✅ Audit trail visible from UI
- ✅ No confusion about which workspace/context active

---

*Plan Created: 2025-12-29*
*Based on: Analysis of existing App.tsx*
*Focus: Enhance 11 existing menus for multi-tenant + versioned config*
*Priority: P0 (Critical) → P1 (High Value) → P2 (Nice to Have)*
*Timeline: 6-8 weeks for full implementation*
