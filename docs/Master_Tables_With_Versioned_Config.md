# Master Tables with Versioned Config Architecture

**Date:** 2025-12-29
**Status:** 📋 Version 3.0 - Final Architecture
**Priority:** CRITICAL
**Architecture Principle:** **Versioned Config + Workspace-Scoped + Separation of Concerns**

---

## Executive Summary

This document presents the **final master tables architecture** based on critical design principles:

1. ✅ **Workspace-Scoped**: All master config must have `workspace_id` (XLSMART approval matrix must NOT leak)
2. ✅ **Separation of Concerns**: RBAC/Login roles (existing `roles` table) ≠ Approval Roles (workflow chain roles)
3. ✅ **Versioned Config**: Every Excel import = new config version (critical for audit & RCA)
4. ✅ **Freeze by Reference**: Runtime stores `config_version_id`, immutable workflow instances

---

## Table of Contents

1. [Design Principles](#1-design-principles)
2. [Versioned Config Architecture](#2-versioned-config-architecture)
3. [Core Foundation Tables](#3-core-foundation-tables)
4. [Approval Configuration (Versioned)](#4-approval-configuration-versioned)
5. [Cluster Configuration (Versioned)](#5-cluster-configuration-versioned)
6. [Runtime Workflow Tables](#6-runtime-workflow-tables)
7. [Data Isolation Strategy](#7-data-isolation-strategy)
8. [Excel Import Flow](#8-excel-import-flow)
9. [Workflow Routing Logic](#9-workflow-routing-logic)
10. [Implementation Priority](#10-implementation-priority)

---

## 1. Design Principles

### 1.1 Workspace-Scoped Configuration

**Why Critical:**
- XLSMART workspace approval matrix must NOT leak to other workspaces
- Each workspace has independent approvers, clusters, and policies
- Multi-tenant isolation is non-negotiable

**Rule:**
```sql
-- ALL master config tables MUST have workspace_id
CREATE TABLE xxx_master (
  workspace_id UUID NOT NULL REFERENCES workspaces(id),
  config_version_id UUID NOT NULL REFERENCES config_versions(id),
  ...
);

-- Query pattern: Always filter by workspace
SELECT * FROM xxx_master
WHERE workspace_id = :workspace_id
  AND config_version_id = :config_version_id;
```

### 1.2 Separation of Concerns

**RBAC/Login Roles ≠ Approval Roles:**

| Aspect | RBAC/Login Roles | Approval Roles |
|--------|------------------|----------------|
| **Purpose** | Authentication, system access | Workflow approval chain |
| **Table** | `roles` (existing) | `approval_role_master` (new) |
| **Examples** | admin, user, document_control | SME, NOC_HEAD, RTH_HEAD |
| **Scope** | System-wide (login) | Workspace-specific (workflow) |
| **Persistence** | Long-term, stable | Versioned, changes with Excel |
| **Changes** | Rare (admin operation) | Frequent (Excel imports) |

**Key Insight:**
- User logs in with RBAC role (e.g., `document_control`)
- User participates in workflow with approval role (e.g., `SME`)
- **Many-to-many mapping**: One user can have multiple approval roles across workspaces

**DO NOT MIX:**
```sql
-- ❌ WRONG: Mixing RBAC with approval roles
CREATE TABLE users (
  role VARCHAR(50),  -- This is RBAC role (login)
  approval_role VARCHAR(50)  -- This is workflow role
);

-- ✅ CORRECT: Separate tables
-- users.role → RBAC (login)
-- user_workspace_memberships.rbac_role_id → RBAC per workspace
-- approval_role_master → Workflow roles
-- cluster_approver_master → User assigned to approval role
```

### 1.3 Versioned Config (Critical)

**Why Versioned:**

Excel approval matrix + cluster approvers are **living data**:
- ✅ PIC approvers resign/move
- ✅ Clusters split/merge
- ✅ New scope/vendor added
- ✅ Stage order changes
- ✅ SLA adjustments

**Audit Scenario (Real Problem):**
```
Scenario:
- ATP Submission created: Jan 1, 2025
- Approver at that time: User A (NOC_HEAD)
- Jan 10, 2025: Excel updated → approver becomes User B
- Auditor asks: "Why was Jan 1 submission approved by User A? Current system shows User B."

Without versioning: System looks "wrong"
With versioning: Clear answer - submission used config version X (active on Jan 1)
```

**Versioning Principle:**
```
Every Excel import = New Config Version
Old config versions = NEVER modified (immutable)
New config version = ACTIVE
Runtime workflow = Stores config_version_id used at creation
```

---

## 2. Versioned Config Architecture

### 2.1 Config Versions Table

**Purpose:** Header for each Excel import - the **heart of versioning**

**Schema:**
```sql
CREATE TABLE config_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id),

  -- Source Information
  source_file_name VARCHAR(255) NOT NULL,        -- "XLS ATP Process Flow.xlsx"
  source_sheet VARCHAR(100),                      -- "Approval_Matrix", "Cluster_Approvers"
  source_type VARCHAR(50) NOT NULL,              -- APPROVAL_MATRIX, CLUSTER_MAPPING, SCOPE_CONFIG
  source_hash VARCHAR(64),                       -- SHA-256 checksum for duplicate detection

  -- Version Control
  version_number INTEGER NOT NULL,               -- Sequential per workspace + source_type
  previous_version_id UUID REFERENCES config_versions(id),

  -- Import Metadata
  imported_at TIMESTAMP DEFAULT NOW(),
  imported_by TEXT NOT NULL REFERENCES users(id),
  import_status VARCHAR(20) DEFAULT 'DRAFT',     -- DRAFT, ACTIVE, ARCHIVED, SUPERSEDED

  -- Validation
  row_count INTEGER,                              -- Number of rows imported
  validation_status VARCHAR(20) DEFAULT 'PENDING', -- PENDING, VALID, INVALID, WARNINGS
  validation_errors TEXT,                         -- JSON array of validation errors
  validation_warnings TEXT,                       -- JSON array of warnings

  -- Status Transitions
  effective_date DATE DEFAULT CURRENT_DATE,       -- When this version becomes active
  expire_date DATE,                               -- NULL = no expiry
  superseded_by_id UUID REFERENCES config_versions(id),

  -- Notes
  change_description TEXT,
  is_rollback BOOLEAN DEFAULT FALSE,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  -- Constraints
  CONSTRAINT config_versions_unique_active
    UNIQUE (workspace_id, source_type, import_status)
    WHERE (import_status = 'ACTIVE'),
  CONSTRAINT config_versions_no_overlap
    EXCLUDE USING GIST (
      workspace_id WITH =,
      source_type WITH =,
      tsrange(effective_date, expire_date) WITH &&
    )
);

-- Indexes for efficient lookup
CREATE INDEX idx_config_versions_workspace_active
  ON config_versions(workspace_id, source_type)
  WHERE (import_status = 'ACTIVE');
CREATE INDEX idx_config_versions_version
  ON config_versions(workspace_id, source_type, version_number DESC);
CREATE INDEX idx_config_versions_effective
  ON config_versions(workspace_id, effective_date DESC);

-- Sample Data
INSERT INTO config_versions (workspace_id, source_file_name, source_type, version_number, import_status, effective_date) VALUES
-- Version 1: Initial import
(workspace_id, 'Approval_Matrix_v1.xlsx', 'APPROVAL_MATRIX', 1, 'ACTIVE', '2025-01-01'),

-- Version 2: Excel updated (supersedes v1)
(workspace_id, 'Approval_Matrix_v2.xlsx', 'APPROVAL_MATRIX', 2, 'ACTIVE', '2025-01-15'),

-- Version 1 becomes ARCHIVED
(UPDATE config_versions SET import_status='ARCHIVED', expire_date='2025-01-15' WHERE id=v1_id);
```

### 2.2 Configuration Version State Machine

```
[DRAFT] → [VALID] → [ACTIVE] → [ARCHIVED] / [SUPERSEDED]
   ↓          ↓         ↓
[INVALID]  [WARNINGS] [SUPERSEDED]
```

**State Descriptions:**

| State | Description | Can Be Used for Routing? |
|-------|-------------|--------------------------:|
| **DRAFT** | Initial state during import | ❌ No |
| **VALID** | Validation passed, ready to activate | ❌ No |
| **INVALID** | Validation failed, has errors | ❌ No |
| **WARNINGS** | Valid but has warnings | ✅ Yes (if activated) |
| **ACTIVE** | Currently active for new workflows | ✅ Yes |
| **ARCHIVED** | Expired, no longer active | ❌ No (historical only) |
| **SUPERSEDED** | Replaced by newer version | ❌ No (historical only) |

**State Transitions:**
```sql
-- Activate new version (supercedes old)
BEGIN;

-- 1. Archive current ACTIVE version
UPDATE config_versions
SET import_status = 'SUPERSEDED',
    expire_date = CURRENT_DATE,
    superseded_by_id = :new_version_id
WHERE workspace_id = :workspace_id
  AND source_type = :source_type
  AND import_status = 'ACTIVE';

-- 2. Activate new version
UPDATE config_versions
SET import_status = 'ACTIVE',
    effective_date = CURRENT_DATE
WHERE id = :new_version_id;

COMMIT;

-- Rollback to previous version
BEGIN;

-- 1. Archive current version
UPDATE config_versions
SET import_status = 'SUPERSEDED',
    expire_date = CURRENT_DATE
WHERE id = :current_version_id;

-- 2. Activate previous version
UPDATE config_versions
SET import_status = 'ACTIVE',
    effective_date = CURRENT_DATE,
    expire_date = NULL
WHERE id = :previous_version_id;

COMMIT;
```

---

## 3. Core Foundation Tables

### 3.1 Workspaces (Multi-Tenant Isolation)

**Status:** ✅ EXISTS (from previous implementation)

```sql
CREATE TABLE workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(80) UNIQUE NOT NULL,              -- XLSMART-AVIAT
  name VARCHAR(150) NOT NULL,
  customer_group_id VARCHAR(255) NOT NULL,
  vendor_owner_id VARCHAR(255) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

---

## 4. Approval Configuration (Versioned)

### 4.1 ATP Scope Master (Workspace-Scoped + Versioned)

**Purpose:** Centralized ATP scope definitions WITH workspace isolation and versioning

**Schema:**
```sql
CREATE TABLE atp_scope_master (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- CRITICAL: Workspace + Version
  workspace_id UUID NOT NULL REFERENCES workspaces(id),
  config_version_id UUID REFERENCES config_versions(id),

  -- Scope Identification
  scope_code VARCHAR(50) NOT NULL,
  scope_name VARCHAR(150) NOT NULL,
  scope_group VARCHAR(50),                       -- MW_FAMILY, RAN_FAMILY, PLN_FAMILY

  -- Classification
  category_code VARCHAR(50),                     -- UPGRADE, DISMANTLE, NEW, RELOCATION
  atp_type VARCHAR(20) DEFAULT 'BOTH',          -- HARDWARE, SOFTWARE, BOTH

  -- Workflow Configuration
  default_template_code VARCHAR(50),             -- ATP_HARDWARE, ATP_SOFTWARE, ATP_COMBINED
  requires_cluster BOOLEAN DEFAULT true,         -- Does this scope need cluster mapping?
  default_workflow_stage VARCHAR(50) DEFAULT 'REGISTERED',

  -- Business Rules
  is_active BOOLEAN DEFAULT true,
  effective_date DATE DEFAULT CURRENT_DATE,
  expiry_date DATE,

  -- Metadata
  description TEXT,
  sla_policy_id UUID,                            -- Reference to sla_policy_master (optional)
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by TEXT REFERENCES users(id),
  updated_by TEXT REFERENCES users(id),

  -- Constraints
  CONSTRAINT atp_scope_master_unique
    UNIQUE (workspace_id, scope_code, config_version_id)
);

-- Indexes (ALWAYS include workspace_id + config_version_id)
CREATE INDEX idx_atp_scope_workspace_version
  ON atp_scope_master(workspace_id, config_version_id, is_active);
CREATE INDEX idx_atp_scope_workspace_active
  ON atp_scope_master(workspace_id, is_active)
  WHERE (is_active = true);

-- Sample Data (Workspace XLSMART-AVIAT, Config Version 1)
INSERT INTO atp_scope_master (workspace_id, config_version_id, scope_code, scope_name, scope_group, category_code) VALUES
-- Config v1: Active scopes
(xlsmart_workspace_id, config_v1_id, 'MW', 'Microwave', 'MW_FAMILY', 'UPGRADE'),
(xlsmart_workspace_id, config_v1_id, 'RAN', 'RAN', 'RAN_FAMILY', 'UPGRADE'),
(xlsmart_workspace_id, config_v1_id, 'PLN', 'Power Line Network', 'PLN_FAMILY', 'UPGRADE'),

-- Config v2: Same workspace, new version adds VLAN scope
(xlsmart_workspace_id, config_v2_id, 'MW', 'Microwave', 'MW_FAMILY', 'UPGRADE'),
(xlsmart_workspace_id, config_v2_id, 'RAN', 'RAN', 'RAN_FAMILY', 'UPGRADE'),
(xlsmart_workspace_id, config_v2_id, 'PLN', 'Power Line Network', 'PLN_FAMILY', 'UPGRADE'),
(xlsmart_workspace_id, config_v2_id, 'VLAN_TAGGING', 'VLAN Tagging', 'MW_FAMILY', 'UPGRADE');
```

### 4.2 Approval Role Master (NOT RBAC - Workflow Roles Only)

**Purpose:** Define roles in approval workflow chain (SEPARATED from RBAC roles)

**Critical Distinction:**
- This is NOT the `roles` table used for login
- This is ONLY for workflow approval chain
- SEPARATED from actor type (CUSTOMER/VENDOR)

**Schema:**
```sql
CREATE TABLE approval_role_master (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- CRITICAL: Workspace + Version
  workspace_id UUID REFERENCES workspaces(id),
  config_version_id UUID REFERENCES config_versions(id),

  -- Role Identification (Workflow Chain)
  role_code VARCHAR(50) NOT NULL,               -- BO, SME, NOC_HEAD, RTS_FOP, REGION_TEAM, RTH_HEAD
  role_name VARCHAR(150) NOT NULL,
  role_description TEXT,

  -- Hierarchy & Grouping
  hierarchy_order INTEGER NOT NULL,              -- 1=first, 10=last (NOT level - avoid confusion)
  stage_group VARCHAR(50),                       -- REVIEW, SIGN, VALIDATION, FINAL

  -- Approval Authority
  is_final_approver BOOLEAN DEFAULT false,       -- Can this role give final approval?
  can_approve_parallel BOOLEAN DEFAULT false,    -- Can approve in parallel with same stage?

  -- Metadata
  is_active BOOLEAN DEFAULT true,
  effective_date DATE DEFAULT CURRENT_DATE,
  expiry_date DATE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by TEXT REFERENCES users(id),
  updated_by TEXT REFERENCES users(id),

  CONSTRAINT approval_role_master_unique
    UNIQUE (workspace_id, role_code, config_version_id)
);

-- Indexes
CREATE INDEX idx_approval_role_workspace_version
  ON approval_role_master(workspace_id, config_version_id, is_active);
CREATE INDEX idx_approval_role_hierarchy
  ON approval_role_master(workspace_id, hierarchy_order, is_active);

-- Sample Data
INSERT INTO approval_role_master (workspace_id, config_version_id, role_code, role_name, hierarchy_order, stage_group, is_final_approver) VALUES
-- Config v1: 5 approval roles
(xlsmart_workspace_id, config_v1_id, 'BO', 'Business Operations', 1, 'REVIEW', false),
(xlsmart_workspace_id, config_v1_id, 'SME', 'Subject Matter Expert', 2, 'VALIDATION', false),
(xlsmart_workspace_id, config_v1_id, 'NOC_HEAD', 'NOC Head', 4, 'SIGN', false),
(xlsmart_workspace_id, config_v1_id, 'RTS_FOP', 'RTS/FOP', 5, 'SIGN', false),
(xlsmart_workspace_id, config_v1_id, 'RTH_HEAD', 'RTH Head', 7, 'FINAL', true),

-- Config v2: Added PMO role
(xlsmart_workspace_id, config_v2_id, 'BO', 'Business Operations', 1, 'REVIEW', false),
(xlsmart_workspace_id, config_v2_id, 'SME', 'Subject Matter Expert', 2, 'VALIDATION', false),
(xlsmart_workspace_id, config_v2_id, 'NOC_HEAD', 'NOC Head', 4, 'SIGN', false),
(xlsmart_workspace_id, config_v2_id, 'RTS_FOP', 'RTS/FOP', 5, 'SIGN', false),
(xlsmart_workspace_id, config_v2_id, 'PMO', 'Project Management Office', 6, 'SIGN', false),
(xlsmart_workspace_id, config_v2_id, 'RTH_HEAD', 'RTH Head', 7, 'FINAL', true);
```

### 4.3 Actor Type Master (Separated from Roles)

**Purpose:** Define WHO can fill approval roles (NOT the roles themselves)

**Schema:**
```sql
CREATE TABLE actor_type_master (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id),

  -- Actor Types (WHO, not WHAT)
  actor_type_code VARCHAR(50) UNIQUE NOT NULL,  -- CUSTOMER, VENDOR, PLATFORM_OWNER
  actor_type_name VARCHAR(150) NOT NULL,
  description TEXT,

  -- Capabilities
  can_submit_atp BOOLEAN DEFAULT false,
  can_approve_atp BOOLEAN DEFAULT false,
  can_override_approver BOOLEAN DEFAULT false,

  -- Metadata
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),

  CONSTRAINT actor_type_master_unique
    UNIQUE (workspace_id, actor_type_code)
);

-- Sample Data
INSERT INTO actor_type_master (actor_type_code, actor_type_name, can_submit_atp, can_approve_atp) VALUES
('CUSTOMER', 'Customer (XL Smart)', true, true),
('VENDOR', 'Vendor (ZTE, Huawei, Nokia, Ericsson)', true, true),
('PLATFORM_OWNER', 'Platform Owner (Aviat)', true, true);
```

### 4.4 Role-Actor Type Mapping (Many-to-Many)

**Purpose:** Define which actor types can fill which approval roles

**Schema:**
```sql
CREATE TABLE approval_role_actor_mapping (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id),
  config_version_id UUID REFERENCES config_versions(id),

  -- Mapping
  approval_role_id UUID NOT NULL REFERENCES approval_role_master(id),
  actor_type_id UUID NOT NULL REFERENCES actor_type_master(id),

  -- Constraints
  is_primary BOOLEAN DEFAULT false,              -- Primary actor type for this role
  is_active BOOLEAN DEFAULT true,
  effective_date DATE DEFAULT CURRENT_DATE,

  CONSTRAINT approval_role_actor_unique
    UNIQUE (workspace_id, approval_role_id, actor_type_id, config_version_id)
);

-- Sample Data: Define which actors can fill which roles
INSERT INTO approval_role_actor_mapping (workspace_id, config_version_id, approval_role_id, actor_type_id, is_primary) VALUES
-- BO, SME, NOC_HEAD = CUSTOMER only (not vendor)
(xlsmart_workspace_id, config_v1_id, role_bo_id, actor_customer_id, true),
(xlsmart_workspace_id, config_v1_id, role_sme_id, actor_customer_id, true),
(xlsmart_workspace_id, config_v1_id, role_noc_head_id, actor_customer_id, true),

-- Some roles can be filled by multiple actor types
(xlsmart_workspace_id, config_v1_id, role_sme_id, actor_vendor_id, false),  -- Vendor can also be SME
(xlsmart_workspace_id, config_v1_id, role_doc_control_id, actor_vendor_id, false),

-- Platform owner has special roles
(xlsmart_workspace_id, config_v1_id, role_xls_config_team_id, actor_platform_owner_id, true);
```

### 4.5 Approval Policy Master (Header - Versioned)

**Purpose:** Policy header defining workflow for (scope + vendor + category) combination

**Schema:**
```sql
CREATE TABLE approval_policy_master (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- CRITICAL: Workspace + Version
  workspace_id UUID NOT NULL REFERENCES workspaces(id),
  config_version_id UUID NOT NULL REFERENCES config_versions(id),

  -- Policy Determinants
  scope_id UUID NOT NULL REFERENCES atp_scope_master(id),
  vendor_id UUID,                                -- NULL or ALL_VENDORS = applies to all
  atp_category VARCHAR(20),                      -- HARDWARE, SOFTWARE, BOTH

  -- Fallback Hierarchy
  fallback_priority INTEGER DEFAULT 0,           -- 0=highest priority (exact match), 1=vendor fallback
  parent_policy_id UUID REFERENCES approval_policy_master(id),

  -- Versioning
  policy_version VARCHAR(20) NOT NULL,           -- v1.0, v1.1, v2.0

  -- Effective Period
  is_active BOOLEAN DEFAULT true,
  effective_date DATE DEFAULT CURRENT_DATE,
  expiry_date DATE,

  -- Metadata
  policy_name VARCHAR(255),
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by TEXT REFERENCES users(id),
  updated_by TEXT REFERENCES users(id),

  CONSTRAINT approval_policy_unique
    UNIQUE (workspace_id, scope_id, vendor_id, atp_category, config_version_id)
);

-- Indexes for efficient policy lookup
CREATE INDEX idx_approval_policy_lookup
  ON approval_policy_master(workspace_id, scope_id, is_active, fallback_priority);
CREATE INDEX idx_approval_policy_vendor
  ON approval_policy_master(workspace_id, vendor_id, is_active)
  WHERE (vendor_id IS NOT NULL);

-- Sample Data
INSERT INTO approval_policy_master (workspace_id, config_version_id, scope_id, vendor_id, atp_category, policy_version, fallback_priority) VALUES
-- Config v1: MW + ZTE + BOTH (exact match - priority 0)
(xlsmart_workspace_id, config_v1_id, scope_mw_id, vendor_zte_id, 'BOTH', 'v1.0', 0),

-- Config v1: MW + ALL_VENDORS + BOTH (fallback - priority 1)
(xlsmart_workspace_id, config_v1_id, scope_mw_id, NULL, 'BOTH', 'v1.0', 1),

-- Config v1: RAN + ALL_VENDORS + BOTH
(xlsmart_workspace_id, config_v1_id, scope_ran_id, NULL, 'BOTH', 'v1.0', 0);
```

### 4.6 Approval Policy Stages (Detail - Versioned)

**Purpose:** Detailed stage configuration for each approval policy

**Schema:**
```sql
CREATE TABLE approval_policy_stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  policy_id UUID NOT NULL REFERENCES approval_policy_master(id) ON DELETE CASCADE,

  -- CRITICAL: Version reference
  config_version_id UUID NOT NULL REFERENCES config_versions(id),

  -- Stage Definition
  stage_number INTEGER NOT NULL,
  stage_name VARCHAR(100) NOT NULL,
  stage_group VARCHAR(50),                       -- REVIEW, SIGN, VALIDATION, FINAL

  -- Role Reference
  approval_role_id UUID NOT NULL REFERENCES approval_role_master(id),

  -- Configuration
  is_required BOOLEAN DEFAULT true,
  is_parallel BOOLEAN DEFAULT false,
  parallel_group VARCHAR(50),                    -- NULL or 'A', 'B', 'C' for parallel groups

  -- SLA
  sla_hours INTEGER DEFAULT 24,
  sla_days INTEGER DEFAULT 1,

  -- Assignment Mode (CRITICAL for auto-assignment)
  assignment_mode VARCHAR(20) NOT NULL,          -- CLUSTER, STATIC_USER, RULE, AUTO
  auto_assign_rule TEXT,                         -- JSON or string rule

  -- Notifications
  notification_on_assign BOOLEAN DEFAULT true,
  notification_on_approve BOOLEAN DEFAULT true,
  notification_on_reject BOOLEAN DEFAULT true,

  -- Ordering
  sequence_order INTEGER NOT NULL,

  -- Metadata
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),

  CONSTRAINT approval_policy_stages_unique
    UNIQUE (policy_id, stage_number, approval_role_id, config_version_id),
  CONSTRAINT approval_policy_stages_order
    CHECK (sequence_order > 0)
);

-- Indexes
CREATE INDEX idx_approval_policy_stages_policy
  ON approval_policy_stages(policy_id, sequence_order);
CREATE INDEX idx_approval_policy_stages_role
  ON approval_policy_stages(approval_role_id, is_active);

-- Sample Data: MW + ZTE + BOTH Policy (5 Stages)
INSERT INTO approval_policy_stages (policy_id, config_version_id, stage_number, stage_name, stage_group, approval_role_id, assignment_mode, sla_hours, sequence_order) VALUES
-- Config v1: 5 stages
(policy_mw_zte_id, config_v1_id, 1, 'BO Review', 'REVIEW', role_bo_id, 'AUTO', 8, 1),
(policy_mw_zte_id, config_v1_id, 2, 'SME Technical Review', 'VALIDATION', role_sme_id, 'CLUSTER', 24, 2),
(policy_mw_zte_id, config_v1_id, 3, 'NOC Head Approval', 'SIGN', role_noc_head_id, 'CLUSTER', 48, 3),
(policy_mw_zte_id, config_v1_id, 4, 'RTS/FOP Approval', 'SIGN', role_rts_fop_id, 'CLUSTER', 48, 4),
(policy_mw_zte_id, config_v1_id, 5, 'RTH Final Approval', 'FINAL', role_rth_head_id, 'CLUSTER', 72, 5),

-- Config v2: Same policy BUT added PMO stage (6 stages now)
(policy_mw_zte_id, config_v2_id, 1, 'BO Review', 'REVIEW', role_bo_id, 'AUTO', 8, 1),
(policy_mw_zte_id, config_v2_id, 2, 'SME Technical Review', 'VALIDATION', role_sme_id, 'CLUSTER', 24, 2),
(policy_mw_zte_id, config_v2_id, 3, 'NOC Head Approval', 'SIGN', role_noc_head_id, 'CLUSTER', 48, 3),
(policy_mw_zte_id, config_v2_id, 4, 'RTS/FOP Approval', 'SIGN', role_rts_fop_id, 'CLUSTER', 48, 4),
(policy_mw_zte_id, config_v2_id, 5, 'PMO Review', 'SIGN', role_pmo_id, 'AUTO', 24, 5),
(policy_mw_zte_id, config_v2_id, 6, 'RTH Final Approval', 'FINAL', role_rth_head_id, 'CLUSTER', 72, 6);
```

---

## 5. Cluster Configuration (Versioned)

### 5.1 Cluster Master (Directory - Versioned)

**Purpose:** Cluster directory based on Excel structure WITH versioning

**Schema:**
```sql
CREATE TABLE cluster_master (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- CRITICAL: Workspace + Version
  workspace_id UUID NOT NULL REFERENCES workspaces(id),
  config_version_id UUID REFERENCES config_versions(id),

  -- Cluster Identification
  cluster_code VARCHAR(50) NOT NULL,
  cluster_name VARCHAR(150) NOT NULL,

  -- Geographic Location
  region VARCHAR(100) NOT NULL,
  province VARCHAR(100),
  city VARCHAR(100),

  -- Site Information
  site_count INTEGER DEFAULT 0,
  m_sequence INTEGER,                             -- Sequence from Excel

  -- Scope Association
  scope_id UUID REFERENCES atp_scope_master(id),

  -- Source Reference
  source_sheet VARCHAR(100),
  source_row INTEGER,

  -- Metadata
  is_active BOOLEAN DEFAULT true,
  effective_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by TEXT REFERENCES users(id),

  CONSTRAINT cluster_master_unique
    UNIQUE (workspace_id, cluster_code, config_version_id)
);

-- Indexes
CREATE INDEX idx_cluster_workspace_version
  ON cluster_master(workspace_id, config_version_id, is_active);
CREATE INDEX idx_cluster_region
  ON cluster_master(workspace_id, region, is_active);

-- Sample Data
-- Config v1: 6 clusters
INSERT INTO cluster_master (workspace_id, config_version_id, cluster_code, cluster_name, region, m_sequence, site_count) VALUES
(xlsmart_workspace_id, config_v1_id, 'EAST_JAVA_SURABAYA', 'East Java - Surabaya', 'East Java', 1, 15),
(xlsmart_workspace_id, config_v1_id, 'EAST_JAVA_KANGEAN', 'East Java - Kangean', 'East Java', 2, 8),
(xlsmart_workspace_id, config_v1_id, 'WEST_JAVA_BANDUNG', 'West Java - Bandung', 'West Java', 1, 20),
(xlsmart_workspace_id, config_v1_id, 'WEST_JAVA_BEKASI', 'West Java - Bekasi', 'West Java', 2, 18),
(xlsmart_workspace_id, config_v1_id, 'CENTRAL_JAVA_SEMARANG', 'Central Java - Semarang', 'Central Java', 1, 10),
(xlsmart_workspace_id, config_v1_id, 'JAKARTA_CBD', 'Jakarta CBD', 'Jabodetabek', 1, 25),

-- Config v2: Cluster split (EAST_JAVA_SURABAYA split into 2 clusters)
(xlsmart_workspace_id, config_v2_id, 'EAST_JAVA_SURABAYA_NORTH', 'East Java - Surabaya North', 'East Java', 1, 8),
(xlsmart_workspace_id, config_v2_id, 'EAST_JAVA_SURABAYA_SOUTH', 'East Java - Surabaya South', 'East Java', 2, 7),
(xlsmart_workspace_id, config_v2_id, 'EAST_JAVA_KANGEAN', 'East Java - Kangean', 'East Java', 3, 8),
-- ... rest of clusters
```

### 5.2 Cluster Approver Master (Mapping - Versioned)

**Purpose:** Maps (workspace + cluster + approval_role + config_version) → primary_user_id

**Schema:**
```sql
CREATE TABLE cluster_approver_master (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id),
  cluster_id UUID NOT NULL REFERENCES cluster_master(id),
  approval_role_id UUID NOT NULL REFERENCES approval_role_master(id),

  -- CRITICAL: Version reference
  config_version_id UUID NOT NULL REFERENCES config_versions(id),

  -- Approvers
  primary_user_id TEXT NOT NULL REFERENCES users(id),
  backup_user_id TEXT REFERENCES users(id),

  -- Assignment Details
  assignment_notes TEXT,
  source_reference VARCHAR(255),

  -- Effective Period (for temporary assignments)
  is_active BOOLEAN DEFAULT true,
  effective_date DATE DEFAULT CURRENT_DATE,
  expiry_date DATE,

  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by TEXT REFERENCES users(id),
  updated_by TEXT REFERENCES users(id),

  CONSTRAINT cluster_approver_master_unique
    UNIQUE (workspace_id, cluster_id, approval_role_id, config_version_id)
);

-- Indexes for efficient approver lookup
CREATE INDEX idx_cluster_approver_lookup
  ON cluster_approver_master(workspace_id, cluster_id, approval_role_id, config_version_id, is_active);
CREATE INDEX idx_cluster_approver_primary_user
  ON cluster_approver_master(primary_user_id, is_active);

-- Sample Data
-- Config v1: Approver assignments
INSERT INTO cluster_approver_master (workspace_id, cluster_id, approval_role_id, config_version_id, primary_user_id, source_reference) VALUES
(xlsmart_workspace_id, cluster_surabaya_id, role_noc_head_id, config_v1_id, 'noc_east_java_001', 'Sheet2 Row 10'),
(xlsmart_workspace_id, cluster_surabaya_id, role_rth_head_id, config_v1_id, 'rth_east_java_001', 'Sheet2 Row 11'),
(xlsmart_workspace_id, cluster_kangean_id, role_noc_head_id, config_v1_id, 'noc_east_java_001', 'Sheet2 Row 12'),

-- Config v2: New approver for Surabaya (PIC changed)
(xlsmart_workspace_id, cluster_surabaya_north_id, role_noc_head_id, config_v2_id, 'noc_east_java_002', 'Sheet2 Row 10'),
(xlsmart_workspace_id, cluster_surabaya_north_id, role_rth_head_id, config_v2_id, 'rth_east_java_001', 'Sheet2 Row 11'),

-- Config v2: Old approver for Kangean (unchanged)
(xlsmart_workspace_id, cluster_kangean_id, role_noc_head_id, config_v2_id, 'noc_east_java_001', 'Sheet2 Row 12');
```

---

## 6. Runtime Workflow Tables

### 6.1 Workflow Instances (Runtime - NOT Config)

**Purpose:** Runtime workflow instances with FROZEN config version

**Critical Difference:**
- Config tables: Versioned, mutable (new versions added)
- Runtime tables: Immutable, stores config_version_id at creation

**Schema:**
```sql
CREATE TABLE workflow_instances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Workspace
  workspace_id UUID NOT NULL REFERENCES workspaces(id),

  -- CRITICAL: Config Version Freeze
  config_version_id UUID NOT NULL REFERENCES config_versions(id),

  -- Entity Association
  entity_type VARCHAR(50) NOT NULL,             -- ATP_SUBMISSION, SITE_REGISTRATION, TASK
  entity_id UUID NOT NULL,                       -- ATP submission ID, Site ID, Task ID

  -- Policy Reference
  approval_policy_id UUID REFERENCES approval_policy_master(id),

  -- Routing Snapshot (optional but recommended)
  routing_snapshot TEXT,                         -- JSON snapshot of full workflow for debugging

  -- Status
  status VARCHAR(50) DEFAULT 'IN_PROGRESS',     -- IN_PROGRESS, COMPLETED, CANCELLED, ON_HOLD
  current_stage_number INTEGER DEFAULT 1,
  total_stages INTEGER NOT NULL,

  -- Metadata
  started_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  created_by TEXT REFERENCES users(id),

  CONSTRAINT workflow_instances_unique
    UNIQUE (entity_type, entity_id)
);

-- Indexes
CREATE INDEX idx_workflow_instances_config
  ON workflow_instances(config_version_id, status);
CREATE INDEX idx_workflow_instances_entity
  ON workflow_instances(entity_type, entity_id);
```

### 6.2 Workflow Stages (Runtime - NOT Config)

**Purpose:** Runtime stage instances with frozen approver assignment

**Schema:**
```sql
CREATE TABLE workflow_stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_instance_id UUID NOT NULL REFERENCES workflow_instances(id) ON DELETE CASCADE,

  -- Stage Definition (from config, but frozen)
  config_version_id UUID NOT NULL REFERENCES config_versions(id),
  stage_number INTEGER NOT NULL,
  stage_name VARCHAR(100) NOT NULL,
  approval_role_id UUID REFERENCES approval_role_master(id),

  -- CRITICAL: Frozen Approver Assignment
  assigned_user_id TEXT REFERENCES users(id),   -- Frozen at stage creation
  original_assigned_user_id TEXT REFERENCES users(id),  -- For audit

  -- Status
  status VARCHAR(50) DEFAULT 'PENDING',         -- PENDING, IN_PROGRESS, COMPLETED, SKIPPED, REJECTED
  started_at TIMESTAMP,
  completed_at TIMESTAMP,

  -- SLA
  sla_deadline TIMESTAMP,
  sla_status VARCHAR(50),                       -- ON_TRACK, AT_RISK, OVERDUE, COMPLETED_WITHIN_SLA

  -- Decision
  decision VARCHAR(50),                          -- APPROVED, REJECTED, INFO_REQUIRED
  decision_comments TEXT,
  decided_at TIMESTAMP,
  decided_by TEXT REFERENCES users(id),

  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  CONSTRAINT workflow_stages_unique
    UNIQUE (workflow_instance_id, stage_number)
);

-- Indexes
CREATE INDEX idx_workflow_stages_workflow
  ON workflow_stages(workflow_instance_id, stage_number);
CREATE INDEX idx_workflow_stages_assigned_user
  ON workflow_stages(assigned_user_id, status);
CREATE INDEX idx_workflow_stages_config
  ON workflow_stages(config_version_id);
```

### 6.3 Approver Overrides (Special Cases)

**Purpose:** Handle PIC changes, cut-overs, emergencies without breaking versioning

**Schema:**
```sql
CREATE TABLE approver_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id),

  -- What is being overridden
  override_type VARCHAR(20) NOT NULL,            -- STAGE, SUBMISSION, CLUSTER, REGION
  workflow_stage_id UUID REFERENCES workflow_stages(id),
  submission_id UUID,
  cluster_id UUID REFERENCES cluster_master(id),
  region VARCHAR(100),

  -- Role Override
  approval_role_id UUID NOT NULL REFERENCES approval_role_master(id),

  -- Override Approvers
  from_user_id TEXT REFERENCES users(id),         -- Original approver
  to_user_id TEXT NOT NULL REFERENCES users(id),  -- New approver

  -- Reason & Justification
  override_reason TEXT NOT NULL,
  requestor_user_id TEXT REFERENCES users(id),
  approval_status VARCHAR(20) DEFAULT 'PENDING', -- PENDING, APPROVED, REJECTED
  approved_by TEXT REFERENCES users(id),
  approved_at TIMESTAMP,

  -- Effective Period
  is_active BOOLEAN DEFAULT true,
  effective_date DATE DEFAULT CURRENT_DATE,
  expire_date DATE,

  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  created_by TEXT REFERENCES users(id),
  notes TEXT
);

-- Sample Data
INSERT INTO approver_overrides (override_type, workflow_stage_id, approval_role_id, from_user_id, to_user_id, override_reason) VALUES
-- Stage override: PIC resigned, urgent replacement
('STAGE', workflow_stage_id_123, role_noc_head_id, 'noc_east_java_001', 'noc_east_java_002', 'Original NOC resigned, urgent replacement'),

-- Submission override: Special approver for critical site
('SUBMISSION', NULL, submission_id_456, role_rth_head_id, 'rth_emergency_001', 'Critical site requires senior RTH approval');
```

---

## 7. Data Isolation Strategy

### 7.1 Multi-Query Pattern (ALWAYS Filter by Workspace + Version)

**Rule: NEVER query master config without workspace_id + config_version_id**

```sql
-- ❌ WRONG: No workspace filter
SELECT * FROM approval_role_master;

-- ❌ WRONG: No version filter
SELECT * FROM approval_role_master WHERE workspace_id = ?;

-- ✅ CORRECT: Always filter by both
SELECT * FROM approval_role_master
WHERE workspace_id = :workspace_id
  AND config_version_id = :config_version_id
  AND is_active = true;
```

### 7.2 Config Version Lookup Pattern

```sql
-- Step 1: Get active config version for workspace
WITH active_config AS (
  SELECT id, version_number
  FROM config_versions
  WHERE workspace_id = :workspace_id
    AND source_type = 'APPROVAL_MATRIX'
    AND import_status = 'ACTIVE'
    AND effective_date <= CURRENT_DATE
    AND (expire_date IS NULL OR expire_date > CURRENT_DATE)
  ORDER BY version_number DESC
  LIMIT 1
)

-- Step 2: Query approval policy using active config
SELECT apm.*, aps.*
FROM approval_policy_master apm
JOIN active_config ac ON apm.config_version_id = ac.id
JOIN approval_policy_stages aps ON aps.config_version_id = ac.id
WHERE apm.workspace_id = :workspace_id
  AND apm.scope_id = :scope_id
  AND (apm.vendor_id = :vendor_id OR apm.vendor_id IS NULL)
ORDER BY apm.fallback_priority ASC, aps.sequence_order ASC;
```

### 7.3 Runtime Config Freeze Pattern

```sql
-- When creating workflow instance:
INSERT INTO workflow_instances (
  workspace_id,
  config_version_id,  -- FROZEN at creation
  entity_type,
  entity_id,
  approval_policy_id,
  total_stages
)
SELECT
  :workspace_id,
  ac.id as config_version_id,  -- FROZEN
  'ATP_SUBMISSION',
  :submission_id,
  apm.id as approval_policy_id,
  COUNT(aps.id)
FROM active_config ac
CROSS JOIN approval_policy_master apm
  ON apm.config_version_id = ac.id
  AND apm.workspace_id = :workspace_id
JOIN approval_policy_stages aps
  ON aps.policy_id = apm.id
  AND aps.config_version_id = ac.id
WHERE apm.scope_id = :scope_id
  AND (apm.vendor_id = :vendor_id OR apm.vendor_id IS NULL)
LIMIT 1;

-- Create stages with frozen approvers
INSERT INTO workflow_stages (
  workflow_instance_id,
  config_version_id,  -- FROZEN
  stage_number,
  stage_name,
  approval_role_id,
  assigned_user_id,  -- LOOKED UP FROM CLUSTER APPROVER MASTER (FROZEN)
  sla_deadline
)
SELECT
  :workflow_instance_id,
  ac.id as config_version_id,  -- FROZEN
  aps.stage_number,
  aps.stage_name,
  aps.approval_role_id,
  COALESCE(cam.primary_user_id, :fallback_user_id),  -- FROZEN approver
  CURRENT_TIMESTAMP + (aps.sla_hours || ' hours')::INTERVAL
FROM active_config ac
JOIN approval_policy_stages aps ON aps.config_version_id = ac.id
JOIN approval_policy_master apm ON aps.policy_id = apm.id
LEFT JOIN cluster_approver_master cam
  ON cam.workspace_id = apm.workspace_id
  AND cam.config_version_id = ac.id  -- USE ACTIVE CONFIG VERSION
  AND cam.cluster_id = :cluster_id
  AND cam.approval_role_id = aps.approval_role_id
  AND cam.is_active = true
WHERE apm.workspace_id = :workspace_id
  AND apm.scope_id = :scope_id
  AND (apm.vendor_id = :vendor_id OR apm.vendor_id IS NULL)
ORDER BY aps.sequence_order ASC;
```

---

## 8. Excel Import Flow

### 8.1 Complete Import Process

```
┌─────────────────────────────────────────────────────────────────┐
│ STEP 1: Upload Excel                                           │
└────────────────┬────────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────────┐
│ STEP 2: Create Config Version (DRAFT)                          │
│ - INSERT INTO config_versions                                   │
│ - status = 'DRAFT'                                              │
│ - Calculate version_number                                     │
│ - Store source_hash (SHA-256)                                  │
└────────────────┬────────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────────┐
│ STEP 3: Parse & Import Sheets                                   │
│ - For each sheet:                                               │
│   - approval_policy_master + stages (config_version_id = draft)│
│   - cluster_master (config_version_id = draft)                │
│   - cluster_approver_master (config_version_id = draft)       │
│   - approval_role_master (config_version_id = draft)          │
└────────────────┬────────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────────┐
│ STEP 4: Validation                                             │
│ - Check missing roles                                           │
│ - Check invalid regions                                         │
│ - Check duplicate cluster_codes                                  │
│ - Check unresolved user references                              │
│ - Set validation_status = VALID / INVALID / WARNINGS            │
└────────────────┬────────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────────┐
│ STEP 5: User Review & Activation                                │
│ IF validation_status = VALID or WARNINGS:                      │
│   - Archive previous ACTIVE version (status → ARCHIVED)        │
│   - Activate new DRAFT version (status → ACTIVE)               │
│ ELSE:                                                           │
│   - Keep DRAFT, show errors to user                            │
│   - User can fix Excel and re-import                           │
└─────────────────────────────────────────────────────────────────┘
```

### 8.2 Sample Import SQL

```sql
-- Step 1: Create config version (DRAFT)
INSERT INTO config_versions (
  workspace_id,
  source_file_name,
  source_type,
  version_number,
  source_hash,
  import_status,
  imported_by
)
SELECT
  :workspace_id,
  :file_name,
  'APPROVAL_MATRIX',
  COALESCE(MAX(version_number), 0) + 1,
  :sha256_hash,
  'DRAFT',
  :user_id
FROM config_versions
WHERE workspace_id = :workspace_id
  AND source_type = 'APPROVAL_MATRIX'
RETURNING id INTO :new_config_version_id;

-- Step 2: Import approval policies with draft version
INSERT INTO approval_policy_master (
  workspace_id,
  config_version_id,
  scope_id,
  vendor_id,
  atp_category,
  policy_version,
  is_active
)
SELECT
  :workspace_id,
  :new_config_version_id,
  scope_id,
  vendor_id,
  atp_category,
  policy_version,
  true
FROM temp_import_data;

-- Step 3: Import stages with draft version
INSERT INTO approval_policy_stages (
  policy_id,
  config_version_id,
  stage_number,
  stage_name,
  approval_role_id,
  assignment_mode,
  sla_hours,
  sequence_order
)
SELECT
  apm.id,
  :new_config_version_id,
  stage_number,
  stage_name,
  role_id,
  assignment_mode,
  sla_hours,
  sequence_order
FROM temp_import_stages tis
JOIN approval_policy_master apm
  ON apm.scope_id = tis.scope_id
  AND apm.config_version_id = :new_config_version_id;

-- Step 4: Validation
UPDATE config_versions
SET validation_status = CASE
    WHEN (SELECT COUNT(*) FROM validation_errors WHERE severity = 'CRITICAL') > 0
    THEN 'INVALID'
    WHEN (SELECT COUNT(*) FROM validation_warnings) > 0
    THEN 'WARNINGS'
    ELSE 'VALID'
  END
WHERE id = :new_config_version_id;

-- Step 5: Activate (if valid)
BEGIN;

-- 5a. Archive current ACTIVE version
UPDATE config_versions
SET import_status = 'SUPERSEDED',
    expire_date = CURRENT_DATE
WHERE workspace_id = :workspace_id
  AND source_type = 'APPROVAL_MATRIX'
  AND import_status = 'ACTIVE';

-- 5b. Activate new version
UPDATE config_versions
SET import_status = 'ACTIVE',
    effective_date = CURRENT_DATE,
    expire_date = NULL
WHERE id = :new_config_version_id;

COMMIT;
```

---

## 9. Workflow Routing Logic

### 9.1 Complete Routing Algorithm

```javascript
/**
 * Get approval workflow for (scope, vendor, category, cluster)
 * @param {UUID} workspace_id
 * @param {UUID} scope_id
 * @param {UUID} vendor_id (optional)
 * @param {String} atp_category (HARDWARE/SOFTWARE/BOTH)
 * @param {UUID} cluster_id
 * @returns {Object} workflow with frozen approvers
 */
async function getApprovalWorkflow(workspace_id, scope_id, vendor_id, atp_category, cluster_id) {
  // Step 1: Get active config version for workspace
  const activeConfig = await db.query(`
    SELECT id, version_number
    FROM config_versions
    WHERE workspace_id = $1
      AND source_type = 'APPROVAL_MATRIX'
      AND import_status = 'ACTIVE'
      AND effective_date <= CURRENT_DATE
      AND (expire_date IS NULL OR expire_date > CURRENT_DATE)
    ORDER BY version_number DESC
    LIMIT 1
  `, [workspace_id]);

  if (!activeConfig) {
    throw new Error('No active approval configuration found for workspace');
  }

  const configVersionId = activeConfig.id;

  // Step 2: Get approval policy (with fallback)
  let approvalPolicy = await db.query(`
    SELECT apm.*, aps.*
    FROM approval_policy_master apm
    JOIN approval_policy_stages aps
      ON aps.policy_id = apm.id
      AND aps.config_version_id = apm.config_version_id
    WHERE apm.workspace_id = $1
      AND apm.scope_id = $2
      AND apm.config_version_id = $3
      AND apm.atp_category = $4
      AND (apm.vendor_id = $5 OR apm.vendor_id IS NULL)
      AND apm.is_active = true
      AND aps.is_active = true
    ORDER BY apm.fallback_priority ASC, aps.sequence_order ASC
  `, [workspace_id, scope_id, configVersionId, atp_category, vendor_id]);

  // Step 3: If no policy found, try vendor = NULL fallback
  if (!approvalPolicy || approvalPolicy.length === 0) {
    approvalPolicy = await db.query(`
      SELECT apm.*, aps.*
      FROM approval_policy_master apm
      JOIN approval_policy_stages aps
        ON aps.policy_id = apm.id
        AND aps.config_version_id = apm.config_version_id
      WHERE apm.workspace_id = $1
        AND apm.scope_id = $2
        AND apm.config_version_id = $3
        AND apm.atp_category = $4
        AND apm.vendor_id IS NULL  -- Fallback to ALL vendors
        AND apm.is_active = true
        AND aps.is_active = true
      ORDER BY aps.sequence_order ASC
    `, [workspace_id, scope_id, configVersionId, atp_category]);
  }

  // Step 4: Resolve approvers for each stage
  const stagesWithApprovers = await Promise.all(approvalPolicy.map(async (stage) => {
    let assigned_user_id = null;

    // Resolve approver based on assignment_mode
    switch (stage.assignment_mode) {
      case 'CLUSTER':
        // Look up from cluster_approver_master
        const clusterApprover = await db.query(`
          SELECT primary_user_id, backup_user_id
          FROM cluster_approver_master
          WHERE workspace_id = $1
            AND cluster_id = $2
            AND approval_role_id = $3
            AND config_version_id = $4
            AND is_active = true
            AND (effective_date <= CURRENT_DATE)
            AND (expire_date IS NULL OR expire_date > CURRENT_DATE)
          ORDER BY is_primary DESC
          LIMIT 1
        `, [workspace_id, cluster_id, stage.approval_role_id, configVersionId]);

        assigned_user_id = clusterApprover?.primary_user_id;
        break;

      case 'STATIC_USER':
        // Use pre-defined user from auto_assign_rule
        const staticUser = JSON.parse(stage.auto_assign_rule);
        assigned_user_id = staticUser.user_id;
        break;

      case 'RULE':
        // Execute custom rule (simplified)
        assigned_user_id = await executeCustomRule(stage.auto_assign_rule, {
          workspace_id,
          scope_id,
          vendor_id,
          cluster_id,
          configVersionId
        });
        break;

      case 'AUTO':
        // Auto-assign based on role availability
        assigned_user_id = await autoAssignUser(stage.approval_role_id, workspace_id);
        break;
    }

    // Return stage with frozen approver
    return {
      ...stage,
      assigned_user_id,  // FROZEN at workflow creation
      sla_deadline: new Date(Date.now() + stage.sla_hours * 60 * 60 * 1000)
    };
  }));

  return {
    config_version_id: configVersionId,  // FROZEN
    stages: stagesWithApprovers,
    total_stages: stagesWithApprovers.length
  };
}
```

### 9.2 Workflow Creation with Frozen Config

```javascript
async function createWorkflow(submission_id, workspace_id, scope_id, vendor_id, cluster_id) {
  // Get workflow with frozen approvers
  const workflow = await getApprovalWorkflow(
    workspace_id,
    scope_id,
    vendor_id,
    'BOTH',  // or from submission
    cluster_id
  );

  // Create workflow instance with FROZEN config_version_id
  const workflowInstance = await db.query(`
    INSERT INTO workflow_instances (
      workspace_id,
      config_version_id,  -- FROZEN
      entity_type,
      entity_id,
      approval_policy_id,
      total_stages,
      status
    ) VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *
  `, [
    workspace_id,
    workflow.config_version_id,  // FROZEN
    'ATP_SUBMISSION',
    submission_id,
    workflow.approval_policy_id,
    workflow.total_stages,
    'IN_PROGRESS'
  ]);

  // Create stages with FROZEN approvers
  for (const stage of workflow.stages) {
    await db.query(`
      INSERT INTO workflow_stages (
        workflow_instance_id,
        config_version_id,  -- FROZEN
        stage_number,
        stage_name,
        approval_role_id,
        assigned_user_id,  -- FROZEN approver
        sla_deadline,
        status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `, [
      workflowInstance.id,
      workflow.config_version_id,  // FROZEN
      stage.stage_number,
      stage.stage_name,
      stage.approval_role_id,
      stage.assigned_user_id,  // FROZEN approver (won't change)
      stage.sla_deadline,
      'PENDING'
    ]);
  }

  return workflowInstance;
}
```

---

## 10. Implementation Priority

### Phase 1: Core Versioning Infrastructure (Week 1) ⭐ CRITICAL

1. ✅ Create `config_versions` table
2. ✅ Add `config_version_id` to ALL master config tables
3. ✅ Implement config version lookup logic
4. ✅ Implement version activation/archival logic

### Phase 2: Approval Configuration (Week 1-2) ⭐ HIGH

5. ✅ Create `approval_role_master` (separated from RBAC)
6. ✅ Create `actor_type_master` + `approval_role_actor_mapping`
7. ✅ Create `atp_scope_master` (workspace-scoped + versioned)
8. ✅ Create `approval_policy_master` + `approval_policy_stages`

### Phase 3: Cluster Configuration (Week 2) ⭐ HIGH

9. ✅ Create `cluster_master` (directory + versioned)
10. ✅ Create `cluster_approver_master` (mapping + versioned)

### Phase 4: Runtime Workflow (Week 2-3) ⭐ HIGH

11. ✅ Create `workflow_instances` table
12. ✅ Create `workflow_stages` table (with frozen approvers)
13. ✅ Implement workflow routing logic
14. ✅ Create `approver_overrides` table

### Phase 5: Excel Import (Week 3) ⭐ MEDIUM

15. ✅ Build Excel import API
16. ✅ Implement version creation logic
17. ✅ Implement validation logic
18. ✅ Implement activation logic

---

## Summary

### Key Architectural Decisions

1. ✅ **Workspace-Scoped**: All master config has `workspace_id`
2. ✅ **Versioned Config**: Every Excel import = new config version
3. ✅ **Freeze by Reference**: Runtime stores `config_version_id`, immutable
4. ✅ **Separation of Concerns**: RBAC roles ≠ Approval roles
5. ✅ **Override Mechanism**: Handle PIC changes without breaking versioning

### Critical Implementation Rules

1. **NEVER** query master config without `workspace_id + config_version_id`
2. **NEVER** update existing config version (always create new version)
3. **ALWAYS** store `config_version_id` in runtime tables
4. **ALWAYS** filter active config by `workspace_id + source_type + import_status='ACTIVE'`
5. **ALWAYS** use approver_overrides for urgent PIC changes (don't modify config versions)

### Benefits

1. **Auditability**: Clear traceability of which config version was used when
2. **Immutability**: Historical workflows remain consistent
3. **Flexibility**: Config can change without breaking running workflows
4. **Multi-Tenant**: Complete workspace isolation
5. **RCA Support**: Root cause analysis on approval delays/decisions

---

**Document Status:** ✅ FINAL - Ready for Implementation
**Last Updated:** 2025-12-29
**Next Steps:** Create Prisma schema + migration scripts + Excel import API
