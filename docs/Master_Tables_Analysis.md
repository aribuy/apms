# Master Tables Analysis & Implementation Plan

**Date:** 2025-12-29
**Status:** 📋 Analysis Phase
**Priority:** HIGH
**Environment:** Staging → Production

---

## Executive Summary

This document analyzes the proposed **Master Tables** for the APMS ATP workflow approval system. These master tables will enable flexible, configurable approval workflows based on:

- **ATP Scope** (MW/RAN/PLN Upgrade/Dismantle/etc)
- **Vendor** (ZTE, Huawei, Ericsson, Nokia, etc)
- **Role** (SME, NOC Head, RTH Head, etc)
- **Region/Cluster** (East Java, West Java, Central Java, etc)
- **Stage Number** (multi-stage approval workflow)

---

## Current State Assessment

### Existing Tables

| Table | Purpose | Status | Notes |
|-------|---------|--------|-------|
| `users` | User management | ✅ Exists | Has `role` field but not normalized |
| `roles` | Role definitions | ✅ Exists | Has `group` (UserType) and `level` (AccessLevel) |
| `sites` | Site registrations | ✅ Exists | Has `scope` field (default: 'MW') |
| `tasks` | Task management | ✅ Exists | Has `task_type`, `assigned_role` |
| `atp_review_stages` | ATP review workflow | ✅ Exists | Basic stage tracking |

### Missing Master Tables

| Table | Priority | Impact |
|-------|----------|--------|
| `atp_scope_master` | HIGH | No centralized scope definitions |
| `approval_role_master` | HIGH | No role-based approval rules |
| `approval_matrix` | CRITICAL | No workflow configuration |
| `region_cluster_approver` | MEDIUM | Region-based approver mapping |

---

## Proposed Master Tables

### 1. ATP Scope Master

**Purpose:** Centralized definition of all ATP scopes/projects

**Table Name:** `atp_scope_master`

**Schema:**
```sql
CREATE TABLE atp_scope_master (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,           -- MW, RAN, PLN, etc
  name VARCHAR(150) NOT NULL,                 -- Microwave, RAN, Power Line, etc
  category VARCHAR(50),                        -- Upgrade, Dismantle, New, etc
  description TEXT,
  atp_type VARCHAR(20) DEFAULT 'BOTH',        -- HARDWARE, SOFTWARE, BOTH
  default_workflow_stage VARCHAR(50) DEFAULT 'REGISTERED',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by TEXT REFERENCES users(id),
  updated_by TEXT REFERENCES users(id)
);

-- Indexes
CREATE INDEX idx_atp_scope_code ON atp_scope_master(code);
CREATE INDEX idx_atp_scope_category ON atp_scope_master(category);
CREATE INDEX idx_atp_scope_active ON atp_scope_master(is_active);

-- Sample Data
INSERT INTO atp_scope_master (code, name, category, atp_type) VALUES
('MW', 'Microwave', 'Upgrade', 'BOTH'),
('MW-NEW', 'Microwave New', 'New Installation', 'BOTH'),
('MW-DISM', 'Microwave Dismantle', 'Dismantle', 'HARDWARE'),
('RAN', 'RAN', 'Upgrade', 'BOTH'),
('RAN-NEW', 'RAN New', 'New Installation', 'BOTH'),
('PLN', 'Power Line Network', 'Upgrade', 'HARDWARE'),
('PLN-NEW', 'Power Line New', 'New Installation', 'HARDWARE'),
('TX', 'Transmission', 'Upgrade', 'BOTH'),
('ANT', 'Antenna', 'Upgrade', 'HARDWARE');
```

**Relationships:**
- `sites.scope` → `atp_scope_master.code` (FOREIGN KEY to be added)
- `tasks.task_data` → JSON reference to scope

**Benefits:**
- ✅ Centralized scope management
- ✅ Consistent scope codes across system
- ✅ Easy to add new scopes
- ✅ Category-based filtering

---

### 2. Approval Role Master

**Purpose:** Define all approval roles and their hierarchy

**Table Name:** `approval_role_master`

**Schema:**
```sql
CREATE TABLE approval_role_master (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,           -- SME, NOC_HEAD, RTH_HEAD, etc
  name VARCHAR(150) NOT NULL,                 -- Subject Matter Expert, NOC Head, etc
  description TEXT,
  level INTEGER NOT NULL,                      -- Approval hierarchy level (1=lowest, 10=highest)
  UserType "UserType" NOT NULL,                -- ENUM: 'VENDOR', 'CUSTOMER', 'ADMIN'
  is_approver BOOLEAN DEFAULT false,           -- Can this role approve ATP?
  can_submit BOOLEAN DEFAULT true,             -- Can this role submit ATP?
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by TEXT REFERENCES users(id),
  updated_by TEXT REFERENCES users(id)
);

-- Indexes
CREATE INDEX idx_approval_role_code ON approval_role_master(code);
CREATE INDEX idx_approval_role_level ON approval_role_master(level);
CREATE INDEX idx_approval_role_type ON approval_role_master("UserType");

-- Sample Data
INSERT INTO approval_role_master (code, name, level, "UserType", is_approver) VALUES
('SME', 'Subject Matter Expert', 1, 'VENDOR', true),
('SME_TEAM', 'SME Team Lead', 2, 'VENDOR', true),
('NOC_HEAD', 'NOC Head', 3, 'CUSTOMER', true),
('FOP_RTS', 'FOP RTS', 4, 'CUSTOMER', true),
('REGION_TEAM', 'Region Team', 5, 'CUSTOMER', true),
('RTH_HEAD', 'RTH Head', 6, 'CUSTOMER', true),
('DOC_CONTROL', 'Document Control', 1, 'CUSTOMER', false),
('BUSINESS_OPS', 'Business Operations', 2, 'CUSTOMER', true),
('PROJECT_MGR', 'Project Manager', 7, 'CUSTOMER', true),
('ADMIN', 'Administrator', 10, 'ADMIN', true);
```

**Relationships:**
- `users.role` → `approval_role_master.code` (FOREIGN KEY to be added)
- `tasks.assigned_role` → `approval_role_master.code`

**Benefits:**
- ✅ Clear role hierarchy
- ✅ Type-safe role codes
- ✅ Easy to configure approval levels
- ✅ Separates role definition from user data

---

### 3. Approval Matrix

**Purpose:** Configure multi-stage approval workflow based on scope, vendor, and role

**Table Name:** `approval_matrix`

**Schema:**
```sql
CREATE TABLE approval_matrix (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scope_code VARCHAR(50) NOT NULL,            -- MW, RAN, PLN, etc
  vendor_code VARCHAR(50) NOT NULL,           -- ZTE, HUAWEI, ERICSSON, NOKIA, ALL
  role_code VARCHAR(50) NOT NULL,             -- SME, NOC_HEAD, RTH_HEAD, etc
  stage_number INTEGER NOT NULL,               -- 1, 2, 3, 4, 5 (approval sequence)
  stage_name VARCHAR(100) NOT NULL,           -- "SME Review", "NOC Approval", etc
  is_required BOOLEAN DEFAULT true,            -- Must this stage be completed?
  can_parallel BOOLEAN DEFAULT false,          -- Can run in parallel with same stage_number?
  auto_assign BOOLEAN DEFAULT false,           -- Auto-assign to users with this role?
  sla_hours INTEGER,                           -- SLA in hours for this stage
  notification_on_assign BOOLEAN DEFAULT true,
  notification_on_approve BOOLEAN DEFAULT true,
  notification_on_reject BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by TEXT REFERENCES users(id),
  updated_by TEXT REFERENCES users(id),

  -- Foreign Keys
  CONSTRAINT fk_approval_matrix_scope
    FOREIGN KEY (scope_code) REFERENCES atp_scope_master(code),
  CONSTRAINT fk_approval_matrix_role
    FOREIGN KEY (role_code) REFERENCES approval_role_master(code)
);

-- Composite Index for efficient workflow lookup
CREATE INDEX idx_approval_matrix_workflow
  ON approval_matrix(scope_code, vendor_code, stage_number, is_active);

-- Unique constraint to prevent duplicate workflow stages
CREATE UNIQUE INDEX idx_approval_matrix_unique
  ON approval_matrix(scope_code, vendor_code, role_code, stage_number)
  WHERE is_active = true;

-- Sample Data: MW Upgrade - ZTE Vendor
INSERT INTO approval_matrix (scope_code, vendor_code, role_code, stage_number, stage_name, sla_hours) VALUES
-- Stage 1: SME Review (Vendor)
('MW', 'ZTE', 'SME', 1, 'SME Technical Review', 24),
('MW', 'ZTE', 'SME_TEAM', 1, 'SME Team Lead Review', 24),

-- Stage 2: Document Control Review
('MW', 'ZTE', 'DOC_CONTROL', 2, 'Document Control Check', 8),

-- Stage 3: NOC Head Approval (Customer)
('MW', 'ZTE', 'NOC_HEAD', 3, 'NOC Head Approval', 48),

-- Stage 4: Regional Team Approval
('MW', 'ZTE', 'REGION_TEAM', 4, 'Regional Team Approval', 48),

-- Stage 5: RTH Final Approval
('MW', 'ZTE', 'RTH_HEAD', 5, 'RTH Final Approval', 72);

-- Sample Data: MW Upgrade - ALL Vendors (default)
INSERT INTO approval_matrix (scope_code, vendor_code, role_code, stage_number, stage_name, sla_hours) VALUES
('MW', 'ALL', 'SME', 1, 'SME Technical Review', 24),
('MW', 'ALL', 'DOC_CONTROL', 2, 'Document Control Check', 8),
('MW', 'ALL', 'NOC_HEAD', 3, 'NOC Head Approval', 48),
('MW', 'ALL', 'RTH_HEAD', 4, 'RTH Final Approval', 72);
```

**Business Rules:**

1. **Workflow Lookup Logic:**
   ```sql
   -- First: Try to find exact match (scope + vendor)
   SELECT * FROM approval_matrix
   WHERE scope_code = 'MW'
     AND vendor_code = 'ZTE'
     AND is_active = true
   ORDER BY stage_number;

   -- Fallback: Use vendor = 'ALL'
   SELECT * FROM approval_matrix
   WHERE scope_code = 'MW'
     AND vendor_code = 'ALL'
     AND is_active = true
   ORDER BY stage_number;
   ```

2. **Parallel Stages:**
   - Same `stage_number` with `can_parallel = true`
   - Example: Multiple SMEs can review in parallel

3. **Required vs Optional:**
   - `is_required = false`: Stage can be skipped
   - Example: Optional management review

**Benefits:**
- ✅ Flexible workflow configuration
- ✅ Vendor-specific approval rules
- ✅ Easy to add new approval stages
- ✅ SLA tracking per stage
- ✅ Database-driven workflow (no code changes)

---

### 4. Region Cluster Approver

**Purpose:** Map regions/clusters to their approvers

**Table Name:** `region_cluster_approver`

**Schema:**
```sql
CREATE TABLE region_cluster_approver (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  region VARCHAR(100) NOT NULL,               -- East Java, West Java, etc
  cluster VARCHAR(100),                        -- District/cluster within region
  role_code VARCHAR(50) NOT NULL,             -- NOC_HEAD, RTH_HEAD, REGION_TEAM, etc
  user_id TEXT NOT NULL,                      -- Specific approver user ID
  is_primary BOOLEAN DEFAULT false,            -- Primary approver for this region
  is_backup BOOLEAN DEFAULT false,             -- Backup approver
  effective_date DATE DEFAULT CURRENT_DATE,
  expiry_date DATE,                            -- NULL = no expiry
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by TEXT REFERENCES users(id),
  updated_by TEXT REFERENCES users(id),

  -- Foreign Keys
  CONSTRAINT fk_region_approver_role
    FOREIGN KEY (role_code) REFERENCES approval_role_master(code),
  CONSTRAINT fk_region_approver_user
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Indexes
CREATE INDEX idx_region_approver_region
  ON region_cluster_approver(region, is_active);
CREATE INDEX idx_region_approver_cluster
  ON region_cluster_approver(cluster, is_active);
CREATE INDEX idx_region_approver_role
  ON region_cluster_approver(role_code, is_active);

-- Sample Data
INSERT INTO region_cluster_approver (region, cluster, role_code, user_id, is_primary) VALUES
-- East Java
('East Java', 'Surabaya', 'NOC_HEAD', 'noc-east-java-001', true),
('East Java', 'Surabaya', 'REGION_TEAM', 'region-east-001', true),
('East Java', 'Kangean', 'NOC_HEAD', 'noc-east-java-001', true),  -- Same NOC for multiple clusters
('East Java', 'Sumenep', 'REGION_TEAM', 'region-east-002', true),
('East Java', NULL, 'RTH_HEAD', 'rth-east-java-001', true),  -- RTH for entire region

-- West Java
('West Java', 'Bandung', 'NOC_HEAD', 'noc-west-java-001', true),
('West Java', 'Bandung', 'REGION_TEAM', 'region-west-001', true),
('West Java', 'Bekasi', 'NOC_HEAD', 'noc-west-java-002', true),
('West Java', NULL, 'RTH_HEAD', 'rth-west-java-001', true),

-- Central Java
('Central Java', 'Semarang', 'NOC_HEAD', 'noc-central-java-001', true),
('Central Java', NULL, 'RTH_HEAD', 'rth-central-java-001', true);
```

**Benefits:**
- ✅ Region-based approver mapping
- ✅ Cluster-level granularity
- ✅ Primary and backup approvers
- ✅ Effective/expire dates for temporary assignments
- ✅ Auto-assignment of ATP tasks based on site region

---

### 5. Users (Normalized from PIC)

**Purpose:** Enhance existing users table with normalized PIC (Person In Charge) data

**Current Issues:**
- `users.role` is free text, not foreign key
- No direct link to `approval_role_master`
- PIC information scattered across multiple fields

**Proposed Enhancements:**

**Schema Changes:**
```sql
-- Add new column to users table
ALTER TABLE users ADD COLUMN role_code VARCHAR(50);

-- Create foreign key
ALTER TABLE users ADD CONSTRAINT fk_users_role_code
  FOREIGN KEY (role_code) REFERENCES approval_role_master(code);

-- Migrate existing role data
UPDATE users
SET role_code = CASE
  WHEN role = 'SME Team' THEN 'SME'
  WHEN role = 'NOC Head' THEN 'NOC_HEAD'
  WHEN role = 'RTH Head' THEN 'RTH_HEAD'
  WHEN role = 'Document Control' THEN 'DOC_CONTROL'
  WHEN role = 'Business Ops' THEN 'BUSINESS_OPS'
  WHEN role = 'Region Team' THEN 'REGION_TEAM'
  WHEN role = 'FOP RTS' THEN 'FOP_RTS'
  WHEN role = 'admin' THEN 'ADMIN'
  ELSE 'UNKNOWN'
END
WHERE role_code IS NULL;

-- Add index
CREATE INDEX idx_users_role_code ON users(role_code);
CREATE INDEX idx_users_region ON users(region);  -- If users have assigned regions

-- Sample data after normalization
-- Before: users.role = 'NOC Head' (free text)
-- After: users.role_code = 'NOC_HEAD' (foreign key to approval_role_master)
```

**PIC Master Table (Optional Enhancement):**

```sql
-- If more detailed PIC tracking is needed
CREATE TABLE pic_master (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT REFERENCES users(id),
  pic_type VARCHAR(50) NOT NULL,               -- APPROVER, REVIEWER, SUBMITTER, etc
  scope_code VARCHAR(50) REFERENCES atp_scope_master(code),
  region VARCHAR(100),
  cluster VARCHAR(100),
  vendor_code VARCHAR(50),
  is_active BOOLEAN DEFAULT true,
  effective_date DATE DEFAULT CURRENT_DATE,
  expiry_date DATE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Benefits:**
- ✅ Normalized role data
- ✅ Foreign key constraints ensure data integrity
- ✅ Easy to query all users by role
- ✅ Type-safe role assignments
- ✅ PIC (Person In Charge) data centralized

---

## Implementation Plan

### Phase 1: Database Schema Creation (Week 1)

**Priority 1: ATP Scope Master**
```sql
-- File: 01_create_atp_scope_master.sql
CREATE TABLE atp_scope_master (...);
-- Insert sample data
```

**Priority 2: Approval Role Master**
```sql
-- File: 02_create_approval_role_master.sql
CREATE TABLE approval_role_master (...);
-- Insert sample data
```

**Priority 3: Approval Matrix**
```sql
-- File: 03_create_approval_matrix.sql
CREATE TABLE approval_matrix (...);
-- Insert sample workflow data
```

**Priority 4: Region Cluster Approver**
```sql
-- File: 04_create_region_cluster_approver.sql
CREATE TABLE region_cluster_approver (...);
-- Insert sample approvers
```

**Priority 5: Normalize Users**
```sql
-- File: 05_normalize_users.sql
ALTER TABLE users ADD COLUMN role_code VARCHAR(50);
-- Migrate data
-- Create foreign key
```

### Phase 2: Prisma Schema Update (Week 1)

**Update `backend/prisma/schema.prisma`:**

```prisma
model ATPScopeMaster {
  @@map("atp_scope_master")

  id                  String    @id @default(dbgenerated("gen_random_uuid()"))
  code                String    @unique @map("code") @db.VarChar(50)
  name                String    @map("name") @db.VarChar(150)
  category            String?   @map("category") @db.VarChar(50)
  description         String?   @db.Text
  atpType             String    @default("BOTH") @map("atp_type") @db.VarChar(20)
  defaultWorkflowStage String?  @map("default_workflow_stage") @db.VarChar(50)
  isActive            Boolean   @default(true) @map("is_active")
  createdAt           DateTime  @default(now()) @map("created_at")
  updatedAt           DateTime  @updatedAt @map("updated_at")
  createdBy           String?   @map("created_by")
  updatedBy           String?   @map("updated_by")

  approvalMatrix      ApprovalMatrix[]
  sites               Site[]

  @@index([code])
  @@index([category])
  @@index([isActive])
}

model ApprovalRoleMaster {
  @@map("approval_role_master")

  id             String    @id @default(dbgenerated("gen_random_uuid()"))
  code           String    @unique @map("code") @db.VarChar(50)
  name           String    @map("name") @db.VarChar(150)
  description    String?   @db.Text
  level          Int       @map("level")
  userType       String    @map("UserType") @db.VarChar(50)
  isApprover     Boolean   @default(false) @map("is_approver")
  canSubmit      Boolean   @default(true) @map("can_submit")
  isActive       Boolean   @default(true) @map("is_active")
  createdAt      DateTime  @default(now()) @map("created_at")
  updatedAt      DateTime  @updatedAt @map("updated_at")
  createdBy      String?   @map("created_by")
  updatedBy      String?   @map("updated_by")

  approvalMatrix ApprovalMatrix[]
  regionApprovers RegionClusterApprover[]
  users           User[]

  @@index([code])
  @@index([level])
  @@index([userType])
}

model ApprovalMatrix {
  @@map("approval_matrix")

  id                String    @id @default(dbgenerated("gen_random_uuid()"))
  scopeCode         String    @map("scope_code") @db.VarChar(50)
  vendorCode        String    @map("vendor_code") @db.VarChar(50)
  roleCode          String    @map("role_code") @db.VarChar(50)
  stageNumber       Int       @map("stage_number")
  stageName         String    @map("stage_name") @db.VarChar(100)
  isRequired        Boolean   @default(true) @map("is_required")
  canParallel       Boolean   @default(false) @map("can_parallel")
  autoAssign        Boolean   @default(false) @map("auto_assign")
  slaHours          Int?      @map("sla_hours")
  notificationOnAssign Boolean @default(true) @map("notification_on_assign")
  notificationOnApprove Boolean @default(true) @map("notification_on_approve")
  notificationOnReject Boolean @default(true) @map("notification_on_reject")
  isActive          Boolean   @default(true) @map("is_active")
  createdAt         DateTime  @default(now()) @map("created_at")
  updatedAt         DateTime  @updatedAt @map("updated_at")
  createdBy         String?   @map("created_by")
  updatedBy         String?   @map("updated_by")

  scope             ATPScopeMaster @relation(fields: [scopeCode], references: [code])
  role              ApprovalRoleMaster @relation(fields: [roleCode], references: [code])

  @@index([scopeCode, vendorCode, stageNumber, isActive], map: "idx_approval_matrix_workflow")
  @@unique([scopeCode, vendorCode, roleCode, stageNumber], map: "idx_approval_matrix_unique")
}

model RegionClusterApprover {
  @@map("region_cluster_approver")

  id             String    @id @default(dbgenerated("gen_random_uuid()"))
  region         String    @map("region") @db.VarChar(100)
  cluster        String?   @map("cluster") @db.VarChar(100)
  roleCode       String    @map("role_code") @db.VarChar(50)
  userId         String    @map("user_id")
  isPrimary      Boolean   @default(false) @map("is_primary")
  isBackup       Boolean   @default(false) @map("is_backup")
  effectiveDate  DateTime  @default(now()) @map("effective_date") @db.Date
  expiryDate     DateTime? @map("expiry_date") @db.Date
  isActive       Boolean   @default(true) @map("is_active")
  createdAt      DateTime  @default(now()) @map("created_at")
  updatedAt      DateTime  @updatedAt @map("updated_at")
  createdBy      String?   @map("created_by")
  updatedBy      String?   @map("updated_by")

  role           ApprovalRoleMaster @relation(fields: [roleCode], references: [code])

  @@index([region, isActive], map: "idx_region_approver_region")
  @@index([cluster, isActive], map: "idx_region_approver_cluster")
  @@index([roleCode, isActive], map: "idx_region_approver_role")
}

model User {
  // ... existing fields ...
  roleCode       String?   @map("role_code") @db.VarChar(50)
  region         String?   @db.VarChar(100)  // Add if not exists

  role           ApprovalRoleMaster? @relation(fields: [roleCode], references: [code])

  @@index([roleCode], map: "idx_users_role_code")
  @@index([region], map: "idx_users_region")
}
```

### Phase 3: API Routes (Week 2)

**Create Master Data Management APIs:**

```javascript
// backend/src/routes/atpScopeMasterRoutes.js
router.get('/', getAllScopes);
router.post('/', createScope);
router.put('/:code', updateScope);
router.delete('/:code', deleteScope);

// backend/src/routes/approvalRoleMasterRoutes.js
router.get('/', getAllRoles);
router.post('/', createRole);
router.put('/:code', updateRole);

// backend/src/routes/approvalMatrixRoutes.js
router.get('/workflow/:scopeCode/:vendorCode', getWorkflow);
router.post('/', createWorkflowStage);
router.put('/:id', updateWorkflowStage);
router.delete('/:id', deleteWorkflowStage);

// backend/src/routes/regionClusterApproverRoutes.js
router.get('/region/:region', getApproversByRegion);
router.get('/user/:userId', getUserAssignments);
router.post('/', assignApprover);
router.delete('/:id', removeApprover);
```

### Phase 4: Frontend UI (Week 2-3)

**Create Master Data Management Pages:**

```typescript
// frontend/src/components/MasterData/
├── ATPScopeManagement.tsx      // CRUD for ATP scopes
├── ApprovalRoleManagement.tsx  // CRUD for approval roles
├── ApprovalMatrixManagement.tsx // Workflow configuration UI
├── RegionApproverManagement.tsx // Region-approvers mapping
└── index.ts
```

**Features:**
- Data tables with search/filter
- CRUD forms
- Workflow visualizer (stage diagram)
- Bulk import/export (CSV, Excel)

### Phase 5: Integration with ATP Workflow (Week 3-4)

**Update Task Creation Logic:**

```javascript
// backend/src/routes/atpUploadRoutes.js
async function createATPTasks(site, atpDocument) {
  // 1. Determine scope from site
  const scope = await prisma.atpScopeMaster.findUnique({
    where: { code: site.scope }
  });

  // 2. Get vendor (from document or site)
  const vendorCode = atpDocument.vendor || 'ALL';

  // 3. Fetch workflow from approval_matrix
  const workflowStages = await prisma.approvalMatrix.findMany({
    where: {
      scopeCode: site.scope,
      vendorCode: vendorCode,
      isActive: true
    },
    include: {
      role: true,
      scope: true
    },
    orderBy: {
      stageNumber: 'asc'
    }
  });

  // 4. For each workflow stage, create task
  for (const stage of workflowStages) {
    // Find approvers based on role and region
    let assigneeId;

    if (stage.autoAssign) {
      // Auto-assign from region_cluster_approver
      const approver = await prisma.regionClusterApprover.findFirst({
        where: {
          region: site.region,
          roleCode: stage.roleCode,
          isActive: true
        },
        orderBy: {
          isPrimary: 'desc'  // Prefer primary approver
        }
      });
      assigneeId = approver?.userId;
    }

    // Create task
    const task = await prisma.task.create({
      data: {
        taskCode: `${site.scope}-${stage.roleCode}-${site.siteId}-STAGE${stage.stageNumber}`,
        taskType: 'ATP_REVIEW',
        title: stage.stageName,
        description: `${site.scope} ATP Review for ${site.siteName}`,
        assignedTo: assigneeId,
        assignedRole: stage.roleCode,
        siteId: site.id,
        documentId: atpDocument.id,
        workflowType: 'ATP_APPROVAL',
        stageNumber: stage.stageNumber,
        slaDeadline: stage.slaHours ? new Date(Date.now() + stage.slaHours * 60 * 60 * 1000) : null,
        taskData: {
          stageId: stage.id,
          scopeCode: stage.scopeCode,
          vendorCode: stage.vendorCode,
          isRequired: stage.isRequired,
          canParallel: stage.canParallel
        }
      }
    });
  }
}
```

---

## Testing Strategy

### Unit Tests

```javascript
// tests/master-data/atp-scope.test.js
describe('ATP Scope Master', () => {
  test('should create scope', async () => {
    const scope = await createScope({
      code: 'MW',
      name: 'Microwave',
      category: 'Upgrade'
    });
    expect(scope.code).toBe('MW');
  });

  test('should prevent duplicate codes', async () => {
    await expect(createScope({ code: 'MW' }))
      .rejects.toThrow('Unique constraint');
  });
});
```

### Integration Tests

```javascript
// tests/workflow/approval-workflow.test.js
describe('Approval Workflow', () => {
  test('should create workflow stages for ATP', async () => {
    const site = await createSite({ scope: 'MW', region: 'East Java' });
    const workflow = await getWorkflow('MW', 'ZTE');

    expect(workflow).toHaveLength(5);
    expect(workflow[0].stageNumber).toBe(1);
    expect(workflow[0].roleCode).toBe('SME');
  });

  test('should fallback to vendor=ALL if specific not found', async () => {
    const workflow = await getWorkflow('MW', 'UNKNOWN_VENDOR');
    expect(workflow[0].vendorCode).toBe('ALL');
  });
});
```

### End-to-End Tests

```bash
# Manual Test Scenario
1. Login as Document Control
2. Upload ATP document for site JAW-JI-SMP-4240 (MW scope, ZTE vendor)
3. Verify tasks created:
   - Task 1: SME Review (Stage 1)
   - Task 2: Document Control Check (Stage 2)
   - Task 3: NOC Head Approval (Stage 3)
   - Task 4: Regional Team Approval (Stage 4)
   - Task 5: RTH Final Approval (Stage 5)
4. Login as SME (East Java region)
5. Verify task assigned correctly
6. Approve task
7. Verify next task created/approver notified
```

---

## Migration Strategy

### From Current System

**Phase 1: Add Master Tables (Non-Breaking)**
- Create new tables alongside existing
- Populate with initial data
- No changes to existing workflows

**Phase 2: Migrate Existing Data**
```sql
-- Migrate existing scopes from sites table
INSERT INTO atp_scope_master (code, name)
SELECT DISTINCT scope, scope
FROM sites
WHERE scope IS NOT NULL
ON CONFLICT (code) DO NOTHING;

-- Migrate existing roles from users table
INSERT INTO approval_role_master (code, name, level, "UserType")
SELECT DISTINCT
  role,
  role,
  CASE
    WHEN role = 'admin' THEN 10
    WHEN role LIKE '%Head%' THEN 6
    WHEN role LIKE '%Team%' THEN 5
    WHEN role = 'SME Team' THEN 2
    ELSE 1
  END,
  CASE
    WHEN role = 'admin' THEN 'ADMIN'
    WHEN email LIKE '%vendor%' OR email LIKE '%zte%' OR email LIKE '%huawei%' THEN 'VENDOR'
    ELSE 'CUSTOMER'
  END
FROM users
WHERE role IS NOT NULL
ON CONFLICT (code) DO NOTHING;
```

**Phase 3: Update Foreign Keys**
```sql
-- Add foreign key to sites.scope
ALTER TABLE sites
ADD CONSTRAINT fk_sites_scope
FOREIGN KEY (scope) REFERENCES atp_scope_master(code);

-- Add foreign key to users.role_code
ALTER TABLE users
ADD CONSTRAINT fk_users_role_code
FOREIGN KEY (role_code) REFERENCES approval_role_master(code);
```

**Phase 4: Update Application Code**
- Update Prisma schema
- Update API routes to use master tables
- Update frontend to display master data

---

## Benefits Summary

### Operational Benefits

1. **Flexibility**
   - Add new ATP scopes without code changes
   - Configure workflows per vendor
   - Adjust approval stages dynamically

2. **Scalability**
   - Support multiple vendors easily
   - Add new regions/clusters
   - Scale approvers across projects

3. **Maintainability**
   - Centralized master data management
   - Database-driven configuration
   - No deployment needed for workflow changes

4. **Compliance**
   - Audit trail for all approvals
   - SLA tracking per stage
   - Role-based access control

### Technical Benefits

1. **Data Integrity**
   - Foreign key constraints
   - Type-safe enums
   - Prevent orphaned records

2. **Performance**
   - Indexed lookups
   - Efficient workflow queries
   - Optimized joins

3. **Developer Experience**
   - Clear data model
   - Easy to understand relationships
   - Prisma type safety

---

## Risks & Mitigation

### Risk 1: Data Migration Complexity

**Impact:** HIGH
**Probability:** MEDIUM

**Mitigation:**
- Create backup before migration
- Run migration in staging first
- Use transactions for rollback
- Test thoroughly with production data copy

### Risk 2: Performance Impact

**Impact:** MEDIUM
**Probability:** LOW

**Mitigation:**
- Add proper indexes
- Optimize queries
- Use caching for frequently accessed master data
- Monitor query performance

### Risk 3: Breaking Existing Workflows

**Impact:** CRITICAL
**Probability:** MEDIUM

**Mitigation:**
- Implement in phases
- Maintain backward compatibility
- Feature flags for new workflow
- Extensive testing before production

---

## Next Steps

### Immediate (This Week)

1. ✅ Review and approve this analysis document
2. ⏳ Create database migration scripts
3. ⏳ Set up staging environment for testing
4. ⏳ Populate initial master data

### Short-Term (Next 2 Weeks)

1. ⏳ Implement Prisma schema updates
2. ⏳ Create API routes for master data
3. ⏳ Build frontend management UI
4. ⏳ Write unit and integration tests

### Medium-Term (Next Month)

1. ⏳ Migrate existing data to master tables
2. ⏳ Integrate with ATP upload workflow
3. ⏳ Test end-to-end approval flow
4. ⏳ Deploy to production

---

## Appendix

### Sample SQL Scripts

**Complete Migration Script:**
```sql
-- File: migrations/001_create_master_tables.sql

BEGIN;

-- 1. ATP Scope Master
CREATE TABLE atp_scope_master (...);

-- 2. Approval Role Master
CREATE TABLE approval_role_master (...);

-- 3. Approval Matrix
CREATE TABLE approval_matrix (...);

-- 4. Region Cluster Approver
CREATE TABLE region_cluster_approver (...);

-- 5. Migrate existing data
INSERT INTO atp_scope_master ...

-- 6. Update foreign keys
ALTER TABLE sites ADD CONSTRAINT ...

COMMIT;
```

### Related Documentation

- [Comprehensive Troubleshooting Log](./COMPREHENSIVE_TROUBLESHOOTING_LOG.md)
- [Prisma Migration Complete](./deployment/PRISMA_CAMELCASE_MIGRATION_COMPLETE.md)
- [Workspace Multi-Tenant Deployment](./workspace-multi-tenant/STAGING_WORKSPACE_DEPLOYMENT_COMPLETE.md)

---

**Document Status:** 📋 Analysis Complete - Awaiting Approval
**Last Updated:** 2025-12-29
**Next Review:** After implementation begins
