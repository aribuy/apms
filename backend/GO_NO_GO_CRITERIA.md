# Go/No-Go Criteria for Production Deployment

**Migration:** `20251229010228_add_master_tables_final_v2`
**Component:** Master Tables with Versioned Config
**Date:** 2025-12-29
**Status:** ⏳ PENDING STAGING VALIDATION

---

## 🎯 Decision Framework

This document defines clear criteria for determining whether the master tables implementation is ready for production deployment.

**Decision Levels:**
- 🟢 **GO** - All critical criteria met, safe to deploy
- 🟡 **HOLD** - Some criteria not met, requires investigation
- 🔴 **NO-GO** - Critical blockers found, deployment must not proceed

---

## 📋 CRITICAL Criteria (Must Pass)

### C1. Schema Integrity
**Status:** ⏳ NOT TESTED

| Check | Expected | Actual | Status |
|-------|----------|--------|--------|
| All 16 tables created | 16 tables | _____ | ⬜ PASS ⬜ FAIL |
| Foreign keys valid | 45+ FKs | _____ | ⬜ PASS ⬜ FAIL |
| CHECK constraints enforced | 22 constraints | _____ | ⬜ PASS ⬜ FAIL |
| Partial unique index exists | 1 index | _____ | ⬜ PASS ⬜ FAIL |
| No orphaned records | 0 orphans | _____ | ⬜ PASS ⬜ FAIL |

**Verification Query:**
```sql
-- Complete schema integrity check
SELECT
  'Tables' as check_type,
  (SELECT COUNT(*) FROM information_schema.tables
   WHERE table_schema = 'public'
     AND table_name IN ('config_versions', 'atp_scope_master', 'vendor_master',
       'approval_role_master', 'approval_policy_master', 'approval_policy_stages',
       'cluster_master', 'cluster_approver_master', 'workflow_instances',
       'workflow_stages', 'approver_overrides', 'atp_submissions',
       'atp_submission_documents', 'punchlists', 'punchlist_items',
       'workflow_stage_actions')) as actual_count,
  16 as expected_count

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
**BLOCKER:** Any table missing, FKs broken, or constraints not enforced

---

### C2. Type Alignment Consistency
**Status:** ⏳ NOT TESTED

| Check | Expected | Actual | Status |
|-------|----------|--------|--------|
| User FK fields are TEXT | All TEXT | _____ | ⬜ PASS ⬜ FAIL |
| Workspace FK fields are UUID | All UUID | _____ | ⬜ PASS ⬜ FAIL |
| config_version_id is TEXT | TEXT | _____ | ⬜ PASS ⬜ FAIL |

**Verification Query:**
```sql
-- Check user_id fields are TEXT (not UUID)
SELECT column_name, data_type, character_maximum_length
FROM information_schema.columns
WHERE table_schema = 'public'
  AND (column_name LIKE '%user_id' OR column_name LIKE '%_by')
  AND table_name IN ('workflow_stages', 'workflow_instances', 'approver_overrides',
                     'atp_submissions', 'workflow_stage_actions')
ORDER BY table_name, column_name;
-- Expected: All data_type = 'text'

-- Check workspace_id fields are UUID
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND column_name = 'workspace_id'
  AND table_name IN ('config_versions', 'atp_scope_master', 'workflow_instances')
ORDER BY table_name;
-- Expected: All data_type = 'uuid'

-- Check config_version_id is TEXT (not UUID)
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND column_name = 'config_version_id'
ORDER BY table_name;
-- Expected: All data_type = 'text'
```

**GO Condition:** All user_id fields = TEXT, all workspace_id = UUID, all config_version_id = TEXT
**BLOCKER:** Any type mismatch causes FK errors and runtime failures

---

### C3. Config Version Lifecycle
**Status:** ⏳ NOT TESTED

| Check | Expected | Actual | Status |
|-------|----------|--------|--------|
| Can create DRAFT version | status='DRAFT' | _____ | ⬜ PASS ⬜ FAIL |
| Can activate DRAFT → ACTIVE | status='ACTIVE' | _____ | ⬜ PASS ⬜ FAIL |
| Can supersede ACTIVE → SUPERSEDED | status='SUPERSEDED' | _____ | ⬜ PASS ⬜ FAIL |
| Only 1 ACTIVE per workspace+source | Enforced | _____ | ⬜ PASS ⬜ FAIL |
| Version chain integrity | chain complete | _____ | ⬜ PASS ⬜ FAIL |

**Test Sequence:**
```sql
-- 1. Create DRAFT
INSERT INTO config_versions (id, workspace_id, source_file_name, source_type,
                            version_number, status, imported_by)
VALUES (gen_random_uuid(),
        (SELECT id FROM workspaces LIMIT 1),
        'test_v1.xlsx', 'SCOPE_CONFIG', 1, 'DRAFT', 'admin')
RETURNING id, status;

-- 2. Activate to ACTIVE
UPDATE config_versions SET status = 'ACTIVE', activated_at = NOW()
WHERE id = '<from_above>' RETURNING status;

-- 3. Try to create second ACTIVE (should FAIL)
INSERT INTO config_versions (id, workspace_id, source_file_name, source_type,
                            version_number, status, imported_by)
VALUES (gen_random_uuid(),
        (SELECT id FROM workspaces LIMIT 1),
        'test_v2.xlsx', 'SCOPE_CONFIG', 2, 'ACTIVE', 'admin');
-- Expected: ERROR - duplicate key violates unique constraint
```

**GO Condition:** Complete lifecycle works, partial unique index enforced
**BLOCKER:** Cannot manage config versions or multiple ACTIVE configs allowed

---

### C4. Freeze by Reference Integrity
**Status:** ⏳ NOT TESTED

| Check | Expected | Actual | Status |
|-------|----------|--------|--------|
| Workflow freezes config_version_id | Immutable | _____ | ⬜ PASS ⬜ FAIL |
| New DRAFT config doesn't affect running workflows | Isolated | _____ | ⬜ PASS ⬜ FAIL |
| Can query historical workflows with frozen config | Audit trail | _____ | ⬜ PASS ⬜ FAIL |

**Test Sequence:**
```sql
-- 1. Create workflow with frozen config
INSERT INTO workflow_instances (id, workspace_id, config_version_id,
                                site_id, status, submitted_by)
VALUES (gen_random_uuid(),
        (SELECT id FROM workspaces LIMIT 1),
        (SELECT id FROM config_versions WHERE status = 'ACTIVE' LIMIT 1),
        'SITE-001', 'IN_PROGRESS', 'user1')
RETURNING id, config_version_id as frozen_config;

-- 2. Create new DRAFT config version
INSERT INTO config_versions (id, workspace_id, source_file_name, source_type,
                            version_number, status, imported_by)
VALUES (gen_random_uuid(),
        (SELECT id FROM workspaces LIMIT 1),
        'new_config.xlsx', 'SCOPE_CONFIG', 2, 'DRAFT', 'admin');

-- 3. Verify workflow still uses frozen config
SELECT wi.id, wi.config_version_id as frozen, cv.status, cv.version_number
FROM workflow_instances wi
JOIN config_versions cv ON wi.config_version_id = cv.id
WHERE wi.id = '<from_step_1>';
-- Expected: frozen_config points to version 1 (ACTIVE), not version 2 (DRAFT)
```

**GO Condition:** Running workflows completely isolated from new config changes
**BLOCKER:** Config changes affect running workflows (breaks immutability)

---

### C5. Workspace Isolation
**Status:** ⏳ NOT TESTED

| Check | Expected | Actual | Status |
|-------|----------|--------|--------|
| Workspace A cannot see Workspace B configs | Isolated | _____ | ⬜ PASS ⬜ FAIL |
| Cascade delete works | No orphans | _____ | ⬜ PASS ⬜ FAIL |
| No cross-workspace data leakage | Enforced | _____ | ⬜ PASS ⬜ FAIL |

**Test Sequence:**
```sql
-- 1. Verify workspace-scoped queries
SELECT w.name, COUNT(cv.id) as config_count
FROM workspaces w
LEFT JOIN config_versions cv ON cv.workspace_id = w.id
GROUP BY w.id, w.name
ORDER BY w.name;
-- Expected: Each workspace only sees its own configs

-- 2. Test cascade delete (use test workspace)
BEGIN;
-- Count before
SELECT COUNT(*) FROM config_versions
WHERE workspace_id = (SELECT id FROM workspaces WHERE name = 'Test Workspace' LIMIT 1);

-- Delete workspace
DELETE FROM workspaces WHERE name = 'Test Workspace';

-- Verify no orphans
SELECT COUNT(*) FROM config_versions cv
LEFT JOIN workspaces w ON cv.workspace_id = w.id
WHERE w.id IS NULL;
-- Expected: 0 orphans
ROLLBACK; -- Rollback test
```

**GO Condition:** Complete workspace isolation, cascade deletes work correctly
**BLOCKER:** Cross-workspace data leakage or orphaned records after delete

---

### C6. Runtime Workflow Execution
**Status:** ⏳ NOT TESTED

| Check | Expected | Actual | Status |
|-------|----------|--------|--------|
| Can create workflow instance | Created | _____ | ⬜ PASS ⬜ FAIL |
| Can create workflow stages from policy | Stages created | _____ | ⬜ PASS ⬜ FAIL |
| Can approve stage | status='APPROVED' | _____ | ⬜ PASS ⬜ FAIL |
| Audit log entry created | Entry exists | _____ | ⬜ PASS ⬜ FAIL |
| Can create ATP submission | Created | _____ | ⬜ PASS ⬜ FAIL |
| Can create punchlist | Created | _____ | ⬜ PASS ⬜ FAIL |

**End-to-End Test:**
```sql
-- Complete workflow: Create → Approve → Punchlist → Complete
-- (See STAGING_TEST_CHECKLIST.md Section C for full test sequence)
```

**GO Condition:** Can create and execute complete workflow
**BLOCKER:** Cannot create workflow or approve stages

---

## ⚠️ IMPORTANT Criteria (Should Pass)

### I1. Performance Indexes Created
**Status:** ⏳ NOT TESTED

| Check | Expected | Actual | Status |
|-------|----------|--------|--------|
| Pending tasks index exists | idx_workflow_stages_pending_by_user | _____ | ⬜ PASS ⬜ FAIL |
| SLA deadline index exists | idx_workflow_stages_overdue | _____ | ⬜ PASS ⬜ FAIL |
| Workflow status index exists | idx_workflow_instances_status | _____ | ⬜ PASS ⬜ FAIL |
| Total performance indexes | 25+ indexes | _____ | ⬜ PASS ⬜ FAIL |

**Verification:**
```sql
SELECT COUNT(*) as index_count
FROM pg_indexes
WHERE schemaname = 'public'
  AND indexname LIKE 'idx_%';
```

**GO Condition:** 25+ performance indexes created
**HOLD Condition:** Missing indexes may cause performance degradation

---

### I2. Data Validation Constraints
**Status:** ⏳ NOT TESTED

| Check | Expected | Actual | Status |
|-------|----------|--------|--------|
| Invalid status rejected | Error | _____ | ⬜ PASS ⬜ FAIL |
| Invalid source_type rejected | Error | _____ | ⬜ PASS ⬜ FAIL |
| Invalid scope_group rejected | Error | _____ | ⬜ PASS ⬜ FAIL |
| Punchlist evidence enforced | Error if missing | _____ | ⬜ PASS ⬜ FAIL |

**Test:**
```sql
-- Try to insert invalid status
INSERT INTO config_versions (id, workspace_id, source_file_name, source_type,
                            version_number, status, imported_by)
VALUES (gen_random_uuid(), (SELECT id FROM workspaces LIMIT 1),
        'test.txt', 'INVALID_TYPE', 1, 'DRAFT', 'admin');
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

### N1. Performance Benchmarks
**Status:** ⏳ NOT TESTED

| Metric | Target | Actual | Status |
|--------|--------|--------|--------|
| Pending tasks query (< 100ms) | < 100ms | _____ | ⬜ PASS ⬜ FAIL |
| SLA query (< 200ms) | < 200ms | _____ | ⬜ PASS ⬜ FAIL |
| Config version lookup (< 50ms) | < 50ms | _____ | ⬜ PASS ⬜ FAIL |

**Test:**
```sql
EXPLAIN ANALYZE
SELECT ws.*, wi.site_name
FROM workflow_stages ws
JOIN workflow_instances wi ON ws.workflow_instance_id = wi.id
WHERE ws.approver_user_id = (SELECT id FROM users LIMIT 1)
  AND ws.status = 'PENDING'
ORDER BY ws.created_at DESC
LIMIT 50;
-- Check execution time
```

---

### N2. Documentation Completeness
**Status:** ✅ COMPLETE

| Document | Status | Location |
|----------|--------|----------|
| Deployment Summary | ✅ Complete | [DEPLOYMENT_SUMMARY.md](DEPLOYMENT_SUMMARY.md) |
| Staging Test Checklist | ✅ Complete | [STAGING_TEST_CHECKLIST.md](STAGING_TEST_CHECKLIST.md) |
| Go/No-Go Criteria | ✅ Complete | [GO_NO_GO_CRITERIA.md](GO_NO_GO_CRITERIA.md) |
| Performance Indexes | ✅ Complete | [performance_indexes.sql](prisma/migrations/20251229010228_add_master_tables_final_v2/performance_indexes.sql) |
| Validation Queries | ✅ Complete | [DEPLOYMENT_SUMMARY.md](DEPLOYMENT_SUMMARY.md) (Section 6) |

---

## 📊 Final Decision Matrix

### Scoring System

**Critical Criteria (6 items):** Must pass ALL
- Each failed critical = 🔴 NO-GO

**Important Criteria (3 items):** Should pass ALL
- 1-2 failed important = 🟡 HOLD
- 3 failed important = 🔴 NO-GO

**Nice to Have (2 items):** Optional
- Does not affect Go/No-Go decision

---

### Decision Tree

```
START STAGING TESTS
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

## 🎯 Pre-Deployment Checklist

### Before Go Decision

- [ ] All staging tests executed
- [ ] Actual results documented in [STAGING_TEST_CHECKLIST.md](STAGING_TEST_CHECKLIST.md)
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

### Issue 1
**Description:** ___________________________________________
**Severity:** ⬜ Critical ⬜ Important ⬜ Minor
**Workaround:** ___________________________________________
**Fix Timeline:** ___________________________________________

### Issue 2
**Description:** ___________________________________________
**Severity:** ⬜ Critical ⬜ Important ⬜ Minor
**Workaround:** ___________________________________________
**Fix Timeline:** ___________________________________________

---

## 📚 Supporting Documents

- [Deployment Summary](DEPLOYMENT_SUMMARY.md)
- [Staging Test Checklist](STAGING_TEST_CHECKLIST.md)
- [Performance Indexes SQL](prisma/migrations/20251229010228_add_master_tables_final_v2/performance_indexes.sql)
- [Production DDL](../PRODUCTION_GRADE_DDL.sql)
- [Implementation Guide](../IMPLEMENTATION_GUIDE.md)
- [Versioned Config Architecture](../Master_Tables_With_Versioned_Config.md)

---

**Document Status:** ✅ READY FOR STAGING EXECUTION

**Next Steps:**
1. Execute staging tests per [STAGING_TEST_CHECKLIST.md](STAGING_TEST_CHECKLIST.md)
2. Document actual results
3. Complete this Go/No-Go criteria
4. Obtain approvals
5. Deploy to production (if GO)
