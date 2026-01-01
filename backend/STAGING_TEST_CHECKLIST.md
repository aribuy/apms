# Staging Test Checklist - Master Tables Deployment

**Date:** 2025-12-29
**Migration:** `20251229010228_add_master_tables_final_v2`
**Environment:** Staging (apmsstaging.datacodesolution.com)
**Status:** ⏳ PENDING EXECUTION

---

## 🎯 Test Objectives

Verify that the master tables implementation is:
1. ✅ Schema integrity complete (16 tables, all FKs valid)
2. ✅ Config version lifecycle working (DRAFT → ACTIVE → ARCHIVED)
3. ✅ Runtime workflow execution successful (create → approve → punchlist → complete)
4. ✅ Workspace isolation enforced (no cross-workspace data leakage)

---

## 📋 Test Prerequisites

### Database Access
- [ ] SSH access to staging server: `ssh apms@apmsstaging.datacodesolution.com`
- [ ] Database connection: `psql -U apms_staging -d apms_staging`
- [ ] Backup created before deployment
- [ ] Migration files copied to `/tmp/`

### Test Data
- [ ] Test workspace available (workspace_id)
- [ ] Test users available (approver users, submitter users)
- [ ] Test site available (site_id for ATP submission)
- [ ] Excel files ready for import:
  - [ ] ATP Scope Definition Excel
  - [ ] Approval Matrix Excel
  - [ ] Cluster Mapping Excel

---

## 🔍 SECTION A: Schema Integrity Tests

### A1. Table Creation Verification
**Status:** ⏳ NOT TESTED

```sql
-- Verify all 16 tables created
SELECT COUNT(*) as table_count
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'config_versions', 'atp_scope_master', 'vendor_master',
    'approval_role_master', 'approval_policy_master', 'approval_policy_stages',
    'cluster_master', 'cluster_approver_master', 'workflow_instances',
    'workflow_stages', 'approver_overrides', 'atp_submissions',
    'atp_submission_documents', 'punchlists', 'punchlist_items',
    'workflow_stage_actions'
  );
```

**Expected Result:** 16
**Actual Result:** _____
**Status:** ⬜ PASS ⬜ FAIL

---

### A2. Foreign Key Validation
**Status:** ⏳ NOT TESTED

```sql
-- Verify foreign keys exist
SELECT COUNT(*) as fk_count
FROM pg_constraint
WHERE contype = 'f'
  AND conrelid::regclass::text IN (
    'config_versions', 'atp_scope_master', 'vendor_master',
    'approval_role_master', 'approval_policy_master', 'approval_policy_stages',
    'cluster_master', 'cluster_approver_master', 'workflow_instances',
    'workflow_stages', 'approver_overrides', 'atp_submissions',
    'atp_submission_documents', 'punchlists', 'punchlist_items',
    'workflow_stage_actions'
  );
```

**Expected Result:** 45+ foreign keys
**Actual Result:** _____
**Status:** ⬜ PASS ⬜ FAIL

**Additional Verification:**
```sql
-- Check for orphaned records (should return 0)
SELECT 'config_versions' as table_name, COUNT(*) as orphan_count
FROM config_versions cv
LEFT JOIN workspaces w ON cv.workspace_id = w.id
WHERE w.id IS NULL

UNION ALL

SELECT 'atp_scope_master', COUNT(*)
FROM atp_scope_master asm
LEFT JOIN config_versions cv ON asm.config_version_id = cv.id
WHERE cv.id IS NULL

UNION ALL

SELECT 'workflow_instances', COUNT(*)
FROM workflow_instances wi
LEFT JOIN config_versions cv ON wi.config_version_id = cv.id
WHERE cv.id IS NULL;
```

**Expected Result:** 0 orphaned records for all tables
**Actual Result:** _____
**Status:** ⬜ PASS ⬜ FAIL

---

### A3. CHECK Constraints Validation
**Status:** ⏳ NOT TESTED

```sql
-- Verify CHECK constraints exist
SELECT COUNT(*) as check_constraint_count
FROM pg_constraint
WHERE contype = 'c'
  AND conrelid::regclass::text IN (
    'config_versions', 'atp_scope_master', 'vendor_master',
    'approval_role_master', 'approval_policy_master', 'approval_policy_stages',
    'cluster_master', 'cluster_approver_master', 'workflow_instances',
    'workflow_stages', 'approver_overrides', 'atp_submissions',
    'atp_submission_documents', 'punchlists', 'punchlist_items',
    'workflow_stage_actions'
  );
```

**Expected Result:** 22 CHECK constraints
**Actual Result:** _____
**Status:** ⬜ PASS ⬜ FAIL

**Test CHECK Constraints Enforcement:**
```sql
-- Test 1: Try to insert invalid status (should FAIL)
INSERT INTO config_versions (
  id, workspace_id, source_file_name, source_type,
  version_number, status, imported_by
) VALUES (
  gen_random_uuid(),
  (SELECT id FROM workspaces LIMIT 1),
  'test.txt',
  'INVALID_TYPE',  -- Invalid source_type
  1,
  'DRAFT',
  'test_user'
);
-- Expected: ERROR: CHECK constraint violated
```

**Expected Result:** ERROR
**Actual Result:** _____
**Status:** ⬜ PASS ⬜ FAIL

---

### A4. Partial Unique Index Verification
**Status:** ⏳ NOT TESTED

```sql
-- Check partial unique index exists
SELECT indexname, indexdef
FROM pg_indexes
WHERE indexname = 'ux_config_versions_one_active_per_workspace';
```

**Expected Result:** Index with WHERE clause `WHERE "status" = 'ACTIVE'`
**Actual Result:** _____
**Status:** ⬜ PASS ⬜ FAIL

**Test Partial Unique Index Enforcement:**
```sql
-- Test 1: Insert first ACTIVE config (should SUCCEED)
INSERT INTO config_versions (
  id, workspace_id, source_file_name, source_type,
  version_number, status, imported_by
) VALUES (
  gen_random_uuid(),
  (SELECT id FROM workspaces LIMIT 1),
  'test1.txt',
  'APPROVAL_MATRIX',
  1,
  'ACTIVE',  -- First ACTIVE
  'test_user'
);

-- Test 2: Insert second ACTIVE config for same workspace + source_type (should FAIL)
INSERT INTO config_versions (
  id, workspace_id, source_file_name, source_type,
  version_number, status, imported_by
) VALUES (
  gen_random_uuid(),
  (SELECT id FROM workspaces LIMIT 1),
  'test2.txt',
  'APPROVAL_MATRIX',  -- Same source_type
  2,
  'ACTIVE',  -- Second ACTIVE - should FAIL
  'test_user'
);
-- Expected: ERROR: duplicate key value violates unique constraint
```

**Expected Result:** Second INSERT fails with duplicate key error
**Actual Result:** _____
**Status:** ⬜ PASS ⬜ FAIL

---

### A5. Data Type Alignment
**Status:** ⏳ NOT TESTED

```sql
-- Verify user FK fields are TEXT (not UUID)
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('atp_scope_master', 'workflow_instances', 'workflow_stages')
  AND column_name LIKE '%user%'
ORDER BY table_name, column_name;
```

**Expected Result:** All user_id fields = `text`
**Actual Result:** _____
**Status:** ⬜ PASS ⬜ FAIL

**Verify workspace FK fields are UUID:**
```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'atp_scope_master'
  AND column_name IN ('id', 'workspace_id', 'config_version_id');
```

**Expected Result:**
- `id` = `uuid`
- `workspace_id` = `uuid`
- `config_version_id` = `text`

**Actual Result:** _____
**Status:** ⬜ PASS ⬜ FAIL

---

## 🔄 SECTION B: Config Version Lifecycle Tests

### B1. Create DRAFT Config Version
**Status:** ⏳ NOT TESTED

```sql
-- Create DRAFT config version
INSERT INTO config_versions (
  id, workspace_id, source_file_name, source_type,
  version_number, status, imported_by, row_count
) VALUES (
  gen_random_uuid(),
  (SELECT id FROM workspaces WHERE name = 'Test Workspace' LIMIT 1),
  'atp_scopes_v1.xlsx',
  'SCOPE_CONFIG',
  1,
  'DRAFT',  -- Initial status
  'admin_user',
  150
)
RETURNING id, status, version_number;
```

**Expected Result:** Record created with status = 'DRAFT'
**Actual Result:** _____
**Status:** ⬜ PASS ⬜ FAIL
**Config Version ID:** `________________` (save for next tests)

---

### B2. DRAFT → ACTIVE Transition
**Status:** ⏳ NOT TESTED

```sql
-- Update DRAFT to ACTIVE
UPDATE config_versions
SET
  status = 'ACTIVE',
  activated_at = NOW(),
  validation_status = 'VALID'
WHERE id = '________________'  -- Use config_version_id from B1
RETURNING id, status, activated_at;
```

**Expected Result:** status = 'ACTIVE', activated_at is NOT NULL
**Actual Result:** _____
**Status:** ⬜ PASS ⬜ FAIL

---

### B3. Create Second Version (Should be DRAFT)
**Status:** ⏳ NOT TESTED

```sql
-- Create new DRAFT version
INSERT INTO config_versions (
  id, workspace_id, source_file_name, source_type,
  version_number, status, imported_by, previous_version_id
) VALUES (
  gen_random_uuid(),
  (SELECT id FROM workspaces WHERE name = 'Test Workspace' LIMIT 1),
  'atp_scopes_v2.xlsx',
  'SCOPE_CONFIG',
  2,
  'DRAFT',  -- New version starts as DRAFT
  'admin_user',
  '________________'  -- Reference to B1 config_version_id
)
RETURNING id, status, version_number, previous_version_id;
```

**Expected Result:** status = 'DRAFT', version_number = 2
**Actual Result:** _____
**Status:** ⬜ PASS ⬜ FAIL
**Config Version ID:** `________________` (save for supersede test)

---

### B4. ACTIVE → ARCHIVED → SUPERSEDED Transition
**Status:** ⏳ NOT TESTED

```sql
-- Step 1: Archive old ACTIVE version
UPDATE config_versions
SET status = 'ARCHIVED', archived_at = NOW()
WHERE id = '________________'  -- B1 config_version_id (old ACTIVE)
RETURNING id, status;

-- Step 2: Activate new version
UPDATE config_versions
SET
  status = 'ACTIVE',
  activated_at = NOW()
WHERE id = '________________'  -- B3 config_version_id (new version)
RETURNING id, status;

-- Step 3: Update old version to SUPERSEDED
UPDATE config_versions
SET status = 'SUPERSEDED', superseded_by_id = '________________'  -- B3 config_version_id
WHERE id = '________________'  -- B1 config_version_id
RETURNING id, status, superseded_by_id;
```

**Expected Result:**
- Old version (B1): status = 'SUPERSEDED', superseded_by_id points to B3
- New version (B3): status = 'ACTIVE'

**Actual Result:** _____
**Status:** ⬜ PASS ⬜ FAIL

---

### B5. Verify Version Chain Integrity
**Status:** ⏳ NOT TESTED

```sql
-- Query version chain
SELECT
  cv1.id as old_version_id,
  cv1.status as old_status,
  cv1.version_number as old_version,
  cv1.superseded_by_id,
  cv2.id as new_version_id,
  cv2.status as new_status,
  cv2.version_number as new_version
FROM config_versions cv1
LEFT JOIN config_versions cv2 ON cv1.superseded_by_id = cv2.id
WHERE cv1.workspace_id = (SELECT id FROM workspaces WHERE name = 'Test Workspace' LIMIT 1)
ORDER BY cv1.version_number;
```

**Expected Result:** Complete chain showing version progression
**Actual Result:** _____
**Status:** ⬜ PASS ⬜ FAIL

---

## 🚀 SECTION C: Runtime Workflow Tests

### C1. Create ATP Scope Master Records
**Status:** ⏳ NOT TESTED

```sql
-- Insert test ATP scopes
INSERT INTO atp_scope_master (
  id, workspace_id, config_version_id, scope_code, scope_name,
  scope_group, atp_type, description
) VALUES
  (gen_random_uuid(), (SELECT id FROM workspaces WHERE name = 'Test Workspace' LIMIT 1),
   '________________', 'MW-001', 'Microwave Installation Phase 1',
   'MICROWAVE', 'HARDWARE', 'Test scope'),
  (gen_random_uuid(), (SELECT id FROM workspaces WHERE name = 'Test Workspace' LIMIT 1),
   '________________', 'RAN-001', 'RAN Commissioning',
   'RAN', 'SOFTWARE', 'Test scope')
RETURNING id, scope_code, scope_group;
```

**Expected Result:** 2 scopes created
**Actual Result:** _____
**Status:** ⬜ PASS ⬜ FAIL

---

### C2. Create Approval Policy Master + Stages
**Status:** ⏳ NOT TESTED

```sql
-- Create approval policy
INSERT INTO approval_policy_master (
  id, workspace_id, config_version_id, policy_name, policy_code,
  atp_category, description, is_active
) VALUES (
  gen_random_uuid(),
  (SELECT id FROM workspaces WHERE name = 'Test Workspace' LIMIT 1),
  '________________',  -- ACTIVE config_version_id
  'Standard ATP Workflow',
  'ATP_STD',
  'BOTH',
  'Standard approval chain for ATP',
  true
)
RETURNING id as policy_id;

-- Create approval stages
INSERT INTO approval_policy_stages (
  id, workspace_id, config_version_id, approval_policy_id,
  stage_name, stage_code, sequence_order, stage_group,
  assignment_mode, static_user_id, sla_hours
) VALUES
  (gen_random_uuid(),
   (SELECT id FROM workspaces WHERE name = 'Test Workspace' LIMIT 1),
   '________________',
   (SELECT id FROM approval_policy_master WHERE policy_code = 'ATP_STD' LIMIT 1),
   'Backend Review', 'BO', 1, 'REVIEW', 'STATIC_USER',
   (SELECT id FROM users WHERE email = 'test_approver@example.com' LIMIT 1), 24),
  (gen_random_uuid(),
   (SELECT id FROM workspaces WHERE name = 'Test Workspace' LIMIT 1),
   '________________',
   (SELECT id FROM approval_policy_master WHERE policy_code = 'ATP_STD' LIMIT 1),
   'NOC Head Approval', 'NOC_HEAD', 2, 'SIGN', 'STATIC_USER',
   (SELECT id FROM users WHERE email = 'test_noc@example.com' LIMIT 1), 48)
RETURNING id, stage_name, sequence_order;
```

**Expected Result:** 1 policy + 2 stages created
**Actual Result:** _____
**Status:** ⬜ PASS ⬜ FAIL

---

### C3. Create Runtime Workflow Instance
**Status:** ⏳ NOT TESTED

```sql
-- Create workflow instance (frozen config_version_id)
INSERT INTO workflow_instances (
  id, workspace_id, config_version_id, approval_policy_id,
  site_id, site_name, scope_id, atp_category,
  status, current_stage, submitted_by
) VALUES (
  gen_random_uuid(),
  (SELECT id FROM workspaces WHERE name = 'Test Workspace' LIMIT 1),
  '________________',  -- Frozen reference to ACTIVE config
  (SELECT id FROM approval_policy_master WHERE policy_code = 'ATP_STD' LIMIT 1),
  'SITE-001',
  'Test Site 1',
  (SELECT id FROM atp_scope_master WHERE scope_code = 'MW-001' LIMIT 1),
  'HARDWARE',
  'IN_PROGRESS',
  1,  -- Current stage = first stage
  (SELECT id FROM users WHERE email = 'test_submitter@example.com' LIMIT 1)
)
RETURNING id, status, current_stage, config_version_id as frozen_config;
```

**Expected Result:** Workflow created with frozen config_version_id
**Actual Result:** _____
**Status:** ⬜ PASS ⬜ FAIL
**Workflow Instance ID:** `________________` (save for next tests)

---

### C4. Create Workflow Stages (Runtime)
**Status:** ⏳ NOT TESTED

```sql
-- Create workflow stages from policy stages
INSERT INTO workflow_stages (
  id, workspace_id, workflow_instance_id,
  stage_code, stage_name, stage_group,
  sequence_order, approver_user_id,
  sla_hours, sla_deadline, status
)
SELECT
  gen_random_uuid(),
  wi.workspace_id,
  '________________',  -- Workflow instance ID from C3
  ps.stage_code,
  ps.stage_name,
  ps.stage_group,
  ps.sequence_order,
  ps.static_user_id,  -- Assign approver
  ps.sla_hours,
  NOW() + (ps.sla_hours || ' hours')::interval,
  'PENDING'  -- Initial status
FROM approval_policy_stages ps
WHERE ps.approval_policy_id = (SELECT id FROM approval_policy_master WHERE policy_code = 'ATP_STD' LIMIT 1)
ORDER BY ps.sequence_order
RETURNING id, stage_name, approver_user_id, status;
```

**Expected Result:** 2 stages created with status = 'PENDING'
**Actual Result:** _____
**Status:** ⬜ PASS ⬜ FAIL

---

### C5. Simulate Stage Approval
**Status:** ⏳ NOT TESTED

```sql
-- Step 1: Approve first stage
UPDATE workflow_stages
SET
  status = 'APPROVED',
  decided_at = NOW(),
  decided_by_user_id = (SELECT id FROM users WHERE email = 'test_approver@example.com' LIMIT 1),
  comments = 'Test approval'
WHERE workflow_instance_id = '________________'  -- From C3
  AND sequence_order = 1
RETURNING id, status, decided_at;

-- Step 2: Create audit log entry
INSERT INTO workflow_stage_actions (
  id, workspace_id, workflow_stage_id,
  action_type, action_by_user_id,
  action_at, comments, previous_status, new_status
)
SELECT
  gen_random_uuid(),
  ws.workspace_id,
  ws.id,
  'APPROVE',
  (SELECT id FROM users WHERE email = 'test_approver@example.com' LIMIT 1),
  NOW(),
  'Test approval',
  'PENDING',
  'APPROVED'
FROM workflow_stages ws
WHERE ws.workflow_instance_id = '________________'
  AND ws.sequence_order = 1;
```

**Expected Result:** Stage status = 'APPROVED', audit log entry created
**Actual Result:** _____
**Status:** ⬜ PASS ⬜ FAIL

---

### C6. Create ATP Submission
**Status:** ⏳ NOT TESTED

```sql
-- Create ATP submission linked to workflow
INSERT INTO atp_submissions (
  id, workspace_id, workflow_instance_id,
  site_id, scope_id, atp_category,
  submission_title, description, status,
  submitted_by, submitted_at
) VALUES (
  gen_random_uuid(),
  (SELECT id FROM workspaces WHERE name = 'Test Workspace' LIMIT 1),
  '________________',  -- From C3
  'SITE-001',
  (SELECT id FROM atp_scope_master WHERE scope_code = 'MW-001' LIMIT 1),
  'HARDWARE',
  'ATP Submission for SITE-001',
  'Test ATP submission',
  'SUBMITTED',
  (SELECT id FROM users WHERE email = 'test_submitter@example.com' LIMIT 1),
  NOW()
)
RETURNING id, status, submitted_at;
```

**Expected Result:** ATP submission created with status = 'SUBMITTED'
**Actual Result:** _____
**Status:** ⬜ PASS ⬜ FAIL

---

### C7. Create Punchlist
**Status:** ⏳ NOT TESTED

```sql
-- Create punchlist for workflow
INSERT INTO punchlists (
  id, workspace_id, workflow_instance_id,
  punchlist_title, description, status,
  created_by, created_at
) VALUES (
  gen_random_uuid(),
  (SELECT id FROM workspaces WHERE name = 'Test Workspace' LIMIT 1),
  '________________',  -- From C3
  'Test Punchlist',
  'Items to fix before approval',
  'OPEN',
  (SELECT id FROM users WHERE email = 'test_approver@example.com' LIMIT 1),
  NOW()
)
RETURNING id, status;

-- Create punchlist items
INSERT INTO punchlist_items (
  id, workspace_id, punchlist_id,
  item_description, severity, status,
  evidence_required, created_at
) VALUES
  (gen_random_uuid(),
   (SELECT id FROM workspaces WHERE name = 'Test Workspace' LIMIT 1),
   (SELECT id FROM punchlists WHERE workflow_instance_id = '________________' LIMIT 1),
   'Fix documentation error',
   'HIGH',
   'OPEN',
   true,
   NOW()),
  (gen_random_uuid(),
   (SELECT id FROM workspaces WHERE name = 'Test Workspace' LIMIT 1),
   (SELECT id FROM punchlists WHERE workflow_instance_id = '________________' LIMIT 1),
   'Upload missing photo',
   'MEDIUM',
   'OPEN',
   true,
   NOW())
RETURNING id, item_description, status;
```

**Expected Result:** 1 punchlist + 2 items created
**Actual Result:** _____
**Status:** ⬜ PASS ⬜ FAIL

---

### C8. Verify Freeze by Reference (Config Integrity)
**Status:** ⏳ NOT TESTED

```sql
-- Verify workflow instance is frozen to specific config version
SELECT
  wi.id as workflow_id,
  wi.status as workflow_status,
  wi.config_version_id as frozen_config,
  cv.status as config_status,
  cv.version_number,
  COUNT(ws.id) as total_stages,
  COUNT(CASE WHEN ws.status = 'APPROVED' THEN 1 END) as approved_stages
FROM workflow_instances wi
JOIN config_versions cv ON wi.config_version_id = cv.id
LEFT JOIN workflow_stages ws ON wi.id = ws.workflow_instance_id
WHERE wi.id = '________________'  -- From C3
GROUP BY wi.id, cv.id;
```

**Expected Result:**
- frozen_config points to config version
- config_status should be 'ACTIVE' or 'ARCHIVED' (never DRAFT)
- Runtime workflow should NOT be affected by new DRAFT config versions

**Actual Result:** _____
**Status:** ⬜ PASS ⬜ FAIL

**Test Freeze Integrity:**
```sql
-- Create new DRAFT config version (should NOT affect running workflow)
INSERT INTO config_versions (
  id, workspace_id, source_file_name, source_type,
  version_number, status, imported_by
) VALUES (
  gen_random_uuid(),
  (SELECT id FROM workspaces WHERE name = 'Test Workspace' LIMIT 1),
  'new_config.xlsx',
  'SCOPE_CONFIG',
  3,
  'DRAFT',  -- New DRAFT version
  'admin_user'
);

-- Query workflow again - should still use frozen config
SELECT
  wi.id,
  wi.config_version_id as frozen_config,
  cv.status as frozen_config_status,
  cv.version_number as frozen_version
FROM workflow_instances wi
JOIN config_versions cv ON wi.config_version_id = cv.id
WHERE wi.id = '________________';
```

**Expected Result:** Workflow still uses frozen config (version 1 or 2), NOT new DRAFT (version 3)
**Actual Result:** _____
**Status:** ⬜ PASS ⬜ FAIL

---

## 🏢 SECTION D: Workspace Isolation Tests

### D1. Verify Workspace Scoping on Master Tables
**Status:** ⏳ NOT TESTED

```sql
-- Check that all master config tables are workspace-scoped
SELECT
  'config_versions' as table_name,
  COUNT(DISTINCT workspace_id) as workspace_count,
  COUNT(*) as total_records
FROM config_versions
UNION ALL
SELECT
  'atp_scope_master',
  COUNT(DISTINCT workspace_id),
  COUNT(*)
FROM atp_scope_master
UNION ALL
SELECT
  'approval_policy_master',
  COUNT(DISTINCT workspace_id),
  COUNT(*)
FROM approval_policy_master;
```

**Expected Result:** All records properly scoped to workspaces
**Actual Result:** _____
**Status:** ⬜ PASS ⬜ FAIL

---

### D2. Verify No Cross-Workspace Data Access
**Status:** ⏳ NOT TESTED

```sql
-- Create 2 test workspaces (if not exists)
-- Workspace A
INSERT INTO workspaces (id, name, code, created_by) VALUES (
  gen_random_uuid(), 'Test Workspace A', 'TEST-A', 'admin'
) ON CONFLICT DO NOTHING;

-- Workspace B
INSERT INTO workspaces (id, name, code, created_by) VALUES (
  gen_random_uuid(), 'Test Workspace B', 'TEST-B', 'admin'
) ON CONFLICT DO NOTHING;

-- Insert config for Workspace A
INSERT INTO config_versions (
  id, workspace_id, source_file_name, source_type,
  version_number, status, imported_by
) VALUES (
  gen_random_uuid(),
  (SELECT id FROM workspaces WHERE code = 'TEST-A' LIMIT 1),
  'config_a.xlsx',
  'SCOPE_CONFIG',
  1,
  'ACTIVE',
  'admin_a'
);

-- Insert config for Workspace B
INSERT INTO config_versions (
  id, workspace_id, source_file_name, source_type,
  version_number, status, imported_by
) VALUES (
  gen_random_uuid(),
  (SELECT id FROM workspaces WHERE code = 'TEST-B' LIMIT 1),
  'config_b.xlsx',
  'SCOPE_CONFIG',
  1,
  'ACTIVE',
  'admin_b'
);
```

**Test Cross-Workspace Query Prevention:**
```sql
-- Verify Workspace A cannot see Workspace B's configs
SELECT
  w.name as workspace_name,
  COUNT(cv.id) as config_count
FROM workspaces w
LEFT JOIN config_versions cv ON cv.workspace_id = w.id
WHERE w.code IN ('TEST-A', 'TEST-B')
GROUP BY w.id, w.name
ORDER BY w.name;
```

**Expected Result:**
- Workspace A: Only sees its own configs
- Workspace B: Only sees its own configs

**Actual Result:** _____
**Status:** ⬜ PASS ⬜ FAIL

---

### D3. Verify Runtime Isolation
**Status:** ⏳ NOT TESTED

```sql
-- Verify workflow instances are workspace-isolated
SELECT
  w.name as workspace_name,
  COUNT(wi.id) as workflow_count
FROM workspaces w
LEFT JOIN workflow_instances wi ON wi.workspace_id = w.id
WHERE w.code IN ('TEST-A', 'TEST-B')
GROUP BY w.id, w.name;
```

**Expected Result:** Each workspace only sees its own workflows
**Actual Result:** _____
**Status:** ⬜ PASS ⬜ FAIL

---

### D4. Verify Cascade Delete Behavior
**Status:** ⏳ NOT TESTED

**WARNING:** DESTRUCTIVE TEST - Use test workspace only

```sql
-- Test cascade delete from workspace
-- Step 1: Count records before delete
SELECT 'config_versions' as table_name, COUNT(*) as count
FROM config_versions
WHERE workspace_id = (SELECT id FROM workspaces WHERE code = 'TEST-A' LIMIT 1)

UNION ALL
SELECT 'atp_scope_master', COUNT(*)
FROM atp_scope_master
WHERE workspace_id = (SELECT id FROM workspaces WHERE code = 'TEST-A' LIMIT 1);

-- Step 2: Delete workspace (should cascade)
DELETE FROM workspaces
WHERE code = 'TEST-A'
RETURNING id, name;

-- Step 3: Verify orphaned records (should be 0)
SELECT 'config_versions' as table_name, COUNT(*) as orphan_count
FROM config_versions cv
LEFT JOIN workspaces w ON cv.workspace_id = w.id
WHERE w.id IS NULL

UNION ALL
SELECT 'atp_scope_master', COUNT(*)
FROM atp_scope_master asm
LEFT JOIN workspaces w ON asm.workspace_id = w.id
WHERE w.id IS NULL;
```

**Expected Result:**
- Step 1: Shows records before delete
- Step 2: Workspace deleted
- Step 3: 0 orphaned records (cascade worked)

**Actual Result:** _____
**Status:** ⬜ PASS ⬜ FAIL

---

## 📊 SECTION E: Performance Indexes Tests

### E1. Verify Performance Indexes Created
**Status:** ⏳ NOT TESTED

```sql
-- Check all performance indexes exist
SELECT COUNT(*) as index_count
FROM pg_indexes
WHERE schemaname = 'public'
  AND indexname LIKE 'idx_%';
```

**Expected Result:** 25+ indexes (see performance_indexes.sql)
**Actual Result:** _____
**Status:** ⬜ PASS ⬜ FAIL

---

### E2. Test Pending Tasks Query Performance
**Status:** ⏳ NOT TESTED

```sql
-- Test query: Find all pending tasks for a user
EXPLAIN ANALYZE
SELECT ws.*, wi.site_name
FROM workflow_stages ws
JOIN workflow_instances wi ON ws.workflow_instance_id = wi.id
WHERE ws.approver_user_id = (SELECT id FROM users LIMIT 1)
  AND ws.status = 'PENDING'
ORDER BY ws.created_at DESC
LIMIT 50;
```

**Expected Result:** Query uses index `idx_workflow_stages_pending_by_user`
**Actual Result:** _____
**Status:** ⬜ PASS ⬜ FAIL

---

### E3. Test SLA Query Performance
**Status:** ⏳ NOT TESTED

```sql
-- Test query: Find overdue stages
EXPLAIN ANALYZE
SELECT ws.*, wi.site_name
FROM workflow_stages ws
JOIN workflow_instances wi ON ws.workflow_instance_id = wi.id
WHERE ws.sla_deadline < NOW()
  AND ws.status IN ('PENDING', 'IN_REVIEW')
ORDER BY ws.sla_deadline;
```

**Expected Result:** Query uses index `idx_workflow_stages_overdue`
**Actual Result:** _____
**Status:** ⬜ PASS ⬜ FAIL

---

## ✅ FINAL VALIDATION SUMMARY

### Test Results Overview
- **Section A (Schema Integrity):** ⬜ ALL PASS (___/5 tests)
- **Section B (Config Lifecycle):** ⬜ ALL PASS (___/5 tests)
- **Section C (Runtime Workflow):** ⬜ ALL PASS (___/8 tests)
- **Section D (Workspace Isolation):** ⬜ ALL PASS (___/4 tests)
- **Section E (Performance):** ⬜ ALL PASS (___/3 tests)

### Overall Status
**Total Tests:** ___/25
**Passed:** ___
**Failed:** ___
**Success Rate:** ___%

### Go/No-Go Recommendation
**Decision:** ⬜ GO FOR PRODUCTION ⬜ HOLD ⬜ NEEDS INVESTIGATION

**Reasons:**
___________________________________________
___________________________________________
___________________________________________

**Approved By:** ____________________
**Date:** ____________________
**Signature:** ____________________

---

## 📝 Test Execution Notes

### Test Environment
- Server: apmsstaging.datacodesolution.com
- Database: apms_staging
- Tester Name: ____________________
- Test Date/Time: ____________________
- Backup Location: ____________________

### Issues Found
1. ___________________________________________
2. ___________________________________________
3. ___________________________________________

### Workarounds Applied
1. ___________________________________________
2. ___________________________________________

### Additional Notes
___________________________________________
___________________________________________
___________________________________________

---

**End of Staging Test Checklist**

Next Steps:
1. Execute all tests sequentially
2. Document actual results
3. Investigate any failures
4. Re-test failed scenarios
5. Obtain Go/No-Go approval
6. Deploy to production (if GO)
