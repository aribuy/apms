# 🎨 UI/UX Enhancement Plan - Multi-Tenant + Versioned Config

**Date:** 2025-12-29
**Status:** Planning Phase
**Current State:** 57 FK constraints deployed, but UI needs enhancement for operational excellence

---

## 🎯 Executive Summary

**Problem:** System sudah multi-tenant (Workspace) + versioned (Config), tapi UI belum mendukung:
- Workspace switching & context
- Config lifecycle management (Draft/Active/Supersede)
- Role-based access control (RBAC)
- Audit & compliance features

**Solution:** Enhance UI dengan **Control Plane** untuk operasional yang aman dan auditable

**Priority:**
- **P0 (Must-have):** 8 features untuk production-ready
- **P1 (High-value):** 12 features untuk operational excellence
- **P2 (Nice-to-have):** 5 features untuk advanced use cases

---

## 📊 Current State Analysis

### ✅ Already Implemented (Backend)

**Database Layer:**
- ✅ Workspaces table (multi-tenant isolation)
- ✅ Config versions (versioned master data)
- ✅ 57 FK constraints (data integrity)
- ✅ Freeze-by-reference (workflow locked to config)
- ✅ Partial unique index (1 ACTIVE per workspace+source_type)

**Missing UI Layer:**
- ❌ Workspace switcher
- ❌ Config lifecycle UI
- ❌ RBAC UI
- ❌ Audit log viewer
- ❌ Master data management UI

**Impact:**
- ⚠️ Admin harus "nyuntik" via DB
- ⚠️ User bingung workspace context
- ⚠️ Sulit audit trail
- ⚠️ Risk salah workspace

---

## 🎨 P0 Features - Must Have for Production

### 1. Workspace Context Bar (P0)

**Location:** Header (always visible)

**Components:**
```
┌─────────────────────────────────────────────────────────┐
│ 🏢 XLSMART-AVIAT ▼  |  Config: v1 (ACTIVE) | [Admin]   │
└─────────────────────────────────────────────────────────┘
```

**Features:**
- **Workspace Switcher Dropdown**
  - Show current workspace
  - List user's workspaces
  - Quick switch between workspaces

- **Active Config Badge**
  - Show config version per source_type
  - Badge: ACTIVE / DRAFT / SUPERSEDED
  - Color-coded:
    - 🟢 Green: ACTIVE
    - 🟡 Yellow: DRAFT exists
    - 🔵 Blue: SUPERSEDED

- **User Role Badge**
  - Show current user's role in workspace
  - Example: [Admin] [Manager] [Approver]

**Backend Requirements:**
```typescript
// API: GET /api/v1/user/context
Response: {
  currentWorkspace: {
    id: string,
    code: string,
    name: string
  },
  userWorkspaces: Array<{id, code, name, role}>,
  activeConfigs: Array<{
    sourceType: string,
    versionNumber: number,
    status: 'ACTIVE' | 'DRAFT' | 'SUPERSEDED'
  }>,
  userRole: string
}
```

**Frontend Implementation:**
```typescript
// components/WorkspaceContextBar.tsx
interface WorkspaceContext {
  currentWorkspace: Workspace;
  userWorkspaces: Workspace[];
  activeConfigs: ConfigInfo[];
  userRole: string;
  switchWorkspace: (workspaceId: string) => Promise<void>;
}

export function WorkspaceContextBar() {
  const { currentWorkspace, activeConfigs, userRole } = useWorkspaceContext();

  return (
    <header className="workspace-context-bar">
      <WorkspaceSwitcher
        current={currentWorkspace}
        onChange={switchWorkspace}
      />
      <ConfigBadger configs={activeConfigs} />
      <RoleBadge role={userRole} />
    </header>
  );
}
```

---

### 2. Workspace Membership & RBAC (P0)

**Location:** Administration → Workspaces → Members

**Features:**
- **Add Member to Workspace**
  - Select user (dropdown/search)
  - Select role (Admin/Manager/Approver/Vendor/User)
  - Set default workspace

- **Manage Members**
  - List members per workspace
  - Change role
  - Remove from workspace
  - Set as default workspace

- **Roles & Permissions**
  - Admin: Full access to workspace
  - Manager: Can manage config + master data
  - Approver: Can approve workflows
  - Vendor: Read-only + create submissions
  - User: Read-only

**Backend Requirements:**
```sql
-- Table: workspace_members (CREATE if not exists)
CREATE TABLE workspace_members (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id),
  user_id TEXT NOT NULL REFERENCES users(id),
  role VARCHAR(50) NOT NULL, -- 'ADMIN' | 'MANAGER' | 'APPROVER' | 'VENDOR' | 'USER'
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(workspace_id, user_id)
);
```

**UI Components:**
```typescript
// components/Administration/WorkspaceMembers.tsx
export function WorkspaceMembers({ workspaceId }: Props) {
  const { members, addMember, removeMember, updateRole } = useWorkspaceMembers(workspaceId);

  return (
    <div>
      <MemberList
        members={members}
        onRemove={removeMember}
        onRoleChange={updateRole}
      />
      <AddMemberForm
        onAdd={addMember}
        availableRoles={['ADMIN', 'MANAGER', 'APPROVER', 'VENDOR', 'USER']}
      />
    </div>
  );
}
```

---

### 3. Config Versions Control Plane (P0)

**Location:** Administration → Config Versions

**Features:**

#### A. Config Version List
- Filter by workspace
- Filter by source_type
- Show status (ACTIVE/DRAFT/SUPERSEDED)
- Show version_number
- Show created_at
- Show created_by

**Display:**
```
┌──────────────────────────────────────────────────────────┐
│ Config Versions - XLSMART-AVIAT                          │
├──────────────────────────────────────────────────────────┤
│ Filter: [Source Type ▼] [Status ▼]                       │
├──────────────────────────────────────────────────────────┤
│ Ver | Status    | Source Type  | Created    | Actions   │
│─────┼───────────┼──────────────┼────────────┼───────────┤
│ v1  | 🟢 ACTIVE | SCOPE_CONFIG | 2025-12-29│ [View]    │
│ v2  | 🟡 DRAFT  | SCOPE_CONFIG | 2025-12-29│ [Activate]│
│ v1  | 🔵 SUPER  | APPROVAL     | 2025-12-28│ [View]    │
└──────────────────────────────────────────────────────────┘
```

#### B. Config Actions

**Create Draft:**
```typescript
// Button: "Import Config" / "Create Draft Version"
function CreateConfigDraft() {
  // 1. Upload file (xlsx/csv)
  // 2. Validate & preview
  // 3. Create DRAFT config_version
  // 4. Redirect to config detail
}
```

**Activate Config:**
```typescript
// Button: "Activate" (only for DRAFT status)
function ActivateConfig(configVersionId: string) {
  // Guardrails:
  // 1. Check if ACTIVE exists for this workspace+source_type
  // 2. Show confirmation dialog
  // 3. Display summary of changes
  // 4. Confirm → Activate (SUPERSEDE old ACTIVE)
  // 5. Success message
}
```

**Supersede (Automatic):**
- When activating v2 (DRAFT) → v1 (ACTIVE) becomes SUPERSEDED automatically
- No manual action needed

**View Config:**
- Show config data in read-only table
- Show which master tables affected
- Show validation status

**Backend Requirements:**
```typescript
// API Routes needed:

// GET /api/v1/config-versions?workspaceId=xxx&sourceType=xxx
// Returns: List of config versions

// POST /api/v1/config-versions
// Body: { workspaceId, sourceType, sourceFile, importedBy }
// Creates: DRAFT config version

// POST /api/v1/config-versions/:id/activate
// Action:
//   1. Validate config
//   2. SUPERSEDE current ACTIVE (if exists)
//   3. Set new config to ACTIVE
//   4. Create audit log

// GET /api/v1/config-versions/:id/diff/:compareWithId
// Returns: Diff between 2 versions
```

**UI Components:**
```typescript
// components/Administration/ConfigVersions.tsx
export function ConfigVersionsList() {
  const { workspaceId } = useWorkspaceContext();
  const { configs, activate, createDraft } = useConfigVersions({ workspaceId });

  return (
    <div>
      <ConfigFilter />
      <ConfigTable
        configs={configs}
        onActivate={activate}
        onCreateDraft={createDraft}
      />
    </div>
  );
}

// components/Administration/ActivateConfigDialog.tsx
export function ActivateConfigDialog({ config }: Props) {
  const { diff, activeConfig } = useConfigDiff(config.id);

  return (
    <Dialog>
      <h2>Activate Config v{config.versionNumber}?</h2>

      <Alert severity="warning">
        This will supersede current active config v{activeConfig?.versionNumber}
      </Alert>

      <ConfigDiffSummary diff={diff} />

      <Actions>
        <Button onClick={cancel}>Cancel</Button>
        <Button onClick={confirmActivate}>Activate</Button>
      </Actions>
    </Dialog>
  );
}
```

---

### 4. Master Data Hub (P0)

**Location:** Administration → Master Data

**Features:**

#### A. Master Data Selector
```
┌─────────────────────────────────────────────┐
│ Master Data Hub                              │
├─────────────────────────────────────────────┤
│ Select Entity:                               │
│ [ ▼ ATP Scope Master ]                       │
│ [Vendor Master]                              │
│ [Approval Role Master]                       │
│ [Approval Policy Master]                     │
│ [Cluster Master]                             │
└─────────────────────────────────────────────┘
```

#### B. Data Display
- **Default View:** Show ACTIVE config only
- **Toggle:** "Show all versions" / "Active only"
- **Filter:** Search, status, created date

**Display:**
```
┌──────────────────────────────────────────────────────────┐
│ ATP Scope Master - Active Config v1                       │
├──────────────────────────────────────────────────────────┤
│ [🔄 Config: v1 (ACTIVE) ▼] [☰ Show All] [➕ New]       │
├──────────────────────────────────────────────────────────┤
│ Scope Code  | Scope Name      | Category | Type    | Act │
│─────────────┼─────────────────┼──────────┼─────────┼─────┤
│ HW-001      | Tower A HW      | HARDWARE  | BOTH    │ ✅  │
│ HW-002      | Tower B HW      | HARDWARE  | BOTH    │ ✅  │
│ SW-001      | Software Install| SOFTWARE  | SOFTWARE│ ✅  │
└──────────────────────────────────────────────────────────┘
```

#### C. CRUD Operations

**Create/Edit:**
```typescript
// Form injects workspace_id and config_version_id automatically
function MasterDataForm({ entity, mode }: Props) {
  const { workspaceId, activeConfig } = useWorkspaceContext();

  const initialValues = {
    workspaceId, // ✅ Auto-injected from context
    configVersionId: activeConfig.id, // ✅ Auto-injected
    ...entity
  };

  return (
    <Form initialValues={initialValues}>
      {/* Only show editable fields */}
      <FormField name="scopeCode" label="Scope Code" />
      <FormField name="scopeName" label="Scope Name" />
      <FormField name="category" label="Category" />
      {/* workspace_id and config_version_id HIDDEN */}
    </Form>
  );
}
```

**Delete:**
```typescript
// Check if referenced by workflow before delete
async function deleteMasterData(id: string, entity: string) {
  // 1. Check references in workflow_instances
  const references = await checkReferences(entity, id);

  if (references.length > 0) {
    showWarning(
      `Cannot delete: Referenced by ${references.length} workflows. ` +
      `Consider soft-delete or archiving instead.`
    );
    return;
  }

  // 2. Confirm delete
  if (confirm('Are you sure you want to delete this record?')) {
    await api.delete(`/${entity}/${id}`);
  }
}
```

**Backend Requirements:**
```typescript
// Generic CRUD API for master data
// GET /api/v1/master-data/:entity?configVersionId=xxx
// POST /api/v1/master-data/:entity
// PUT /api/v1/master-data/:entity/:id
// DELETE /api/v1/master-data/:entity/:id (with reference check)
```

---

### 5. Work Queue / Inbox (P0)

**Location:** Operations → My Inbox

**Features:**
- **My Pending Approvals**
  - Show workflows awaiting user's approval
  - Filter by status, priority, site, overdue
  - Sort by due date, priority

**Display:**
```
┌────────────────────────────────────────────────────────────┐
│ 📥 My Inbox - Pending Approvals (3)                       │
├────────────────────────────────────────────────────────────┤
│ Filters: [Overdue] [By Site ▼] [Priority ▼]              │
├────────────────────────────────────────────────────────────┤
│ Workflow          | Site     | Stage | Due       | Actions │
│───────────────────┼─────────┼───────┼───────────┼─────────│
│ ATP-Tower-A-HW    | Tower A │ 2/3   | Overdue!  │ [Approve│
│ ATP-Tower-B-Soft  | Tower B │ 1/2   | Tomorrow  │ [View]  │
│ Punchlist-P1      | Tower C │ 3/3   | 2 days    │ [Review]│
└────────────────────────────────────────────────────────────┘
```

**Actions:**
- **Approve** → Move to next stage
- **Reject** → Return to previous stage / request changes
- **View** → See full workflow details
- **Delegate** → Assign to different approver

---

### 6. Workflow Instance Detail (P0)

**Location:** Operations → Workflows → [Click Workflow]

**Features:**

#### A. Workflow Timeline
```
┌────────────────────────────────────────────────────────────┐
│ Workflow: ATP-Tower-A-HW                                   │
│ Site: Tower A | Scope: HW-001                              │
│ Status: IN_PROGRESS | Stage: 2/3                           │
├────────────────────────────────────────────────────────────┤
│ Timeline:                                                  │
│                                                            │
│  ✅ Stage 1: Site Registration                             │
│     Approver: John Doe | Completed: 2025-12-28             │
│                                                            │
│  ⏳ Stage 2: Technical Review (CURRENT)                   │
│     Approver: Jane Smith | Due: 2025-12-30                │
│     [Approve] [Reject] [Delegate]                          │
│                                                            │
│  ⏸ Stage 3: Final Approval                                │
│     Approver: Bob Johnson                                  │
└────────────────────────────────────────────────────────────┘
```

#### B. Attachments & Documents
- List ATP submission documents
- Download/view attachments
- Upload additional documents

#### C. Punchlist (if applicable)
- Linked punchlist items
- Status per item
- Add new punchlist items

---

### 7. Audit Logs Viewer (P0)

**Location:** Administration → Audit Logs

**Features:**
- **Filterable Logs:**
  - Workspace
  - Entity (config_version, workflow_instance, etc.)
  - Action (CREATE, UPDATE, DELETE, ACTIVATE, APPROVE, etc.)
  - User
  - Date range

- **Export:** CSV/PDF

**Display:**
```
┌────────────────────────────────────────────────────────────┐
│ Audit Logs                                                 │
├────────────────────────────────────────────────────────────┤
│ Filters: [Workspace ▼] [Entity ▼] [Action ▼] [Date ▼]    │
│ [📥 Export]                                               │
├────────────────────────────────────────────────────────────┤
│ Time               | User    | Action    | Entity     | Detail│
│────────────────────┼─────────┼───────────┼────────────┼───────│
│ 2025-12-29 10:00   | admin   | ACTIVATE  | Config v2  | ✅    │
│ 2025-12-29 09:30   | jane.d  | APPROVE   | Workflow 12 │ ✅    │
│ 2025-12-29 09:00   | john.d  | CREATE    | Workspace  │ ✅    │
│ 2025-12-28 16:00   | admin   | DELETE    | Scope-001  | ⚠️    │
└────────────────────────────────────────────────────────────┘
```

**Backend Requirements:**
```sql
-- Table: audit_logs
CREATE TABLE audit_logs (
  id BIGSERIAL PRIMARY KEY,
  workspace_id TEXT REFERENCES workspaces(id),
  user_id TEXT REFERENCES users(id),
  entity_type VARCHAR(100), -- 'config_version', 'workflow_instance', etc.
  entity_id TEXT,
  action VARCHAR(50), -- 'CREATE', 'UPDATE', 'DELETE', 'ACTIVATE', 'APPROVE'
  details JSONB,
  ip_address INET,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_workspace ON audit_logs(workspace_id, created_at DESC);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id, created_at DESC);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
```

---

### 8. Environment Banner (P0)

**Location:** Top of page (always visible)

**Purpose:** Prevent accidental actions in wrong environment

**Display:**
```
┌─────────────────────────────────────────────────────────────┐
│ 🔴 PRODUCTION | apms.datacodesolution.com | v1.2.3        │
└─────────────────────────────────────────────────────────────┘
```

**Staging:**
```
┌─────────────────────────────────────────────────────────────┐
│ 🟡 STAGING | apmsstaging.datacodesolution.com | v1.2.3     │
└─────────────────────────────────────────────────────────────┘
```

**Implementation:**
```typescript
// components/EnvironmentBanner.tsx
export function EnvironmentBanner() {
  const isProd = window.location.hostname === 'apms.datacodesolution.com';
  const isStaging = window.location.hostname === 'apmsstaging.datacodesolution.com';

  if (isProd) {
    return (
      <div className="env-banner production">
        🔴 PRODUCTION | {window.location.hostname} | {appVersion}
      </div>
    );
  }

  if (isStaging) {
    return (
      <div className="env-banner staging">
        🟡 STAGING | {window.location.hostname} | {appVersion}
      </div>
    );
  }

  return (
    <div className="env-banner development">
      🔵 DEV | {window.location.hostname} | {appVersion}
    </div>
  );
}
```

---

## 🚀 P1 Features - High ROI (Next Sprint)

### 9. Config Import Center (P1)

**Location:** Administration → Config Import

**Features:**
- **File Upload:** Drag & drop xlsx/csv
- **Mapping Preview:** Map columns to schema
- **Validation Report:** Pre-check before import
- **Dry Run Mode:** Test without committing
- **Import:** Create DRAFT config

**Flow:**
```
Upload File → Map Columns → Validate → Preview → Import (as DRAFT)
```

---

### 10. Diff Viewer (P1)

**Location:** Config Versions → Compare

**Features:**
- Select 2 versions to compare
- Show summary: Added, Removed, Changed
- Highlight differences
- Export diff report

---

### 11. Delegation & Overrides (P1)

**Location:** Operations → Delegations

**Features:**
- **Temporary Delegation:** Assign approver during leave
- **Approver Overrides:** Add alternate approver for specific workflow
- **Delegation History:** Audit trail

---

### 12. Data Integrity Dashboard (P1)

**Location:** Administration → Data Integrity

**Features:**
- **Orphan Check:** Show orphaned records (should be 0)
- **FK Violations:** Attempts that failed (from logs)
- **Validation Failures:** Top failing validations
- **Health Score:** Overall data integrity percentage

---

### 13. Bulk Tools (P1)

**Location:** Administration → Bulk Operations

**Features:**
- **Bulk Import:** Import master data from CSV
- **Bulk Export:** Export to CSV/Excel
- **Bulk Update:** Update multiple records with validation

---

### 14. Background Jobs Monitoring (P1)

**Location:** Administration → Jobs

**Features:**
- **Job List:** Show scheduled jobs
- **Job Status:** Success/Failure/Running
- **Job History:** Last run, next run
- **Retry Failed Jobs:** Manual retry

---

### 15. Error & Performance Dashboard (P1)

**Location:** Administration → Monitoring

**Features:**
- **API Latency:** Per endpoint
- **DB Slow Queries:** Top N slowest
- **Error Trend:** 5xx errors over time
- **Request Rate:** RPS graph

---

### 16. Soft Delete / Archive (P1)

**Location:** Master Data (global)

**Features:**
- **Soft Delete:** Mark as deleted instead of actual delete
- **Archive Policy:** Auto-archive old data
- **Restore:** Restore soft-deleted records

---

### 17. Maintenance Mode (P1)

**Location:** Administration → Settings

**Features:**
- **Toggle Read-Only:** Disable writes during deploy
- **Maintenance Message:** Show banner to users
- **Schedule Maintenance:** Set maintenance window

---

### 18. Sandbox Seeder (P1)

**Location:** Staging only (admin only)

**Features:**
- **Seed Demo Data:** Button to create sample data
- **Reset Workspace:** Clean workspace and reseed
- **Consistent QA:** Reproducible test data

---

### 19. Config Approval Workflow (P1)

**Location:** Config Versions → Approval

**Features:**
- **Draft Config:** Requires approval before activate
- **Approver List:** Per workspace
- **Approval Flow:** Similar to workflow approval
- **Approval History:** Audit trail

---

### 20. Permission Matrix UI (P1)

**Location:** Administration → Roles & Permissions

**Features:**
- **Role Definition:** Define custom roles
- **Permission Matrix:** Role → capabilities mapping
- **Per-Module Permissions:** Fine-grained control

---

## 📐 Recommended Menu Structure

```
Sidebar (based on role)

Administration (Admin/Manager only)
├─ Workspaces
│  ├─ List Workspaces
│  ├─ Create Workspace
│  └─ Workspace Settings
├─ Users & Roles
│  ├─ User Management
│  ├─ Roles & Permissions
│  └─ Memberships
├─ Config Versions
│  ├─ Config List
│  ├─ Import Center
│  ├─ Diff Viewer
│  └─ Approval Queue
├─ Master Data Hub
│  ├─ ATP Scope
│  ├─ Vendor
│  ├─ Approval Roles
│  ├─ Approval Policies
│  ├─ Clusters
│  └─ Bulk Operations
├─ Monitoring
│  ├─ Audit Logs
│  ├─ Data Integrity
│  ├─ Jobs & Scheduler
│  └─ Performance
└─ Settings
   ├─ Maintenance Mode
   └─ System Config

Operations (All roles)
├─ My Inbox
│  ├─ Pending Approvals
│  ├─ Overdue
│  └─ Delegations
├─ Workflows
│  ├─ All Workflows
│  ├─ My Workflows
│  └─ Workflow Detail
├─ ATP Submissions
│  ├─ All Submissions
│  ├─ My Submissions
│  └─ Submission Detail
├─ Punchlists
│  ├─ All Punchlists
│  └─ Punchlist Detail
└─ Reports
   ├─ Workflow Status
   ├─ Approval Metrics
   └─ Export Data

Header (always visible)
├─ Workspace Switcher
├─ Config Badge (Active/Draft)
├─ Role Badge
├─ User Profile
└─ Environment Banner
```

---

## 🛡️ Guardrails UI (Critical)

### 1. Workspace Context Required

**Rule:** Almost all pages require workspace context

**Implementation:**
```typescript
// Route guard
function requireWorkspace() {
  const { currentWorkspace } = useWorkspaceContext();

  if (!currentWorkspace) {
    return <Redirect to="/select-workspace" />;
  }

  return <Outlet />;
}

// Usage in routing
<Route element={<RequireWorkspace />}>
  <Route path="/workflows" element={<WorkflowList />} />
  <Route path="/atp-submissions" element={<ATPSubmissions />} />
</Route>
```

### 2. Auto-inject workspace_id

**Rule:** All create/update forms auto-inject workspace_id from context

**Implementation:**
```typescript
// Generic form wrapper
function WorkspaceAwareForm({ entity, onSubmit }: Props) {
  const { currentWorkspace, activeConfig } = useWorkspaceContext();

  const handleSubmit = (values: any) => {
    // Auto-inject workspace context
    const dataWithWorkspace = {
      ...values,
      workspaceId: currentWorkspace.id,
      configVersionId: activeConfig.id
    };

    onSubmit(dataWithWorkspace);
  };

  return <Form onSubmit={handleSubmit}>{/* ... */}</Form>;
}
```

### 3. Activate Config Confirmation

**Rule:** Show clear confirmation before activating config

**Implementation:**
```typescript
function ActivateConfigButton({ config }: Props) {
  const handleClick = () => {
    // Check if ACTIVE config exists
    const activeConfig = configs.find(c =>
      c.workspaceId === config.workspaceId &&
      c.sourceType === config.sourceType &&
      c.status === 'ACTIVE'
    );

    // Show confirmation dialog
    showConfirmDialog({
      title: `Activate Config v${config.versionNumber}?`,
      message: activeConfig
        ? `This will supersede config v${activeConfig.versionNumber}`
        : 'This will become the active config',
      severity: 'warning',
      onConfirm: () => activateConfig(config.id)
    });
  };

  return <Button onClick={handleClick}>Activate</Button>;
}
```

### 4. Delete Protection

**Rule:** Prevent delete if referenced by workflow

**Implementation:**
```typescript
async function deleteMasterData(id: string, entity: string) {
  // Check references
  const references = await api.checkReferences(entity, id);

  if (references.length > 0) {
    // Show user-friendly error
    showErrorDialog({
      title: 'Cannot Delete',
      message: `This record is referenced by ${references.length} workflow(s)`,
      details: references.map(r => `• ${r.workflowId} (${r.site})`),
      suggestion: 'Consider archiving instead of deleting'
    });
    return;
  }

  // Proceed with delete
  await api.delete(`/${entity}/${id}`);
}
```

---

## 📊 Implementation Roadmap

### Sprint 1 (2-3 weeks) - P0 Features

**Week 1:**
- [ ] Workspace context bar (switcher + badge)
- [ ] Workspace membership + RBAC
- [ ] Environment banner

**Week 2:**
- [ ] Config versions CRUD + activate
- [ ] Master data hub (basic)
- [ ] My inbox (approvals)

**Week 3:**
- [ ] Workflow detail page
- [ ] Audit logs viewer
- [ ] Testing & bug fixes

### Sprint 2 (2-3 weeks) - P1 Features

**Week 4:**
- [ ] Config import center
- [ ] Diff viewer
- [ ] Delegation UI

**Week 5:**
- [ ] Data integrity dashboard
- [ ] Bulk tools
- [ ] Background jobs monitoring

**Week 6:**
- [ ] Error & performance dashboard
- [ ] Soft delete/archive
- [ ] Sandbox seeder

---

## 🎯 Success Criteria

### Must Have (P0)

- [ ] User can switch workspaces from UI
- [ ] User can only see data from current workspace
- [ ] Admin can manage config versions (Draft/Activate/Supersede)
- [ ] Admin can manage master data from UI
- [ ] Approvers can see pending approvals in Inbox
- [ ] All actions are logged in audit trail
- [ ] Environment is clearly identified (banner)

### Should Have (P1)

- [ ] Admin can import config from file
- [ ] Admin can see diff between config versions
- [ ] Admin can delegate approvers
- [ ] Data integrity dashboard shows health
- [ ] Bulk operations available
- [ ] Background jobs visible

---

## 📝 Summary

**P0 Features (8):** Minimum untuk production-ready
1. Workspace context bar
2. Workspace membership & RBAC
3. Config versions control plane
4. Master data hub
5. Work queue / inbox
6. Workflow detail
7. Audit logs viewer
8. Environment banner

**P1 Features (12):** High-value additions
9. Config import center
10. Diff viewer
11. Delegation UI
12. Data integrity dashboard
13. Bulk tools
14. Jobs monitoring
15. Performance dashboard
16. Soft delete/archive
17. Maintenance mode
18. Sandbox seeder
19. Config approval workflow
20. Permission matrix UI

**Total:** 20 features across 2 sprints (6-8 weeks)

---

*Plan Created: 2025-12-29*
*Purpose: UI/UX Enhancement for Multi-Tenant + Versioned Config*
*Priority: P0 (Must-have) first, then P1 (High-value)*
*Timeline: 6-8 weeks for full implementation*
