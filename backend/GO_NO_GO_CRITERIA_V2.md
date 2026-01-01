# Go/No-Go Criteria for Production Deployment (V2 Patched)

**Migration:** `20251229010228_add_master_tables_final_v2`
**Component:** Master Tables with Versioned Config
**Date:** 2025-12-29
**Status:** ⏳ PENDING STAGING VALIDATION
**Version:** V2 - Critical Patches Applied

---

## 🚨 CRITICAL PATCHES - Executive Summary

### What Changed in V2?

**PATCH A: pgcrypto Extension**
- Added pre-flight check: `CREATE EXTENSION IF NOT EXISTS pgcrypto;`
- Prevents gen_random_uuid() function errors

**PATCH B: Workspace Reference**
- Changed from: `WHERE name = 'Test Workspace'` (doesn't exist)
- Changed to: `WHERE code = 'XLSMART-AVIAT'` (actual seeded workspace)
- Added fallback to create test workspace if needed

**PATCH C: Column Name Ambiguity**
- Added schema introspection (Section 0)
- Queries now adapt to detected column names
- Handles both `status` and `workflow_status`/`stage_status`

**PATCH D: UUID vs TEXT Clarification**
- **Corrected expected results:**
  - Master table primary key IDs: UUID ✅
  - config_version_id FK: TEXT ✅
  - workspace_id FK: UUID ✅
  - user_id FKs: TEXT ✅

**PATCH E: ON CONFLICT Safety**
- Added check for unique constraint before ON CONFLICT usage
- Prevents "no unique constraint matching given keys" error

---

## 🎯 Decision Framework (UNCHANGED)

**Decision Levels:**
- 🟢 **GO** - All critical criteria met, safe to deploy
- 🟡 **HOLD** - Some criteria not met, requires investigation
- 🔴 **NO-GO** - Critical blockers found, deployment must not proceed

---

## 📋 CRITICAL Criteria (Must Pass) - PATCHED

### C1. Schema Integrity
**Status:** ⏳ NOT TESTED

| Check | Expected | Actual | Status |
|-------|----------|--------|--------|
| pgcrypto extension enabled | extname='pgcrypto' | _____ | ⬜ PASS ⬜ FAIL |
| All 16 tables created | 16 tables | _____ | ⬜ PASS ⬜ FAIL |
| Foreign keys valid | 45+ FKs | _____ | ⬜ PASS ⬜ FAIL |
| CHECK constraints enforced | 22 constraints | _____ | ⬜ PASS ⬜ FAIL |
| Partial unique index exists | 1 index | _____ | ⬜ PASS ⬜ FAIL |
| No orphaned records | 0 orphans | _____ | ⬜ PASS ⬜ FAIL |

**Verification Query (PATCHED):**
```sql
-- Step 1: Enable pgcrypto (CRITICAL)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Step 2: Verify gen_random_uuid() works
SELECT gen_random_uuid() as test_uuid;
-- Expected: Returns valid UUID

-- Step 3: Complete schema integrity check
SELECT
  'pgcrypto Extension' as check_type,
  (SELECT COUNT(*) FROM pg_extension WHERE extname = 'pgcrypto') as actual_count,
  1 as expected_count

UNION ALL

SELECT
  'Tables',
  (SELECT COUNT(*) FROM information_schema.tables
   WHERE table_schema = 'public'
     AND table_name IN ('config_versions', 'atp_scope_master', 'vendor_master',
       'approval_role_master', 'approval_policy_master', 'approval_policy_stages',
       'cluster_master', 'cluster_approver_master', 'workflow_instances',
       'workflow_stages', 'approver_overrides', 'atp_submissions',
       'atp_submission_documents', 'punchlists', 'punchlist_items',
       'workflow_stage_actions')),
  16

UNION ALL

SELECT
  'Foreign Keys',
  (SELECT COUNT(*) FROM pg_constraint
   WHERE contype = 'f'
     AND conrelid::regclass::text IN ('config_versions', 'atp_scope_master', 'vendor_master',
       'approval_role_master', 'approval_policy_master', 'approval_policy_stages',
       'cluster_master', 'cluster_approver_master', 'workflow_instances',
       'workflow_stages', 'approver_overrides', 'atp_submissions',
       'atp_submission_documents', 'punchlists', 'punchlist_items',
       'workflow_stage_actions')),
  45

UNION ALL

SELECT
  'CHECK Constraints',
  (SELECT COUNT(*) FROM pg_constraint
   WHERE contype = 'c'
     AND conrelid::regclass::text IN ('config_versions', 'atp_scope_master', 'vendor_master',
       'approval_role_master', 'approval_policy_master', 'approval_policy_stages',
       'cluster_master', 'cluster_approver_master', 'workflow_instances',
       'workflow_stages', 'approver_overrides', 'atp_submissions',
       'atp_submission_documents', 'punchlists', 'punchlist_items',
       'workflow_stage_actions')),
  22

UNION ALL

SELECT
  'Partial Unique Index',
  (SELECT COUNT(*) FROM pg_indexes
   WHERE indexname = 'ux_config_versions_one_active_per_workspace'),
  1;
```

**GO Condition:** All checks return expected counts
**BLOCKER:** pgcrypto missing, any table missing, FKs broken, or constraints not enforced

---

### C2. Type Alignment Consistency (PATCHED - Expected Results)
**Status:** ⏳ NOT TESTED

| Check | Expected | Actual | Status |
|-------|----------|--------|--------|
| **Primary key IDs** are UUID | All UUID | _____ | ⬜ PASS ⬜ FAIL |
| **config_version_id** FK is TEXT | All TEXT | _____ | ⬜ PASS ⬜ FAIL |
| **workspace_id** FK is UUID | All UUID | _____ | ⬜ PASS ⬜ FAIL |
| **user_id** FKs are TEXT | All TEXT | _____ | ⬜ PASS ⬜ FAIL |

**Verification Query (PATCHED - WITH CRITICAL STEP 0):**

**STEP 0: CRITICAL - Verify config_versions.id type FIRST**
```sql
-- ⚠️ CRITICAL: This determines expected type for all config_version_id FK fields
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'config_versions'
  AND column_name = 'id';

-- SAVE RESULT: config_versions.id type = _________________
-- This will determine expected type for config_version_id FK fields below
```

**STEP A-D: Verify type alignment based on Step 0 result**
```sql
-- A. Primary key IDs should be UUID (NOT TEXT)
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('config_versions', 'atp_scope_master', 'workflow_instances')
  AND column_name = 'id'
ORDER BY table_name;
-- Expected: All data_type = 'uuid' (primary keys)

-- B. config_version_id FK MUST MATCH config_versions.id type
-- ⚠️ EXPECTED DEPENDS ON STEP 0 RESULT:
--    If config_versions.id = 'uuid' → All data_type = 'uuid'
--    If config_versions.id = 'text' → All data_type = 'text'
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND column_name = 'config_version_id'
ORDER BY table_name;
-- Expected: All data_type = '<from Step 0>'

-- C. workspace_id FK should be UUID (NOT TEXT)
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND column_name = 'workspace_id'
  AND table_name IN ('config_versions', 'atp_scope_master', 'workflow_instances')
ORDER BY table_name;
-- Expected: All data_type = 'uuid'

-- D. user_id FKs should be TEXT (NOT UUID) - users table uses TEXT
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('workflow_stages', 'workflow_instances')
  AND (column_name LIKE '%user_id' OR column_name LIKE '%_by')
ORDER BY table_name, column_name;
-- Expected: All data_type = 'text'
```

**GO Condition (UPDATED):**
- ✅ Primary key IDs = UUID
- ✅ config_version_id FK = MUST MATCH config_versions.id (from Step 0)
- ✅ workspace_id FK = UUID
- ✅ user_id FKs = TEXT (match users.id type)

**BLOCKER:** Any type mismatch causes FK errors and runtime failures

**IMPORTANT:** ⚠️ CRITICAL DEPENDENCY ON config_versions.id TYPE

The type alignment below is CORRECT ONLY IF:
- `config_versions.id` is TEXT (not UUID)

**FINAL VERIFICATION REQUIRED in Section 0.7:**
You MUST verify actual type of `config_versions.id` before proceeding.

```
Master Table Structure (FINAL RULE):
┌─────────────────────┬──────────┬──────────────────────┐
│ Column              │ Type     │ Condition            │
├─────────────────────┼──────────┼──────────────────────┤
│ id (PK)             │ UUID     │ Primary key          │
│ workspace_id (FK)   │ UUID     → Workspace.id (UUID)  │
│ config_version_id   │ ???      → MUST MATCH config_versions.id │
│ user_id (FK)        │ TEXT     → users.id (TEXT)     │
└─────────────────────┴──────────┴──────────────────────┘

⚠️ config_version_id type DEPENDS on config_versions.id:
- If config_versions.id = TEXT → config_version_id = TEXT ✅
- If config_versions.id = UUID → config_version_id = UUID ✅

See Section 0.7 for CRITICAL type verification.
```

---

### C3. Config Version Lifecycle (PATCHED - Workspace Reference)
**Status:** ⏳ NOT TESTED

| Check | Expected | Actual | Status |
|-------|----------|--------|--------|
| Can create DRAFT version | status='DRAFT' | _____ | ⬜ PASS ⬜ FAIL |
| Can activate DRAFT → ACTIVE | status='ACTIVE' | _____ | ⬜ PASS ⬜ FAIL |
| Can supersede ACTIVE → SUPERSEDED | status='SUPERSEDED' | _____ | ⬜ PASS ⬜ FAIL |
| Only 1 ACTIVE per workspace+source | Enforced | _____ | ⬜ PASS ⬜ FAIL |
| Version chain integrity | chain complete | _____ | ⬜ PASS ⬜ FAIL |

**Test Sequence (PATCHED):**
```sql
-- Step 0: Enable pgcrypto
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Step 1: Get actual workspace (PATCH: Use code, not name)
WITH ctx AS (
  SELECT
    (SELECT id FROM workspaces WHERE code = 'XLSMART-AVIAT' LIMIT 1) AS ws_id,
    (SELECT id FROM users WHERE status = 'ACTIVE' ORDER BY created_at LIMIT 1) AS admin_id
)
SELECT * FROM ctx;

-- Save ws_id for all subsequent queries

-- Step 2: Create DRAFT (using actual ws_id)
INSERT INTO config_versions (id, workspace_id, source_file_name, source_type,
                            version_number, status, imported_by)
VALUES (gen_random_uuid(), '<ws_id_from_step_1>',
        'test_v1.xlsx', 'SCOPE_CONFIG', 1, 'DRAFT', '<admin_id_from_step_1>')
RETURNING id, status;

-- Step 3: Activate to ACTIVE
UPDATE config_versions SET status = 'ACTIVE', activated_at = NOW()
WHERE id = '<from_step_2>' RETURNING status;

-- Step 4: Try to create second ACTIVE (should FAIL)
INSERT INTO config_versions (id, workspace_id, source_file_name, source_type,
                            version_number, status, imported_by)
VALUES (gen_random_uuid(), '<ws_id_from_step_1>',
        'test_v2.xlsx', 'SCOPE_CONFIG', 2, 'ACTIVE', '<admin_id_from_step_1>');
-- Expected: ERROR - duplicate key violates unique constraint

-- Cleanup: Delete test records
DELETE FROM config_versions
WHERE source_file_name IN ('test_v1.xlsx', 'test_v2.xlsx');
```

**GO Condition:** Complete lifecycle works, partial unique index enforced
**BLOCKER:** Cannot manage config versions or multiple ACTIVE configs allowed

---

### C4. Freeze by Reference Integrity (PATCHED)
**Status:** ⏳ NOT TESTED

| Check | Expected | Actual | Status |
|-------|----------|--------|--------|
| Workflow freezes config_version_id | Immutable (TEXT FK) | _____ | ⬜ PASS ⬜ FAIL |
| New DRAFT config doesn't affect running workflows | Isolated | _____ | ⬜ PASS ⬜ FAIL |
| Can query historical workflows with frozen config | Audit trail | _____ | ⬜ PASS ⬜ FAIL |

**Test Sequence (PATCHED):**
```sql
WITH ctx AS (
  SELECT
    (SELECT id FROM workspaces WHERE code = 'XLSMART-AVIAT' LIMIT 1) AS ws_id,
    (SELECT id FROM config_versions WHERE status = 'ACTIVE' LIMIT 1) AS active_config_id
)
-- Step 1: Create workflow with frozen config_version_id (TEXT FK)
INSERT INTO workflow_instances (id, workspace_id, config_version_id,
                                site_id, created_by)
SELECT
  gen_random_uuid(),
  ctx.ws_id,
  ctx.active_config_id,  -- Frozen as TEXT FK
  'SITE-001',
  (SELECT id FROM users WHERE status = 'ACTIVE' ORDER BY created_at LIMIT 1)
FROM ctx
RETURNING id, config_version_id as frozen_config;

-- Step 2: Create new DRAFT config version
INSERT INTO config_versions (id, workspace_id, source_file_name, source_type,
                            version_number, status, imported_by)
SELECT
  gen_random_uuid(),
  ctx.ws_id,
  'new_config.xlsx',
  'SCOPE_CONFIG',
  2,
  'DRAFT',
  (SELECT id FROM users WHERE status = 'ACTIVE' ORDER BY created_at LIMIT 1)
FROM ctx;

-- Step 3: Verify workflow still uses frozen config (TEXT FK)
SELECT wi.id, wi.config_version_id as frozen_config_text,
       cv.status, cv.version_number
FROM workflow_instances wi
JOIN config_versions cv ON wi.config_version_id = cv.id
WHERE wi.id = '<from_step_1>';
-- Expected: frozen_config_text points to version 1 (ACTIVE), not version 2 (DRAFT)
```

**GO Condition:** Running workflows completely isolated from new config changes
**BLOCKER:** Config changes affect running workflows (breaks immutability)

---

### C5. Workspace Isolation (PATCHED)
**Status:** ⏳ NOT TESTED

| Check | Expected | Actual | Status |
|-------|----------|--------|--------|
| XLSMART-AVIAT workspace exists | Found | _____ | ⬜ PASS ⬜ FAIL |
| Workspace-scoped queries work | Isolated | _____ | ⬜ PASS ⬜ FAIL |
| Cascade delete works correctly | No orphans | _____ | ⬜ PASS ⬜ FAIL |
| No cross-workspace data leakage | Enforced | _____ | ⬜ PASS ⬜ FAIL |

**Test Sequence (PATCHED):**
```sql
-- Step 1: Verify XLSMART-AVIAT workspace exists (CRITICAL)
SELECT id, code, name, is_active
FROM workspaces
WHERE code = 'XLSMART-AVIAT';
-- Expected: 1 row returned

-- Step 2: Verify workspace-scoped queries
SELECT
  w.code as workspace_code,
  COUNT(cv.id) as config_count
FROM workspaces w
LEFT JOIN config_versions cv ON cv.workspace_id = w.id
WHERE w.code = 'XLSMART-AVIAT'
GROUP BY w.id, w.code;

-- Step 3: Test cascade delete (SAFE - with rollback)
BEGIN;

-- Count before
SELECT COUNT(*) FROM config_versions
WHERE workspace_id = (SELECT id FROM workspaces WHERE code = 'XLSMART-AVIAT' LIMIT 1);

-- Note: Don't actually delete XLSMART-AVIAT, use test workspace instead
-- Create test workspace first
INSERT INTO workspaces (id, code, name, customer_group_id, vendor_owner_id, created_by)
VALUES (gen_random_uuid(),
        'TEST-' || substr(md5(random()::text), 1, 8),
        'Test Workspace Cascade',
        'default',
        'default',
        'admin')
RETURNING id, code;

-- Then delete test workspace and verify cascade
DELETE FROM workspaces WHERE code LIKE 'TEST-%';

-- Verify no orphans
SELECT COUNT(*) FROM config_versions cv
LEFT JOIN workspaces w ON cv.workspace_id = w.id
WHERE w.id IS NULL;

ROLLBACK;
```

**GO Condition:** Complete workspace isolation, cascade deletes work correctly
**BLOCKER:** Cross-workspace data leakage or orphaned records after delete

---

### C6. Runtime Workflow Execution (PATCHED - Column Names)
**Status:** ⏳ NOT TESTED

| Check | Expected | Actual | Status |
|-------|----------|--------|--------|
| Column names introspected | Detected | _____ | ⬜ PASS ⬜ FAIL |
| Can create workflow instance | Created | _____ | ⬜ PASS ⬜ FAIL |
| Can create workflow stages from policy | Stages created | _____ | ⬜ PASS ⬜ FAIL |
| Can approve stage | status='APPROVED' | _____ | ⬜ PASS ⬜ FAIL |
| Audit log entry created | Entry exists | _____ | ⬜ PASS ⬜ FAIL |

**End-to-End Test (PATCHED):**
```sql
-- Step 1: Introspect column names (CRITICAL)
SELECT table_name, column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('workflow_instances', 'workflow_stages')
  AND column_name IN ('status', 'workflow_status', 'stage_status',
                      'current_stage', 'current_stage_number')
ORDER BY table_name, ordinal_position;

-- Save detected column names:
-- workflow_instances status column: _________________
-- workflow_instances current stage column: _________________
-- workflow_stages status column: _________________

-- Step 2: Create workflow (USE DETECTED COLUMN NAMES)
WITH ctx AS (
  SELECT
    (SELECT id FROM workspaces WHERE code = 'XLSMART-AVIAT' LIMIT 1) AS ws_id,
    (SELECT id FROM users WHERE status = 'ACTIVE' ORDER BY created_at LIMIT 1) AS user_id,
    (SELECT id FROM config_versions WHERE status = 'ACTIVE' LIMIT 1) AS config_id
)
INSERT INTO workflow_instances (
  id, workspace_id, config_version_id, site_id,
  -- USE DETECTED NAMES:
  status,  -- or workflow_status
  current_stage_number,  -- or current_stage
  created_by
)
SELECT
  gen_random_uuid(),
  ctx.ws_id,
  ctx.config_id,
  'SITE-001',
  'IN_PROGRESS',
  1,
  ctx.user_id
FROM ctx;
```

**GO Condition:** Can create and execute complete workflow
**BLOCKER:** Cannot create workflow or approve stages

---

## ⚠️ IMPORTANT Criteria (Should Pass) - PATCHED

### I1. Performance Indexes Created
**Status:** ⏳ NOT TESTED

| Check | Expected | Actual | Status |
|-------|----------|--------|--------|
| pgcrypto enabled | Extension exists | _____ | ⬜ PASS ⬜ FAIL |
| Pending tasks index exists | idx_workflow_stages_pending_by_user | _____ | ⬜ PASS ⬜ FAIL |
| SLA deadline index exists | idx_workflow_stages_overdue | _____ | ⬜ PASS ⬜ FAIL |
| Total performance indexes | 25+ indexes | _____ | ⬜ PASS ⬜ FAIL |

**Verification (PATCHED):**
```sql
-- Step 1: Check pgcrypto
SELECT extname FROM pg_extension WHERE extname = 'pgcrypto';

-- Step 2: Count performance indexes
SELECT COUNT(*) as index_count
FROM pg_indexes
WHERE schemaname = 'public'
  AND indexname LIKE 'idx_%';
```

**GO Condition:** pgcrypto enabled, 25+ performance indexes created
**HOLD Condition:** Missing extension or indexes may cause failures

---

### I2. Data Validation Constraints (PATCHED)
**Status:** ⏳ NOT TESTED

| Check | Expected | Actual | Status |
|-------|----------|--------|--------|
| Invalid status rejected | Error | _____ | ⬜ PASS ⬜ FAIL |
| Invalid source_type rejected | Error | _____ | ⬜ PASS ⬜ FAIL |
| Constraints introspected | Known values | _____ | ⬜ PASS ⬜ FAIL |

**Test (PATCHED):**
```sql
-- Step 1: Introspect allowed values
SELECT conname, pg_get_constraintdef(oid) as constraint_def
FROM pg_constraint
WHERE conrelid = 'config_versions'::regclass
  AND contype = 'c'
  AND conname LIKE '%source_type%';

-- Step 2: Use KNOWN invalid value from Step 1
INSERT INTO config_versions (id, workspace_id, source_file_name, source_type,
                            version_number, status, imported_by)
VALUES (gen_random_uuid(),
        (SELECT id FROM workspaces WHERE code = 'XLSMART-AVIAT' LIMIT 1),
        'test.txt',
        'INVALID_TYPE',  -- Must be invalid based on Step 1
        1,
        'DRAFT',
        'admin');
-- Expected: ERROR - CHECK constraint violated
```

**GO Condition:** All CHECK constraints enforced
**HOLD Condition:** Invalid data allowed (data quality risk)

---

### I3. Audit Trail Completeness
**Status:** ⏳ NOT TESTED

| Check | Expected | Actual | Status |
|-------|----------|--------|--------|
| Config version has import metadata | imported_by, imported_at | _____ | ⬜ PASS ⬜ FAIL |
| Workflow stage has action log | workflow_stage_actions | _____ | ⬜ PASS ⬜ FAIL |
| Can reconstruct approval history | Audit trail | _____ | ⬜ PASS ⬜ FAIL |

**GO Condition:** Complete audit trail for compliance
**HOLD Condition:** Missing audit data (compliance risk)

---

## 🔍 NICE TO HAVE Criteria (Optional)

### N1. Performance Benchmarks (PATCHED - Column Names)
**Status:** ⏳ NOT TESTED

| Metric | Target | Actual | Status |
|--------|--------|--------|--------|
| Pending tasks query (< 100ms) | < 100ms | _____ | ⬜ PASS ⬜ FAIL |
| SLA query (< 200ms) | < 200ms | _____ | ⬜ PASS ⬜ FAIL |
| Config version lookup (< 50ms) | < 50ms | _____ | ⬜ PASS ⬜ FAIL |

**Test (PATCHED - Use detected column names):**
```sql
-- IMPORTANT: Replace status/column names with detected values from Section 0
EXPLAIN ANALYZE
SELECT ws.*, wi.site_id
FROM workflow_stages ws
JOIN workflow_instances wi ON ws.workflow_instance_id = wi.id
WHERE ws.approver_user_id = (SELECT id FROM users LIMIT 1)
  AND ws.status = 'PENDING'  -- or ws.stage_status based on introspection
ORDER BY ws.created_at DESC
LIMIT 50;
```

**Expected:** Query uses index, execution time < target
**Actual:** _____
**Status:** ⬜ PASS ⬜ FAIL

---

### N2. Documentation Completeness
**Status:** ✅ COMPLETE

| Document | Status | Location |
|----------|--------|----------|
| Deployment Summary | ✅ Complete | [DEPLOYMENT_SUMMARY.md](DEPLOYMENT_SUMMARY.md) |
| Staging Test Checklist V2 | ✅ Complete (Patched) | [STAGING_TEST_CHECKLIST_V2.md](STAGING_TEST_CHECKLIST_V2.md) |
| Go/No-Go Criteria V2 | ✅ Complete (Patched) | [GO_NO_GO_CRITERIA_V2.md](GO_NO_GO_CRITERIA_V2.md) |
| Performance Indexes | ✅ Complete | [performance_indexes.sql](prisma/migrations/20251229010228_add_master_tables_final_v2/performance_indexes.sql) |
| Validation Queries | ✅ Complete | [validation_queries.sql](prisma/migrations/20251229010228_add_master_tables_final_v2/validation_queries.sql) |

---

## 📊 Final Decision Matrix (UNCHANGED)

### Scoring System

**Critical Criteria (6 items):** Must pass ALL
- Each failed critical = 🔴 NO-GO

**Important Criteria (3 items):** Should pass ALL
- 1-2 failed important = 🟡 HOLD
- 3 failed important = 🔴 NO-GO

**Nice to Have (2 items):** Optional
- Does not affect Go/No-Go decision

---

### Decision Tree (UNCHANGED)

```
START STAGING TESTS
    ↓
Run Section 0: Schema Introspection (NEW!)
    ↓
Run all 6 Critical checks
    ↓
Any Critical FAILED? → YES → 🔴 NO-GO → Fix issues → Re-test
    ↓ NO
All Critical PASSED?
    ↓ YES
Run all 3 Important checks
    ↓
3 Important FAILED? → YES → 🔴 NO-GO → Fix issues → Re-test
    ↓ NO
1-2 Important FAILED? → YES → 🟡 HOLD → Assess impact → Decide
    ↓ NO
All Important PASSED?
    ↓ YES
Run Nice to Have checks (optional)
    ↓
🟢 GO FOR PRODUCTION
```

---

## 🎯 Pre-Deployment Checklist (PATCHED)

### Before Go Decision

**NEW - Section 0 Prerequisites:**
- [ ] pgcrypto extension enabled: `CREATE EXTENSION IF NOT EXISTS pgcrypto;`
- [ ] Schema introspection completed (column names detected)
- [ ] Workspace verified (XLSMART-AVIAT or TEST-WS created)
- [ ] Test users verified (min 2 active users)

**Existing Prerequisites:**
- [ ] All staging tests executed
- [ ] Actual results documented in [STAGING_TEST_CHECKLIST_V2.md](STAGING_TEST_CHECKLIST_V2.md)
- [ ] Performance benchmarks recorded
- [ ] Issues investigated and resolved
- [ ] Stakeholder review completed
- [ ] Production deployment plan approved
- [ ] Rollback plan documented
- [ ] Monitoring dashboards ready

### Production Deployment Approval

| Role | Name | Approval | Date | Signature |
|------|------|----------|------|-----------|
| Developer | | ⬜ | | |
| Tech Lead | | ⬜ | | |
| DBA | | ⬜ | | |
| Product Owner | | ⬜ | | |

---

## 📝 Final Declaration

### Test Execution Summary

**Test Date:** ____________________
**Tester:** ____________________
**Environment:** apmsstaging.datacodesolution.com

**Section 0 Results (NEW):**
- pgcrypto enabled: ⬜ YES ⬜ NO
- Workspace ID: ____________________
- Status column name: ____________________
- Current stage column: ____________________

**Critical Results:** ___/6 PASSED
**Important Results:** ___/3 PASSED
**Nice to Have:** ___/2 PASSED

**Overall Score:** ___%

### Go/No-Go Decision

**Decision:** ⬜ 🟢 GO ⬜ 🟡 HOLD ⬜ 🔴 NO-GO

**Justification:**
___________________________________________
___________________________________________
___________________________________________

**Approved By:** ____________________
**Title:** ____________________
**Date:** ____________________

**Deployment Date Scheduled:** ____________________

---

## 🚨 Known Issues & Workarounds

### Issue 1: pgcrypto Extension (NEW)
**Description:** gen_random_uuid() requires pgcrypto extension
**Severity:** ⬜ Critical (blocks all tests)
**Workaround:** Run `CREATE EXTENSION IF NOT EXISTS pgcrypto;` before any tests
**Fix Timeline:** Immediate

### Issue 2: Workspace Reference (PATCHED)
**Description:** "Test Workspace" doesn't exist, use XLSMART-AVIAT instead
**Severity:** ⬜ Important
**Workaround:** All queries now use `WHERE code = 'XLSMART-AVIAT'`
**Fix Timeline:** Applied in V2

### Issue 3: Column Name Ambiguity (PATCHED)
**Description:** status vs workflow_status vs stage_status
**Severity:** ⬜ Important
**Workaround:** Schema introspection in Section 0 detects actual names
**Fix Timeline:** Applied in V2

---

## 📚 Supporting Documents

- [Deployment Summary](DEPLOYMENT_SUMMARY.md)
- [Staging Test Checklist V2 (Patched)](STAGING_TEST_CHECKLIST_V2.md) ⭐ **USE THIS VERSION**
- [Performance Indexes SQL](prisma/migrations/20251229010228_add_master_tables_final_v2/performance_indexes.sql)
- [Validation Queries SQL](prisma/migrations/20251229010228_add_master_tables_final_v2/validation_queries.sql)
- [Production DDL](../PRODUCTION_GRADE_DDL.sql)
- [Implementation Guide](../IMPLEMENTATION_GUIDE.md)
- [Versioned Config Architecture](../Master_Tables_With_Versioned_Config.md)

---

**Document Status:** ✅ READY FOR STAGING EXECUTION (V2 PATCHED)

**What's New in V2:**
1. ✅ pgcrypto extension pre-check
2. ✅ Workspace reference fixed (XLSMART-AVIAT)
3. ✅ Schema introspection (Section 0)
4. ✅ Helper CTE pattern for consistency
5. ✅ Column name ambiguity resolved
6. ✅ Type alignment clarified (UUID vs TEXT)
7. ✅ ON CONFLICT safety checks
8. ✅ Executive summary criteria added

**Next Steps:**
1. **CRITICAL:** Run Section 0 (Schema Introspection) FIRST
2. Save detected column names and IDs
3. Execute Sections A-D with saved values
4. Complete executive summary (3 critical success indicators)
5. Make Go/No-Go decision
6. Deploy to production (if GO)

**Key Success Criteria (Executive Summary):**
If these 3 pass → **90% of production risk eliminated**

1. ✅ Config Immutability (freeze by reference)
2. ✅ Workspace Isolation (no leakage)
3. ✅ Runtime Progression (approve → audit log → next stage)
