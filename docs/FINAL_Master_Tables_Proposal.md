# Final Proposed Master Tables - Complete Architecture

**Date:** 2025-12-29
**Status:** 📋 Version 2.0 - Revised Based on Feedback
**Priority:** CRITICAL
**Reference:**
- Excel Approval_Matrix
- ATP workflow diagrams
- Real routing requirements

---

## Executive Summary

This document presents the **final, comprehensive master tables architecture** for APMS ATP workflow system. All feedback has been incorporated:

- ✅ Separated approval role from actor type
- ✅ Split approval_matrix into policy + stages + fallback
- ✅ Added cluster directory (cluster_master)
- ✅ Added workspace-based user memberships
- ✅ Added config versioning (critical for Excel imports)
- ✅ Added workflow template fallback
- ✅ Added override mechanism for special cases
- ✅ Proper naming conventions throughout

---

## Table of Contents

1. [Core Foundation Tables](#1-core-foundation-tables)
2. [Scope & Workflow Templates](#2-scope--workflow-templates)
3. [Approval Policy & Roles](#3-approval-policy--roles)
4. [Cluster & Approver Mapping](#4-cluster--approver-mapping)
5. [User & Workspace Management](#5-user--workspace-management)
6. [Supporting Master Tables](#6-supporting-master-tables)
7. [Implementation Priority](#7-implementation-priority)
8. [Migration Strategy](#8-migration-strategy)

---

## 1. Core Foundation Tables

### 1.1 Workspaces (Tenant Isolation)

**Purpose:** Multi-tenant workspace isolation (already exists, keeping for reference)

**Status:** ✅ EXISTS (from workspace multi-tenant implementation)

```sql
-- Existing table - no changes needed
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

### 1.2 Config Versions (Excel Versioning) ⭐ **NEW & CRITICAL**

**Purpose:** Track all master data imports from Excel files with versioning

**Why Critical:**
- Every Excel import creates new config version
- All master tables reference config_version_id
- Audit trail for what configuration was active when
- Rollback capability to previous versions

**Schema:**
```sql
CREATE TABLE config_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id),

  -- Source Information
  source_file_name VARCHAR(255) NOT NULL,        -- Approval_Matrix_v2.xlsx
  source_type VARCHAR(50) NOT NULL,              -- APPROVAL_MATRIX, CLUSTER_MAPPING, SCOPE_CONFIG
  source_sheet VARCHAR(100),                      -- Sheet name if Excel

  -- Version Control
  version_number INTEGER NOT NULL,               -- Sequential per workspace + source_type
  config_hash VARCHAR(64),                       -- SHA-256 of file content
  previous_version_id UUID REFERENCES config_versions(id),

  -- Import Metadata
  imported_at TIMESTAMP DEFAULT NOW(),
  imported_by TEXT REFERENCES users(id),
  import_status VARCHAR(20) DEFAULT 'DRAFT',     -- DRAFT, ACTIVE, ARCHIVED, SUPERSEDED

  -- Effective Period
  effective_date DATE DEFAULT CURRENT_DATE,
  expire_date DATE,                               -- NULL = no expiry

  -- Validation
  row_count INTEGER,                              -- Number of rows imported
  validation_status VARCHAR(20),                  -- VALID, INVALID, WARNINGS
  validation_errors TEXT,                         -- JSON array of errors
  validation_warnings TEXT,                       -- JSON array of warnings

  -- Notes
  change_description TEXT,
  is_rollback BOOLEAN DEFAULT FALSE,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  -- Constraints
  CONSTRAINT config_versions_unique_active
    UNIQUE (workspace_id, source_type, import_status)
    WHERE (import_status = 'ACTIVE')
);

-- Indexes
CREATE INDEX idx_config_versions_workspace
  ON config_versions(workspace_id, effective_date DESC);
CREATE INDEX idx_config_versions_active
  ON config_versions(workspace_id, source_type)
  WHERE (import_status = 'ACTIVE');
CREATE INDEX idx_config_versions_hash
  ON config_versions(config_hash);

-- Sample Data
INSERT INTO config_versions (workspace_id, source_file_name, source_type, version_number, import_status) VALUES
  (workspace_id, 'Approval_Matrix_v1.xlsx', 'APPROVAL_MATRIX', 1, 'ACTIVE'),
  (workspace_id, 'Cluster_Mapping_v1.xlsx', 'CLUSTER_MAPPING', 1, 'ACTIVE'),
  (workspace_id, 'ATP_Scope_Config_v1.xlsx', 'SCOPE_CONFIG', 1, 'ACTIVE');
```

**Usage Pattern:**
```sql
-- Get active configuration for workspace
SELECT * FROM config_versions
WHERE workspace_id = ?
  AND import_status = 'ACTIVE'
  AND effective_date <= CURRENT_DATE
  AND (expire_date IS NULL OR expire_date > CURRENT_DATE);

-- Rollback to previous version
UPDATE config_versions
SET import_status = 'SUPERSEDED',
    expire_date = CURRENT_DATE
WHERE workspace_id = ? AND import_status = 'ACTIVE';

UPDATE config_versions
SET import_status = 'ACTIVE',
    effective_date = CURRENT_DATE,
    expire_date = NULL
WHERE id = ?; -- previous version ID
```

---

## 2. Scope & Workflow Templates

### 2.1 ATP Scope Master (Enhanced)

**Purpose:** Centralized ATP scope definitions with additional dimensions

**Enhancements from feedback:**
- ✅ Added scope_group (MW family grouping)
- ✅ Added default_template_code
- ✅ Added requires_cluster flag
- ✅ Added workspace_id for multi-tenant
- ✅ Added config_version_id for versioning

**Schema:**
```sql
CREATE TABLE atp_scope_master (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id),
  config_version_id UUID REFERENCES config_versions(id),

  -- Core Identification
  scope_code VARCHAR(50) NOT NULL,              -- MW, RAN, PLN, TX, ANT, MW_UPGRADE, VLAN_TAGGING
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

-- Indexes
CREATE INDEX idx_atp_scope_workspace
  ON atp_scope_master(workspace_id, is_active);
CREATE INDEX idx_atp_scope_group
  ON atp_scope_master(workspace_id, scope_group, is_active);
CREATE INDEX idx_atp_scope_category
  ON atp_scope_master(category_code, is_active);
CREATE INDEX idx_atp_scope_template
  ON atp_scope_master(default_template_code);

-- Sample Data
INSERT INTO atp_scope_master (workspace_id, config_version_id, scope_code, scope_name, scope_group, category_code, atp_type, default_template_code, requires_cluster) VALUES
-- Core Scopes
(workspace_id, config_id, 'MW', 'Microwave', 'MW_FAMILY', 'UPGRADE', 'BOTH', 'ATP_COMBINED', true),
(workspace_id, config_id, 'MW_UPGRADE', 'MW Upgrade', 'MW_FAMILY', 'UPGRADE', 'BOTH', 'ATP_COMBINED', true),
(workspace_id, config_id, 'VLAN_TAGGING', 'VLAN Tagging', 'MW_FAMILY', 'UPGRADE', 'SOFTWARE', 'ATP_SOFTWARE', false),

-- RAN Family
(workspace_id, config_id, 'RAN', 'RAN', 'RAN_FAMILY', 'UPGRADE', 'BOTH', 'ATP_COMBINED', true),
(workspace_id, config_id, 'RAN_NEW', 'RAN New', 'RAN_FAMILY', 'NEW', 'BOTH', 'ATP_COMBINED', true),

-- PLN Family
(workspace_id, config_id, 'PLN', 'Power Line Network', 'PLN_FAMILY', 'UPGRADE', 'HARDWARE', 'ATP_HARDWARE', true),

-- Other Scopes
(workspace_id, config_id, 'TX', 'Transmission', 'TX_FAMILY', 'UPGRADE', 'BOTH', 'ATP_COMBINED', true),
(workspace_id, config_id, 'ANT', 'Antenna', 'ANT_FAMILY', 'UPGRADE', 'HARDWARE', 'ATP_HARDWARE', true),
(workspace_id, config_id, 'MW_DISMANTLE', 'MW Dismantle', 'MW_FAMILY', 'DISMANTLE', 'HARDWARE', 'ATP_HARDWARE', true);
```

---

### 2.2 Workflow Template Master + Stages ⭐ **NEW**

**Purpose:** Default workflow templates that serve as fallback when approval_policy is incomplete

**Schema:**
```sql
-- 2.2A. Workflow Template Master
CREATE TABLE workflow_template_master (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id),
  config_version_id UUID REFERENCES config_versions(id),

  -- Template Identification
  template_code VARCHAR(50) UNIQUE NOT NULL,    -- ATP_SOFTWARE, ATP_HARDWARE, ATP_COMBINED
  template_name VARCHAR(150) NOT NULL,
  description TEXT,

  -- Template Type
  atp_type VARCHAR(20) NOT NULL,                -- HARDWARE, SOFTWARE, BOTH
  is_default BOOLEAN DEFAULT false,

  -- Metadata
  is_active BOOLEAN DEFAULT true,
  effective_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by TEXT REFERENCES users(id),

  CONSTRAINT workflow_template_unique
    UNIQUE (workspace_id, template_code, config_version_id)
);

-- 2.2B. Workflow Template Stages (Detail)
CREATE TABLE workflow_template_stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES workflow_template_master(id) ON DELETE CASCADE,
  config_version_id UUID REFERENCES config_versions(id),

  -- Stage Definition
  stage_number INTEGER NOT NULL,
  stage_name VARCHAR(100) NOT NULL,             -- "SME Review", "NOC Approval", etc
  stage_group VARCHAR(50),                       -- REVIEW, SIGN, VALIDATION

  -- Role Reference (links to approval_role_master)
  approval_role_id UUID NOT NULL,               -- Will be linked after role_master created

  -- Configuration
  is_required BOOLEAN DEFAULT true,
  is_parallel BOOLEAN DEFAULT false,
  parallel_group VARCHAR(50),                    -- Group "A" if 2 parallel approvers
  sla_hours INTEGER DEFAULT 24,

  -- Ordering
  sequence_order INTEGER NOT NULL,

  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),

  CONSTRAINT workflow_template_stages_unique
    UNIQUE (template_id, stage_number),
  CONSTRAINT workflow_template_stages_order
    CHECK (sequence_order > 0)
);

-- Indexes
CREATE INDEX idx_workflow_template_code
  ON workflow_template_master(template_code, is_active);
CREATE INDEX idx_workflow_template_stages_template
  ON workflow_template_stages(template_id, sequence_order);
CREATE UNIQUE INDEX idx_workflow_template_stages_order
  ON workflow_template_stages(template_id, stage_number, is_active);

-- Sample Data: ATP_COMBINED Template (5 stages)
INSERT INTO workflow_template_master (template_code, template_name, atp_type) VALUES
('ATP_SOFTWARE', 'ATP Software Template', 'SOFTWARE'),
('ATP_HARDWARE', 'ATP Hardware Template', 'HARDWARE'),
('ATP_COMBINED', 'ATP Combined Template', 'BOTH');

-- ATP_COMBINED Stages (will reference role IDs after roles created)
INSERT INTO workflow_template_stages (template_code, template_id, stage_number, stage_name, sequence_order, sla_hours) VALUES
-- Stage 1: Business Operations Review
('ATP_COMBINED', template_id, 1, 'BO Review', 1, 8),

-- Stage 2: SME Review (can be parallel if multiple SMEs)
('ATP_COMBINED', template_id, 2, 'SME Technical Review', 2, 24),

-- Stage 3: NOC Head Approval
('ATP_COMBINED', template_id, 3, 'NOC Head Approval', 3, 48),

-- Stage 4: RTS/FOP Approval
('ATP_COMBINED', template_id, 4, 'RTS/FOP Approval', 4, 48),

-- Stage 5: Regional Team + RTH Final
('ATP_COMBINED', template_id, 5, 'RTH Final Approval', 5, 72);
```

**Fallback Logic:**
```sql
-- 1. Try to find specific approval_policy
-- 2. If not found, try vendor='ALL' fallback
-- 3. If still not found, use default_workflow_template from atp_scope_master
-- 4. If template not found, use ATP_COMBINED as ultimate fallback
```

---

## 3. Approval Policy & Roles

### 3.1 Approval Role Master (Role in Chain) ⭐ **REVISED**

**Purpose:** Define approval roles in the workflow chain (SEPARATED from actor type)

**Key Changes from Feedback:**
- ✅ Separated from actor_type (CUSTOMER/VENDOR/PLATFORM_OWNER)
- ✅ Added stage_group (REVIEW/SIGN/VALIDATION)
- ✅ Added hierarchy_order (not level, to avoid confusion)
- ✅ Added is_final_approver flag
- ✅ Removed UserType from this table (moved to actor_type_master)

**Schema:**
```sql
CREATE TABLE approval_role_master (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id),
  config_version_id UUID REFERENCES config_versions(id),

  -- Role Identification
  role_code VARCHAR(50) NOT NULL,               -- BO, SME, NOC_HEAD, RTS_FOP, REGION_TEAM, RTH_HEAD, PMO, XLS_CONFIG_TEAM
  role_name VARCHAR(150) NOT NULL,
  role_description TEXT,

  -- Hierarchy & Grouping
  hierarchy_order INTEGER NOT NULL,              -- Order in approval chain (1=first, 10=last)
  stage_group VARCHAR(50),                       -- REVIEW, SIGN, VALIDATION, FINAL

  -- Approval Authority
  is_final_approver BOOLEAN DEFAULT false,       -- Can this role give final approval?
  can_approve_parallel BOOLEAN DEFAULT false,    -- Can approve in parallel with same stage?

  -- Capabilities
  is_active BOOLEAN DEFAULT true,
  effective_date DATE DEFAULT CURRENT_DATE,
  expiry_date DATE,

  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by TEXT REFERENCES users(id),
  updated_by TEXT REFERENCES users(id),

  CONSTRAINT approval_role_master_unique
    UNIQUE (workspace_id, role_code, config_version_id)
);

-- Indexes
CREATE INDEX idx_approval_role_workspace
  ON approval_role_master(workspace_id, is_active);
CREATE INDEX idx_approval_role_hierarchy
  ON approval_role_master(workspace_id, hierarchy_order, is_active);
CREATE INDEX idx_approval_role_group
  ON approval_role_master(stage_group, is_active);

-- Sample Data (from Excel Approval_Matrix)
INSERT INTO approval_role_master (workspace_id, config_version_id, role_code, role_name, hierarchy_order, stage_group, is_final_approver) VALUES
-- L2/L3 Roles
(workspace_id, config_id, 'BO', 'Business Operations', 1, 'REVIEW', false),
(workspace_id, config_id, 'SME', 'Subject Matter Expert', 2, 'VALIDATION', false),
(workspace_id, config_id, 'SME_TEAM', 'SME Team Lead', 3, 'VALIDATION', false),

-- L3/L4 Roles
(workspace_id, config_id, 'NOC_HEAD', 'NOC Head', 4, 'SIGN', false),
(workspace_id, config_id, 'RTS_FOP', 'RTS/FOP', 5, 'SIGN', false),
(workspace_id, config_id, 'REGION_TEAM', 'Regional Team', 6, 'SIGN', false),

-- L4/L5 Roles
(workspace_id, config_id, 'RTH_HEAD', 'RTH Head', 7, 'FINAL', true),
(workspace_id, config_id, 'PMO', 'Project Management Office', 8, 'FINAL', true),

-- Special Roles
(workspace_id, config_id, 'XLS_CONFIG_TEAM', 'XLS Configuration Team', 9, 'VALIDATION', false),
(workspace_id, config_id, 'DOC_CONTROL', 'Document Control', 1, 'REVIEW', false);
```

---

### 3.2 Actor Type Master (NEW) ⭐

**Purpose:** Define who can fill approval roles (SEPARATED from role definition)

**Schema:**
```sql
CREATE TABLE actor_type_master (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id),

  -- Actor Types
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
('VENDOR', 'Vendor (ZTE, Huawei, etc)', true, true),
('PLATFORM_OWNER', 'Platform Owner (Aviat)', true, true);
```

---

### 3.3 Role-Actor Type Mapping (Many-to-Many)

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
    UNIQUE (workspace_id, approval_role_id, actor_type_id, config_version_id),
  CONSTRAINT approval_role_actor_check
    CHECK (approval_role_id IS NOT NULL AND actor_type_id IS NOT NULL)
);

-- Indexes
CREATE INDEX idx_role_actor_mapping
  ON approval_role_actor_mapping(workspace_id, approval_role_id, is_active);

-- Sample Data: Define which actors can fill which roles
INSERT INTO approval_role_actor_mapping (workspace_id, config_version_id, approval_role_id, actor_type_id, is_primary) VALUES
-- BO, SME, NOC_HEAD = CUSTOMER only
(workspace_id, config_id, role_bo_id, actor_customer_id, true),
(workspace_id, config_id, role_sme_id, actor_customer_id, true),
(workspace_id, config_id, role_noc_head_id, actor_customer_id, true),

-- Some roles can be filled by multiple actor types
(workspace_id, config_id, role_sme_id, actor_vendor_id, false),  -- Vendor can also be SME in some cases
(workspace_id, config_id, role_doc_control_id, actor_vendor_id, false),

-- Platform owner has special roles
(workspace_id, config_id, role_xls_config_team_id, actor_platform_owner_id, true);
```

---

### 3.4 Approval Policy Master (Header) ⭐ **REVISED**

**Purpose:** Policy header that defines workflow for scope + vendor + category combination

**Schema:**
```sql
CREATE TABLE approval_policy_master (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
  config_version_id UUID REFERENCES config_versions(id),

  -- Effective Period
  is_active BOOLEAN DEFAULT true,
  effective_date DATE DEFAULT CURRENT_DATE,
  expire_date DATE,

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
  ON approval_policy_master(workspace_id, vendor_id, is_active);
CREATE INDEX idx_approval_policy_category
  ON approval_policy_master(atp_category, is_active);

-- Sample Data: Exact Match (MW + ZTE + BOTH)
INSERT INTO approval_policy_master (workspace_id, config_version_id, scope_id, vendor_id, atp_category, policy_version, fallback_priority) VALUES
(workspace_id, config_id, scope_mw_id, vendor_zte_id, 'BOTH', 'v1.0', 0),

-- Fallback: MW + ALL_VENDORS + BOTH
(workspace_id, config_id, scope_mw_id, NULL, 'BOTH', 'v1.0', 1),

-- Fallback: MW + ALL_VENDORS + HARDWARE
(workspace_id, config_id, scope_mw_id, NULL, 'HARDWARE', 'v1.0', 2);
```

---

### 3.5 Approval Policy Stages (Detail) ⭐ **REVISED**

**Purpose:** Detailed stage configuration for each approval policy

**Schema:**
```sql
CREATE TABLE approval_policy_stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  policy_id UUID NOT NULL REFERENCES approval_policy_master(id) ON DELETE CASCADE,
  config_version_id UUID REFERENCES config_versions(id),

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

  -- Assignment Mode (CLITICAL for auto-assignment)
  assignment_mode VARCHAR(20) NOT NULL,          -- CLUSTER, STATIC_USER, RULE, AUTO
  auto_assign_rule TEXT,                         -- JSON or string rule

  -- Notifications
  notification_on_assign BOOLEAN DEFAULT true,
  notification_on_approve BOOLEAN DEFAULT true,
  notification_on_reject BOOLEAN DEFAULT true,
  notification_on_override BOOLEAN DEFAULT false,

  -- Ordering
  sequence_order INTEGER NOT NULL,

  -- Metadata
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),

  CONSTRAINT approval_policy_stages_unique
    UNIQUE (policy_id, stage_number, approval_role_id),
  CONSTRAINT approval_policy_stages_order
    CHECK (sequence_order > 0),
  CONSTRAINT approval_policy_stages_assignment
    CHECK (assignment_mode IN ('CLUSTER', 'STATIC_USER', 'RULE', 'AUTO'))
);

-- Indexes
CREATE INDEX idx_approval_policy_stages_policy
  ON approval_policy_stages(policy_id, sequence_order);
CREATE INDEX idx_approval_policy_stages_role
  ON approval_policy_stages(approval_role_id, is_active);
CREATE INDEX idx_approval_policy_stages_parallel
  ON approval_policy_stages(policy_id, parallel_group, is_active)
  WHERE (is_parallel = true);

-- Sample Data: MW + ZTE + BOTH Policy (5 Stages)
INSERT INTO approval_policy_stages (policy_id, config_version_id, stage_number, stage_name, stage_group, approval_role_id, assignment_mode, sla_hours, sequence_order) VALUES
-- Stage 1: BO Review (L2)
(policy_id, config_id, 1, 'BO Review', 'REVIEW', role_bo_id, 'AUTO', 8, 1),

-- Stage 2: SME Review (L2/L3) - Can be parallel
(policy_id, config_id, 2, 'SME Technical Review', 'VALIDATION', role_sme_id, 'CLUSTER', 24, 2),

-- Stage 3: NOC Head Approval (L3)
(policy_id, config_id, 3, 'NOC Head Approval', 'SIGN', role_noc_head_id, 'CLUSTER', 48, 3),

-- Stage 4: RTS/FOP Approval (L4)
(policy_id, config_id, 4, 'RTS/FOP Approval', 'SIGN', role_rts_fop_id, 'CLUSTER', 48, 4),

-- Stage 5: RTH Final Approval (L5)
(policy_id, config_id, 5, 'RTH Final Approval', 'FINAL', role_rth_head_id, 'CLUSTER', 72, 5);
```

---

## 4. Cluster & Approver Mapping

### 4.1 Cluster Master (Directory) ⭐ **NEW & CRITICAL**

**Purpose:** Cluster directory based on Excel structure (region + province + cluster + m_sequence)

**Schema:**
```sql
CREATE TABLE cluster_master (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id),
  config_version_id UUID REFERENCES config_versions(id),

  -- Cluster Identification
  cluster_code VARCHAR(50) NOT NULL,            -- EAST_JAVA_01, WEST_JAVA_SURABAYA
  cluster_name VARCHAR(150) NOT NULL,

  -- Geographic Location
  region VARCHAR(100) NOT NULL,                  -- East Java, West Java, Central Java
  province VARCHAR(100),                         -- Jawa Timur, Jawa Barat, Jawa Tengah
  city VARCHAR(100),                             -- Surabaya, Bandung, Semarang

  -- Site Information
  site_count INTEGER DEFAULT 0,
  m_sequence INTEGER,                             -- Sequence from Excel

  -- Scope Association (cluster can be scope-specific)
  scope_id UUID REFERENCES atp_scope_master(id),

  -- Source Reference
  source_sheet VARCHAR(100),                     -- Excel sheet name
  source_row INTEGER,                            -- Row number in Excel

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
CREATE INDEX idx_cluster_workspace
  ON cluster_master(workspace_id, is_active);
CREATE INDEX idx_cluster_region
  ON cluster_master(workspace_id, region, is_active);
CREATE INDEX idx_cluster_scope
  ON cluster_master(workspace_id, scope_id, is_active);
CREATE INDEX idx_cluster_sequence
  ON cluster_master(workspace_id, m_sequence);

-- Sample Data
INSERT INTO cluster_master (workspace_id, config_version_id, cluster_code, cluster_name, region, province, city, m_sequence, site_count) VALUES
-- East Java Clusters
(workspace_id, config_id, 'EAST_JAVA_SURABAYA', 'East Java - Surabaya', 'East Java', 'Jawa Timur', 'Surabaya', 1, 15),
(workspace_id, config_id, 'EAST_JAVA_KANGEAN', 'East Java - Kangean', 'East Java', 'Jawa Timur', 'Pulau Kangean', 2, 8),
(workspace_id, config_id, 'EAST_JAVA_SUMENEP', 'East Java - Sumenep', 'East Java', 'Jawa Timur', 'Sumenep', 3, 12),

-- West Java Clusters
(workspace_id, config_id, 'WEST_JAVA_BANDUNG', 'West Java - Bandung', 'West Java', 'Jawa Barat', 'Bandung', 1, 20),
(workspace_id, config_id, 'WEST_JAVA_BEKASI', 'West Java - Bekasi', 'West Java', 'Jawa Barat', 'Bekasi', 2, 18),

-- Central Java Clusters
(workspace_id, config_id, 'CENTRAL_JAVA_SEMARANG', 'Central Java - Semarang', 'Central Java', 'Jawa Tengah', 'Semarang', 1, 10);
```

---

### 4.2 Cluster Approver Master ⭐ **REVISED**

**Purpose:** Maps (workspace + cluster + approval_role) → primary_user_id + backup_user_id

**Schema:**
```sql
CREATE TABLE cluster_approver_master (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id),
  cluster_id UUID NOT NULL REFERENCES cluster_master(id),
  approval_role_id UUID NOT NULL REFERENCES approval_role_master(id),
  config_version_id UUID REFERENCES config_versions(id),

  -- Approvers
  primary_user_id TEXT NOT NULL REFERENCES users(id),
  backup_user_id TEXT REFERENCES users(id),

  -- Assignment Details
  assignment_notes TEXT,
  source_reference VARCHAR(255),                 -- E.g., "Approval_Matrix Sheet2 Row 45"

  -- Effective Period (for temporary assignments)
  is_active BOOLEAN DEFAULT true,
  effective_date DATE DEFAULT CURRENT_DATE,
  expiry_date DATE,                               -- NULL = no expiry

  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by TEXT REFERENCES users(id),
  updated_by TEXT REFERENCES users(id),

  CONSTRAINT cluster_approver_master_unique
    UNIQUE (workspace_id, cluster_id, approval_role_id, config_version_id),
  CONSTRAINT cluster_approver_master_check
    CHECK (primary_user_id IS NOT NULL)
);

-- Indexes for efficient approver lookup
CREATE INDEX idx_cluster_approver_workspace
  ON cluster_approver_master(workspace_id, is_active);
CREATE INDEX idx_cluster_approver_cluster
  ON cluster_approver_master(cluster_id, approval_role_id, is_active);
CREATE INDEX idx_cluster_approver_primary_user
  ON cluster_approver_master(primary_user_id, is_active);
CREATE INDEX idx_cluster_approver_role
  ON cluster_approver_master(approval_role_id, is_active);
CREATE INDEX idx_cluster_approver_effective
  ON cluster_approver_master(workspace_id, cluster_id, approval_role_id, effective_date, is_active);

-- Sample Data
INSERT INTO cluster_approver_master (workspace_id, cluster_id, approval_role_id, primary_user_id, backup_user_id, source_reference) VALUES
-- East Java - Surabaya Cluster
(workspace_id, cluster_surabaya_id, role_noc_head_id, 'noc_east_java_001', 'noc_east_java_002', 'Sheet2 Row 10'),
(workspace_id, cluster_surabaya_id, role_rth_head_id, 'rth_east_java_001', 'rth_east_java_002', 'Sheet2 Row 11'),
(workspace_id, cluster_surabaya_id, role_region_team_id, 'region_east_001', 'region_east_002', 'Sheet2 Row 12'),

-- East Java - Kangean Cluster
(workspace_id, cluster_kangean_id, role_noc_head_id, 'noc_east_java_001', NULL, 'Sheet2 Row 20'),  -- Same NOC for multiple clusters
(workspace_id, cluster_kangean_id, role_region_team_id, 'region_east_002', NULL, 'Sheet2 Row 21'),

-- West Java - Bandung Cluster
(workspace_id, cluster_bandung_id, role_noc_head_id, 'noc_west_java_001', 'noc_west_java_002', 'Sheet2 Row 30'),
(workspace_id, cluster_bandung_id, role_rth_head_id, 'rth_west_java_001', NULL, 'Sheet2 Row 31');
```

---

### 4.3 Approver Overrides (Special Cases) ⭐ **NEW & RECOMMENDED**

**Purpose:** Handle special cases where standard cluster mapping doesn't apply

**Use Cases:**
- Specific site needs different approver
- Temporary PIC during cut-over
- Emergency approver assignment
- Site-specific exceptions

**Schema:**
```sql
CREATE TABLE approver_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id),

  -- What is being overridden
  override_type VARCHAR(20) NOT NULL,            -- SITE, SUBMISSION, CLUSTER, REGION
  site_id UUID REFERENCES sites(id),             -- NULL if override_type != SITE
  submission_id UUID,                            -- NULL if override_type != SUBMISSION
  cluster_id UUID REFERENCES cluster_master(id), -- NULL if override_type != CLUSTER
  region VARCHAR(100),                           -- NULL if override_type != REGION

  -- Role Override
  approval_role_id UUID NOT NULL REFERENCES approval_role_master(id),

  -- Override Approvers
  override_user_id TEXT NOT NULL REFERENCES users(id),
  backup_user_id TEXT REFERENCES users(id),

  -- Reason & Justification
  override_reason TEXT NOT NULL,                 -- "PIC cut-over", "Emergency approver", etc
  requestor_user_id TEXT REFERENCES users(id),
  approval_status VARCHAR(20) DEFAULT 'PENDING', -- PENDING, APPROVED, REJECTED, EXPIRED
  approved_by TEXT REFERENCES users(id),
  approved_at TIMESTAMP,

  -- Effective Period
  is_active BOOLEAN DEFAULT true,
  effective_date DATE DEFAULT CURRENT_DATE,
  expire_date DATE,                               -- NULL = manual expiry required

  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  created_by TEXT REFERENCES users(id),
  notes TEXT,

  CONSTRAINT approver_overrides_check
    CHECK (
      (override_type = 'SITE' AND site_id IS NOT NULL) OR
      (override_type = 'SUBMISSION' AND submission_id IS NOT NULL) OR
      (override_type = 'CLUSTER' AND cluster_id IS NOT NULL) OR
      (override_type = 'REGION' AND region IS NOT NULL)
    )
);

-- Indexes
CREATE INDEX idx_approver_overrides_site
  ON approver_overrides(site_id, approval_role_id, is_active)
  WHERE (override_type = 'SITE');
CREATE INDEX idx_approver_overrides_submission
  ON approver_overrides(submission_id, is_active)
  WHERE (override_type = 'SUBMISSION');
CREATE INDEX idx_approver_overrides_cluster
  ON approver_overrides(cluster_id, approval_role_id, is_active)
  WHERE (override_type = 'CLUSTER');
CREATE INDEX idx_approver_overrides_region
  ON approver_overrides(region, approval_role_id, is_active)
  WHERE (override_type = 'REGION');
CREATE INDEX idx_approver_overrides_user
  ON approver_overrides(override_user_id, is_active);
CREATE INDEX idx_approver_overrides_status
  ON approver_overrides(approval_status, effective_date);

-- Sample Data
INSERT INTO approver_overrides (override_type, site_id, approval_role_id, override_user_id, override_reason, requestor_user_id) VALUES
-- Site-specific override: Special approver for critical site
('SITE', site_id_001, role_noc_head_id, 'noc_special_001', 'Critical site requires senior NOC approval', requestor_id),

-- Temporary override during PIC cut-over
('CLUSTER', cluster_surabaya_id, role_noc_head_id, 'noc_temp_001', 'Temporary PIC during cut-over period', requestor_id),

-- Region-wide emergency override
('REGION', NULL, 'East Java', role_rth_head_id, 'rth_emergency_001', 'Emergency RTH while primary RTH on leave', requestor_id);
```

---

## 5. User & Workspace Management

### 5.1 User Workspace Memberships ⭐ **NEW & CRITICAL**

**Purpose:** Many-to-many relationship between users and workspaces with RBAC roles

**Why Critical:**
- User can have different roles in different workspaces
- User can be platform admin in one workspace, vendor in another
- Prevents role confusion

**Schema:**
```sql
CREATE TABLE user_workspace_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id),
  user_id TEXT NOT NULL REFERENCES users(id),

  -- RBAC Role (links to existing roles table)
  rbac_role_id UUID NOT NULL REFERENCES roles(id),

  -- Membership Details
  is_primary BOOLEAN DEFAULT false,              -- Primary workspace/role for this user
  membership_status VARCHAR(20) DEFAULT 'ACTIVE', -- ACTIVE, INACTIVE, SUSPENDED

  -- Workspace-specific permissions
  is_workspace_admin BOOLEAN DEFAULT false,     -- Can manage workspace settings
  can_submit_atp BOOLEAN DEFAULT true,
  can_approve_atp BOOLEAN DEFAULT false,

  -- Effective Period
  effective_date DATE DEFAULT CURRENT_DATE,
  expiry_date DATE,

  -- Metadata
  assigned_at TIMESTAMP DEFAULT NOW(),
  assigned_by TEXT REFERENCES users(id),
  last_access_at TIMESTAMP,
  notes TEXT,

  CONSTRAINT user_workspace_memberships_unique
    UNIQUE (workspace_id, user_id, rbac_role_id),
  CONSTRAINT user_workspace_memberships_check
    CHECK (user_id IS NOT NULL AND rbac_role_id IS NOT NULL)
);

-- Indexes
CREATE INDEX idx_user_workspace_user
  ON user_workspace_memberships(user_id, membership_status);
CREATE INDEX idx_user_workspace_workspace
  ON user_workspace_memberships(workspace_id, membership_status);
CREATE INDEX idx_user_workspace_role
  ON user_workspace_memberships(rbac_role_id);
CREATE INDEX idx_user_workspace_primary
  ON user_workspace_memberships(user_id, is_primary)
  WHERE (is_primary = true);

-- Sample Data
INSERT INTO user_workspace_memberships (workspace_id, user_id, rbac_role_id, is_primary, is_workspace_admin) VALUES
-- User as Platform Admin in workspace
(xlsmart_workspace_id, 'user_aviat_admin', admin_role_id, true, true),

-- Same user as Vendor in another workspace
(xlsmart_workspace_id, 'user_zte_pm', vendor_role_id, true, false),

-- User as Customer in different workspace
(xlsmart_workspace_id, 'user_xl_sme', customer_role_id, true, false);
```

---

### 5.2 User PIC Import (Normalized from Excel) ⭐ **NEW**

**Purpose:** Handle PIC data import from Excel, creating users or mapping to existing ones

**Schema:**
```sql
-- Staging table for PIC import
CREATE TABLE pic_import_staging (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id),
  config_version_id UUID REFERENCES config_versions(id),

  -- Excel Data
  source_sheet VARCHAR(100),
  source_row INTEGER,

  -- PIC Information (from Excel)
  pic_name VARCHAR(255) NOT NULL,
  pic_email VARCHAR(255),
  pic_phone VARCHAR(50),

  -- Role Assignment
  approval_role_id UUID REFERENCES approval_role_master(id),
  cluster_id UUID REFERENCES cluster_master(id),

  -- Import Status
  import_status VARCHAR(20) DEFAULT 'PENDING',  -- PENDING, MATCHED, CREATED, FAILED
  matched_user_id TEXT REFERENCES users(id),    -- If matched to existing user
  stub_user_id TEXT REFERENCES users(id),        -- If created as stub user

  -- Validation
  validation_status VARCHAR(20),                 -- VALID, INVALID, WARNINGS
  validation_errors TEXT,
  validation_warnings TEXT,

  -- Metadata
  imported_at TIMESTAMP DEFAULT NOW(),
  imported_by TEXT REFERENCES users(id),
  notes TEXT
);

-- Index
CREATE INDEX idx_pic_import_staging_status
  ON pic_import_staging(workspace_id, import_status);

-- Sample Import Process
-- 1. Load Excel data into pic_import_staging
-- 2. Try to match by email/phone to existing users
-- 3. If match found → set matched_user_id, import_status='MATCHED'
-- 4. If no match → create stub user, set stub_user_id, import_status='CREATED'
-- 5. Link to cluster_approver_master
```

**Import Logic:**
```sql
-- Step 1: Match existing users by email
UPDATE pic_import_staging s
SET matched_user_id = u.id,
    import_status = 'MATCHED'
FROM users u
WHERE u.email = s.pic_email
  AND s.import_status = 'PENDING';

-- Step 2: Create stub users for unmatched PICs
INSERT INTO users (email, username, first_name, last_name, is_stub, status)
SELECT
  pic_email,
  COALESCE(pic_email, 'PIC_' || id::text),
  SPLIT_PART(pic_name, ' ', 1),
  CASE
    WHEN POSITION(' ' IN pic_name) > 0
    THEN SUBSTRING(pic_name FROM POSITION(' ' IN pic_name) + 1)
    ELSE ''
  END,
  true,  -- is_stub
  'ACTIVE'
FROM pic_import_staging
WHERE import_status = 'PENDING'
  AND pic_email IS NOT NULL
RETURNING id, pic_email;

-- Step 3: Update staging with stub user IDs
UPDATE pic_import_staging s
SET stub_user_id = u.id,
    import_status = 'CREATED'
FROM users u
WHERE u.email = s.pic_email
  AND s.import_status = 'PENDING'
  AND u.is_stub = true;

-- Step 4: Create cluster_approver_master records
INSERT INTO cluster_approver_master (workspace_id, cluster_id, approval_role_id, primary_user_id, source_reference, config_version_id)
SELECT
  s.workspace_id,
  s.cluster_id,
  s.approval_role_id,
  COALESCE(s.matched_user_id, s.stub_user_id) as user_id,
  'PIC Import Sheet ' || s.source_sheet || ' Row ' || s.source_row,
  s.config_version_id
FROM pic_import_staging s
WHERE s.import_status IN ('MATCHED', 'CREATED')
  AND s.approval_role_id IS NOT NULL
  AND s.cluster_id IS NOT NULL;
```

---

## 6. Supporting Master Tables

### 6.1 Document Type Master ⭐ **RECOMMENDED**

**Purpose:** Define document types for ATP uploads (single/bulk + proof)

**Schema:**
```sql
CREATE TABLE document_type_master (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id),

  -- Document Type
  doc_type_code VARCHAR(50) UNIQUE NOT NULL,    -- ATP_SOFTWARE, ATP_HARDWARE, PHOTO, SUPPORTING_DOC
  doc_type_name VARCHAR(150) NOT NULL,
  doc_category VARCHAR(50),                     -- ATP, PROOF, SUPPORTING

  -- Configuration
  allowed_formats TEXT[],                        -- ['PDF', 'XLSX', 'DOCX', 'JPG', 'PNG']
  max_file_size_mb INTEGER DEFAULT 10,
  is_bulk_upload BOOLEAN DEFAULT false,
  requires_proof BOOLEAN DEFAULT false,

  -- Workflow
  requires_approval BOOLEAN DEFAULT false,
  auto_trigger_workflow BOOLEAN DEFAULT false,

  -- Metadata
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),

  CONSTRAINT document_type_master_unique
    UNIQUE (workspace_id, doc_type_code)
);

-- Sample Data
INSERT INTO document_type_master (doc_type_code, doc_type_name, doc_category, allowed_formats, is_bulk_upload, requires_proof) VALUES
('ATP_SOFTWARE', 'ATP Software Document', 'ATP', ARRAY['PDF', 'XLSX', 'DOCX'], false, true),
('ATP_HARDWARE', 'ATP Hardware Document', 'ATP', ARRAY['PDF', 'XLSX', 'DOCX'], false, true),
('ATP_COMBINED', 'ATP Combined (HW+SW)', 'ATP', ARRAY['PDF', 'XLSX'], false, true),
('ATP_BULK', 'ATP Bulk Upload', 'ATP', ARRAY['ZIP', 'XLSX'], true, true),
('SITE_PHOTO', 'Site Photo', 'PROOF', ARRAY['JPG', 'PNG', 'PDF'], false, false),
('INSTALLATION_PHOTO', 'Installation Photo', 'PROOF', ARRAY['JPG', 'PNG'], false, false),
('COMPLETION_CERT', 'Completion Certificate', 'SUPPORTING', ARRAY['PDF', 'DOCX'], false, false);
```

---

### 6.2 SLA Policy Master (Optional but Recommended) ⭐

**Purpose:** Define SLA policies per hierarchy level or scope/vendor

**Schema:**
```sql
CREATE TABLE sla_policy_master (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id),

  -- SLA Definition
  sla_code VARCHAR(50) UNIQUE NOT NULL,
  sla_name VARCHAR(150) NOT NULL,
  sla_description TEXT,

  -- SLA Rules
  hierarchy_order INTEGER,                       -- Apply to specific hierarchy levels (L2, L3, L4)
  scope_id UUID REFERENCES atp_scope_master(id), -- Apply to specific scope
  vendor_id UUID,                                -- Apply to specific vendor

  -- SLA Values
  sla_hours INTEGER DEFAULT 24,
  sla_days INTEGER DEFAULT 1,
  business_days_only BOOLEAN DEFAULT false,     -- Count only business days

  -- Escalation
  escalation_hours INTEGER,
  escalation_action TEXT,                        -- JSON escalation rules

  -- Metadata
  is_active BOOLEAN DEFAULT true,
  effective_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP DEFAULT NOW(),

  CONSTRAINT sla_policy_master_unique
    UNIQUE (workspace_id, sla_code)
);

-- Sample Data
INSERT INTO sla_policy_master (sla_code, sla_name, hierarchy_order, sla_hours) VALUES
('L2_STANDARD', 'L2 Standard SLA', 2, 24),
('L3_STANDARD', 'L3 Standard SLA', 4, 48),
('L4_STANDARD', 'L4 Standard SLA', 6, 72),
('L5_FINAL', 'L5 Final Approval SLA', 7, 72),

-- Scope-specific SLA
('MW_URGENT', 'MW Urgent SLA', NULL, 12),      -- All MW levels get 12h
('CRITICAL_SITE', 'Critical Site SLA', NULL, 6); -- Critical sites get 6h
```

---

### 6.3 Status Master (Optional) ⭐

**Purpose:** Configurable statuses for submissions, stages, punchlist items

**Schema:**
```sql
CREATE TABLE status_master (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id),

  -- Status Definition
  status_type VARCHAR(50) NOT NULL,              -- SUBMISSION, STAGE, PUNCHLIST, TASK
  status_code VARCHAR(50) NOT NULL,
  status_name VARCHAR(150) NOT NULL,
  status_category VARCHAR(50),                   -- ACTIVE, COMPLETED, CANCELLED, PENDING

  -- Workflow Behavior
  is_terminal BOOLEAN DEFAULT false,             -- Cannot transition from this status
  allow_edit BOOLEAN DEFAULT true,
  allow_delete BOOLEAN DEFAULT false,

  -- Next Statuses (allowed transitions)
  allowed_next_statuses TEXT[],                  -- Array of status codes

  -- Display
  display_color VARCHAR(20),                     -- hex color for UI
  display_icon VARCHAR(50),

  -- Metadata
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),

  CONSTRAINT status_master_unique
    UNIQUE (workspace_id, status_type, status_code)
);

-- Sample Data
INSERT INTO status_master (status_type, status_code, status_name, status_category, is_terminal, allowed_next_statuses) VALUES
-- Submission Statuses
('SUBMISSION', 'DRAFT', 'Draft', 'PENDING', false, ARRAY['SUBMITTED']),
('SUBMISSION', 'SUBMITTED', 'Submitted', 'ACTIVE', false, ARRAY['UNDER_REVIEW', 'APPROVED', 'REJECTED']),
('SUBMISSION', 'UNDER_REVIEW', 'Under Review', 'ACTIVE', false, ARRAY['APPROVED', 'REJECTED', 'INFO_REQUIRED']),
('SUBMISSION', 'APPROVED', 'Approved', 'COMPLETED', true, ARRAY[]),
('SUBMISSION', 'REJECTED', 'Rejected', 'CANCELLED', true, ARRAY[]),

-- Stage Statuses
('STAGE', 'PENDING', 'Pending Approval', 'PENDING', false, ARRAY['IN_PROGRESS', 'SKIPPED']),
('STAGE', 'IN_PROGRESS', 'In Progress', 'ACTIVE', false, ARRAY['COMPLETED', 'APPROVED', 'REJECTED']),
('STAGE', 'COMPLETED', 'Completed', 'COMPLETED', true, ARRAY[]),
('STAGE', 'APPROVED', 'Approved', 'COMPLETED', true, ARRAY[]),
('STAGE', 'REJECTED', 'Rejected', 'CANCELLED', true, ARRAY[]),
('STAGE', 'SKIPPED', 'Skipped', 'CANCELLED', true, ARRAY[]);
```

---

## 7. Implementation Priority

### Phase 1: Core Foundation (Week 1) ⭐ **CRITICAL**

**Priority 1: Config Versions**
1. Create `config_versions` table
2. Implement version lookup logic
3. Add import tracking

**Priority 2: ATP Scope Master**
1. Create `atp_scope_master` with enhancements
2. Add scope_group, requires_cluster, default_template_code
3. Migrate existing scope data from sites table

**Priority 3: Approval Role Master**
1. Create `approval_role_master` (separated from actor type)
2. Add stage_group, hierarchy_order, is_final_approver
3. Create `actor_type_master`
4. Create `approval_role_actor_mapping` (many-to-many)

### Phase 2: Workflow Templates (Week 1) ⭐ **HIGH**

**Priority 4: Workflow Template Master + Stages**
1. Create `workflow_template_master`
2. Create `workflow_template_stages`
3. Define ATP_SOFTWARE, ATP_HARDWARE, ATP_COMBINED templates
4. Implement fallback logic

### Phase 3: Approval Policy (Week 2) ⭐ **HIGH**

**Priority 5: Approval Policy Master + Stages**
1. Create `approval_policy_master`
2. Create `approval_policy_stages`
3. Implement vendor='ALL' fallback
4. Add policy versioning

### Phase 4: Cluster & Approvers (Week 2) ⭐ **HIGH**

**Priority 6: Cluster Master**
1. Create `cluster_master` (Excel directory structure)
2. Import cluster data from Excel
3. Add region/province/city hierarchy

**Priority 7: Cluster Approver Master**
1. Create `cluster_approver_master` (renamed from region_cluster_approver)
2. Import approver mappings from Excel
3. Add primary/backup logic
4. Implement effective/expire dates

**Priority 8: Approver Overrides**
1. Create `approver_overrides` table
2. Implement special case handling
3. Add override approval workflow

### Phase 5: User Management (Week 2-3) ⭐ **MEDIUM**

**Priority 9: User Workspace Memberships**
1. Create `user_workspace_memberships` table
2. Migrate existing user-role data
3. Implement multi-workspace support

**Priority 10: PIC Import**
1. Create `pic_import_staging` table
2. Implement Excel import logic
3. Add user matching/creation logic
4. Link to cluster_approver_master

### Phase 6: Supporting Tables (Week 3) ⭐ **MEDIUM**

**Priority 11: Document Type Master**
1. Create `document_type_master` table
2. Define document types (ATP, photo, supporting)
3. Add file validation rules

**Priority 12: SLA Policy Master**
1. Create `sla_policy_master` table
2. Define hierarchy-based SLAs
3. Link to approval_policy_stages

**Priority 13: Status Master**
1. Create `status_master` table
2. Define configurable statuses
3. Implement status transition logic

---

## 8. Migration Strategy

### 8.1 Database Migration Script

```sql
-- File: migrations/002_create_final_master_tables.sql

BEGIN;

-- 1. Core Foundation
-- (Create tables in order: config_versions → atp_scope_master → approval_role_master → actor_type_master → approval_role_actor_mapping)

-- 2. Workflow Templates
-- (Create: workflow_template_master → workflow_template_stages)

-- 3. Approval Policy
-- (Create: approval_policy_master → approval_policy_stages)

-- 4. Cluster & Approvers
-- (Create: cluster_master → cluster_approver_master → approver_overrides)

-- 5. User Management
-- (Create: user_workspace_memberships → pic_import_staging)

-- 6. Supporting Tables
-- (Create: document_type_master → sla_policy_master → status_master)

COMMIT;
```

### 8.2 Data Migration

```sql
-- Migrate existing scopes
INSERT INTO atp_scope_master (workspace_id, scope_code, scope_name, category_code, atp_type)
SELECT DISTINCT
  (SELECT id FROM workspaces WHERE code = 'XLSMART-AVIAT'),
  scope,
  scope,
  'UPGRADE',
  'BOTH'
FROM sites
WHERE scope IS NOT NULL
ON CONFLICT (workspace_id, scope_code) DO NOTHING;

-- Migrate existing roles
INSERT INTO approval_role_master (workspace_id, role_code, role_name, hierarchy_order)
SELECT DISTINCT
  (SELECT id FROM workspaces WHERE code = 'XLSMART-AVIAT'),
  CASE role
    WHEN 'SME Team' THEN 'SME'
    WHEN 'NOC Head' THEN 'NOC_HEAD'
    WHEN 'RTH Head' THEN 'RTH_HEAD'
    WHEN 'Document Control' THEN 'DOC_CONTROL'
    WHEN 'Business Ops' THEN 'BO'
    ELSE role
  END,
  role,
  CASE
    WHEN role = 'admin' THEN 10
    WHEN role LIKE '%Head%' THEN 7
    WHEN role LIKE '%Team%' THEN 6
    WHEN role = 'SME Team' THEN 2
    ELSE 1
  END
FROM users
WHERE role IS NOT NULL
ON CONFLICT (workspace_id, role_code) DO NOTHING;
```

---

## Summary

### Complete Master Tables List (11 Tables + 2 Existing)

1. ✅ **workspaces** - EXISTING (multi-tenant isolation)
2. ⭐ **config_versions** - NEW (Excel versioning - CRITICAL)
3. ⭐ **atp_scope_master** - ENHANCED (with scope_group, requires_cluster)
4. ⭐ **workflow_template_master + workflow_template_stages** - NEW (fallback templates)
5. ⭐ **approval_role_master** - REVISED (separated from actor type)
6. ⭐ **actor_type_master** - NEW (CUSTOMER/VENDOR/PLATFORM_OWNER)
7. ⭐ **approval_role_actor_mapping** - NEW (many-to-many role-actor)
8. ⭐ **approval_policy_master + approval_policy_stages** - REVISED (was approval_matrix)
9. ⭐ **cluster_master** - NEW (directory with m_sequence)
10. ⭐ **cluster_approver_master** - REVISED (was region_cluster_approver)
11. ⭐ **approver_overrides** - NEW (special cases)
12. ⭐ **user_workspace_memberships** - NEW (multi-workspace roles)
13. ⭐ **pic_import_staging** - NEW (PIC import handling)
14. ⭐ **document_type_master** - NEW (ATP, photo, supporting docs)
15. ⭐ **sla_policy_master** - NEW (optional but recommended)
16. ⭐ **status_master** - NEW (optional)

### Key Improvements from Feedback

1. ✅ Separated approval role from actor type
2. ✅ Split approval_matrix into policy + stages
3. ✅ Added cluster directory (cluster_master)
4. ✅ Added config versioning (config_versions)
5. ✅ Added workflow template fallback
6. ✅ Added override mechanism
7. ✅ Proper naming throughout
8. ✅ Multi-workspace user support
9. ✅ PIC import with user matching/creation

---

**Document Status:** ✅ COMPLETE - Ready for Implementation
**Last Updated:** 2025-12-29
**Next Steps:** Create Prisma schema & migration scripts
