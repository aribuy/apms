# Execution Plan: Option A - Add Missing Foreign Keys

**ADR:** 001-Foreign-Key-Strategy-for-Master-Tables-V2
**Decision:** ✅ Add Missing FK Constraints
**Timeline:** 7-10 business days
**Risk Level:** 🟢 LOW

---

## Overview

This document provides a practical, step-by-step execution plan for adding missing foreign key constraints to the master tables migration. The plan uses a **safe migration pattern** (`NOT VALID` → `VALIDATE`) to minimize risk and downtime.

---

## Phase 1: Pre-FK Orphan Audit (Day 1)

**Goal:** Ensure no existing orphaned records before adding FKs

### Step 1.1: Run Orphan Detection

Connect to staging database and run comprehensive audit:

```bash
# SSH to staging
ssh apms@apmsstaging.datacodesolution.com

# Connect to database
psql -U apms_staging -d apms_db

# Run orphan audit query
```

**SQL Query ([ORPHAN_CHECK_AUDITS.md](./ORPHAN_CHECK_AUDITS.md)):**

```sql
WITH

-- Critical orphan checks
workflow_config_orphans AS (
    SELECT COUNT(*) as count
    FROM workflow_instances wi
    LEFT JOIN config_versions cv ON wi.config_version_id = cv.id
    WHERE cv.id IS NULL
),

workflow_workspace_orphans AS (
    SELECT COUNT(*) as count
    FROM workflow_instances wi
    LEFT JOIN workspaces w ON wi.workspace_id = w.id
    WHERE w.id IS NULL
),

stage_orphans AS (
    SELECT COUNT(*) as count
    FROM workflow_stages ws
    LEFT JOIN workflow_instances wi ON ws.workflow_instance_id = wi.id
    WHERE wi.id IS NULL
),

atp_submission_orphans AS (
    SELECT COUNT(*) as count
    FROM atp_submissions atp
    LEFT JOIN workflow_instances wi ON atp.workflow_instance_id = wi.id
    WHERE wi.id IS NULL
)

SELECT
    'workflow_instances.config_version_id orphans' as check_name,
    workflow_config_orphans.count
UNION ALL
SELECT
    'workflow_instances.workspace_id orphans',
    workflow_workspace_orphans.count
UNION ALL
SELECT
    'workflow_stages.workflow_instance_id orphans',
    stage_orphans.count
UNION ALL
SELECT
    'atp_submissions.workflow_instance_id orphans',
    atp_submission_orphans.count;
```

**Expected Result:** All counts should be **0**

---

### Step 1.2: Document Orphans (If Any Found)

**If orphans exist:**

```sql
-- Get detailed orphan records
SELECT
    wi.id as workflow_id,
    wi.config_version_id as missing_config_id,
    wi.site_id,
    wi.status,
    wi.created_at
FROM workflow_instances wi
LEFT JOIN config_versions cv ON wi.config_version_id = cv.id
WHERE cv.id IS NULL;
```

**Decision:**
- **Option 1:** Delete orphans (if truly invalid data)
- **Option 2:** Restore missing references (from backup or recreate)
- **Option 3:** Document as acceptable technical debt (rare)

**Action:** Document decision and execute remediation

---

### Step 1.3: Re-Run Audit

Verify clean state before proceeding:

```sql
-- Re-run orphan audit
-- Expected: All counts = 0
```

**✅ Phase 1 Complete When:** 0 orphaned records in critical relationships

---

## Phase 2: Create FK Migration (Day 2)

**Goal:** Create migration file with all missing FKs

### Step 2.1: Create New Migration

```bash
# From project root
cd backend

# Create migration
npx prisma migrate dev --name add_master_tables_fks
```

**Result:** Creates new migration file:
```
prisma/migrations/YYYYMMDDHHMMSS_add_master_tables_fks/migration.sql
```

---

### Step 2.2: Edit Migration File

**Pattern:** `NOT VALID` → `VALIDATE`

**File:** `backend/prisma/migrations/YYYYMMDDHHMMSS_add_master_tables_fks/migration.sql`

**Add FKs in priority order:**

```sql
-- ============================================================
-- Priority 1: CRITICAL - Workflow Core Integrity
-- ============================================================

-- Workflow instances must reference valid config version
ALTER TABLE workflow_instances
ADD CONSTRAINT fk_workflow_instances_config_version
FOREIGN KEY (config_version_id)
REFERENCES config_versions(id)
ON DELETE RESTRICT
NOT VALID;  -- <-- Don't validate existing data yet

-- Workflow instances must belong to workspace
ALTER TABLE workflow_instances
ADD CONSTRAINT fk_workflow_instances_workspace
FOREIGN KEY (workspace_id)
REFERENCES workspaces(id)
ON DELETE RESTRICT
NOT VALID;

-- ============================================================
-- Priority 2: HIGH - Child Record Integrity
-- ============================================================

-- Workflow stages belong to workflow instance
ALTER TABLE workflow_stages
ADD CONSTRAINT fk_workflow_stages_workflow_instance
FOREIGN KEY (workflow_instance_id)
REFERENCES workflow_instances(id)
ON DELETE CASCADE
NOT VALID;

-- ATP submissions reference workflow
ALTER TABLE atp_submissions
ADD CONSTRAINT fk_atp_submissions_workflow_instance
FOREIGN KEY (workflow_instance_id)
REFERENCES workflow_instances(id)
ON DELETE RESTRICT
NOT VALID;

-- ATP submission documents belong to submission
ALTER TABLE atp_submission_documents
ADD CONSTRAINT fk_atp_submission_documents_submission
FOREIGN KEY (submission_id)
REFERENCES atp_submissions(id)
ON DELETE CASCADE
NOT VALID;

-- Punchlists reference workflow
ALTER TABLE punchlists
ADD CONSTRAINT fk_punchlists_workflow_instance
FOREIGN KEY (workflow_instance_id)
REFERENCES workflow_instances(id)
ON DELETE RESTRICT
NOT VALID;

-- Punchlist items belong to punchlist
ALTER TABLE punchlist_items
ADD CONSTRAINT fk_punchlist_items_punchlist
FOREIGN KEY (punchlist_id)
REFERENCES punchlists(id)
ON DELETE CASCADE
NOT VALID;

-- ============================================================
-- Priority 3: MEDIUM - Master Table Workspace Isolation
-- ============================================================

-- ATP scopes belong to workspace
ALTER TABLE atp_scope_master
ADD CONSTRAINT fk_atp_scope_master_workspace
FOREIGN KEY (workspace_id)
REFERENCES workspaces(id)
ON DELETE RESTRICT
NOT VALID;

-- Vendors belong to workspace
ALTER TABLE vendor_master
ADD CONSTRAINT fk_vendor_master_workspace
FOREIGN KEY (workspace_id)
REFERENCES workspaces(id)
ON DELETE RESTRICT
NOT VALID;

-- Approval roles belong to workspace
ALTER TABLE approval_role_master
ADD CONSTRAINT fk_approval_role_master_workspace
FOREIGN KEY (workspace_id)
REFERENCES workspaces(id)
ON DELETE RESTRICT
NOT VALID;

-- Approval policies belong to workspace
ALTER TABLE approval_policy_master
ADD CONSTRAINT fk_approval_policy_master_workspace
FOREIGN KEY (workspace_id)
REFERENCES workspaces(id)
ON DELETE RESTRICT
NOT VALID;

-- Approval policy stages belong to policy
ALTER TABLE approval_policy_stages
ADD CONSTRAINT fk_approval_policy_stages_policy
FOREIGN KEY (approval_policy_id)
REFERENCES approval_policy_master(id)
ON DELETE CASCADE
NOT VALID;

-- Clusters belong to workspace
ALTER TABLE cluster_master
ADD CONSTRAINT fk_cluster_master_workspace
FOREIGN KEY (workspace_id)
REFERENCES workspaces(id)
ON DELETE RESTRICT
NOT VALID;

-- Cluster approvers belong to cluster
ALTER TABLE cluster_approver_master
ADD CONSTRAINT fk_cluster_approver_master_cluster
FOREIGN KEY (cluster_id)
REFERENCES cluster_master(id)
ON DELETE CASCADE
NOT VALID;

-- ============================================================
-- Priority 4: LOW - Runtime Integrity
-- ============================================================

-- Approver overrides reference workflow
ALTER TABLE approver_overrides
ADD CONSTRAINT fk_approver_overrides_workflow_instance
FOREIGN KEY (workflow_instance_id)
REFERENCES workflow_instances(id)
ON DELETE CASCADE
NOT VALID;

-- Workflow stage actions belong to stage
ALTER TABLE workflow_stage_actions
ADD CONSTRAINT fk_workflow_stage_actions_stage
FOREIGN KEY (stage_id)
REFERENCES workflow_stages(id)
ON DELETE CASCADE
NOT VALID;

-- ============================================================
-- Validation Phase (Can be done later)
-- ============================================================

-- Validate all constraints
-- Run these after migration, during maintenance window

ALTER TABLE workflow_instances
VALIDATE CONSTRAINT fk_workflow_instances_config_version;

ALTER TABLE workflow_instances
VALIDATE CONSTRAINT fk_workflow_instances_workspace;

ALTER TABLE workflow_stages
VALIDATE CONSTRAINT fk_workflow_stages_workflow_instance;

ALTER TABLE atp_submissions
VALIDATE CONSTRAINT fk_atp_submissions_workflow_instance;

ALTER TABLE atp_submission_documents
VALIDATE CONSTRAINT fk_atp_submission_documents_submission;

ALTER TABLE punchlists
VALIDATE CONSTRAINT fk_punchlists_workflow_instance;

ALTER TABLE punchlist_items
VALIDATE CONSTRAINT fk_punchlist_items_punchlist;

ALTER TABLE atp_scope_master
VALIDATE CONSTRAINT fk_atp_scope_master_workspace;

ALTER TABLE vendor_master
VALIDATE CONSTRAINT fk_vendor_master_workspace;

ALTER TABLE approval_role_master
VALIDATE CONSTRAINT fk_approval_role_master_workspace;

ALTER TABLE approval_policy_master
VALIDATE CONSTRAINT fk_approval_policy_master_workspace;

ALTER TABLE approval_policy_stages
VALIDATE CONSTRAINT fk_approval_policy_stages_policy;

ALTER TABLE cluster_master
VALIDATE CONSTRAINT fk_cluster_master_workspace;

ALTER TABLE cluster_approver_master
VALIDATE CONSTRAINT fk_cluster_approver_master_cluster;

ALTER TABLE approver_overrides
VALIDATE CONSTRAINT fk_approver_overrides_workflow_instance;

ALTER TABLE workflow_stage_actions
VALIDATE CONSTRAINT fk_workflow_stage_actions_stage;
```

---

### Step 2.3: Review Migration

**Checklist:**
- [ ] All FKs have `NOT VALID` clause (for initial creation)
- [ ] All FKs have appropriate `ON DELETE` behavior
- [ ] FKs are in priority order (critical → high → medium → low)
- [ ] `VALIDATE CONSTRAINT` statements included at end
- [ ] Migration syntax is correct

**Validate Syntax:**

```bash
# Test migration syntax (dry run)
psql -U apms_staging -d apms_db -f prisma/migrations/YYYYMMDDHHMMSS_add_master_tables_fks/migration.sql --echo-errors --set ON_ERROR_STOP=on
```

**✅ Phase 2 Complete When:** Migration file created and syntax validated

---

## Phase 3: Test in Staging (Day 3)

**Goal:** Verify FK constraints work correctly

### Step 3.1: Apply Migration to Staging

```bash
# Backup staging database first
pg_dump -U apms_staging -d apms_db > /tmp/staging_backup_before_fks_$(date +%Y%m%d_%H%M%S).sql

# Apply migration
psql -U apms_staging -d apms_db -f prisma/migrations/YYYYMMDDHHMMSS_add_master_tables_fks/migration.sql
```

**Expected Output:** `ALTER TABLE` successful for all FKs

---

### Step 3.2: Validate Constraints

```sql
-- Validate all constraints (can take time on large datasets)
-- Run this during maintenance window or low-traffic period

-- Example: Validate one constraint at a time to monitor progress
ALTER TABLE workflow_instances
VALIDATE CONSTRAINT fk_workflow_instances_config_version;

-- Check progress
SELECT conname, convalidated
FROM pg_constraint
WHERE connamespace = 'public'::regnamespace
  AND contype = 'f'
ORDER BY conname;
```

**Expected Result:** All `convalidated = true`

---

### Step 3.3: Test FK Constraints

**Test 1: Prevent Invalid Insert**

```sql
-- Should FAIL: Invalid config_version_id
INSERT INTO workflow_instances (
  id, workspace_id, config_version_id, approval_policy_id,
  site_id, scope_id, atp_category, status, current_stage_number, created_by
)
VALUES (
  gen_random_uuid()::text,
  (SELECT id FROM workspaces LIMIT 1),
  'invalid-config-id',  -- <-- This doesn't exist
  gen_random_uuid()::text,
  'TEST-SITE-1',
  (SELECT id FROM atp_scope_master LIMIT 1),
  'HARDWARE',
  'IN_PROGRESS',
  1,
  'test-user'
);

-- Expected: ERROR: insert or update on table "workflow_instances" violates foreign key constraint
```

**Test 2: Prevent Cascade Delete (RESTRICT)**

```sql
-- Should FAIL: Cannot delete config referenced by workflow
DELETE FROM config_versions
WHERE id IN (SELECT id FROM workflow_instances LIMIT 1);

-- Expected: ERROR: update or delete on table "config_versions" violates foreign key constraint
```

**Test 3: Allow Cascade Delete (CASCADE)**

```sql
-- Should SUCCEED: Delete workflow (stages should cascade)
BEGIN;

-- Create test workflow
INSERT INTO workflow_instances (...) VALUES (...) RETURNING id INTO test_workflow_id;

-- Create test stage
INSERT INTO workflow_stages (workflow_instance_id, ...) VALUES (test_workflow_id, ...);

-- Delete workflow (stages should cascade)
DELETE FROM workflow_instances WHERE id = test_workflow_id;

-- Verify stages deleted
SELECT COUNT(*) FROM workflow_stages WHERE workflow_instance_id = test_workflow_id;
-- Expected: 0

ROLLBACK;  -- Cleanup
```

---

### Step 3.4: Test Application Error Handling

```bash
# Start staging backend (if not running)
pm2 restart apms-api-staging

# Test API endpoint with invalid data
curl -X POST https://apmsstaging.datacodesolution.com/api/v1/workflow-instances \
  -H "Content-Type: application/json" \
  -d '{
    "workspaceId": "valid-workspace-id",
    "configVersionId": "invalid-config-id",
    ...
  }'

# Expected: 400 Bad Request with clear error message
```

**Verify Application Logs:**

```bash
pm2 logs apms-api-staging --lines 50

# Should show FK violation error caught and returned to client
```

---

### Step 3.5: Re-Run Validation Runbook

```bash
# Use PATCHED runbook
cd backend/prisma/migrations/20251229010228_add_master_tables_final_v2

psql -U apms_staging -d apms_db -f 01_critical_C1_C2_PATCHED.sql
```

**Expected Results:**
- ✅ 16 tables created
- ✅ **45+ FK constraints** (was 1, now 45+)
- ✅ 21 CHECK constraints
- ✅ 0 orphaned records
- ✅ All type alignments match

**✅ Phase 3 Complete When:**
- All FK constraints applied
- All validation tests pass
- Application handles FK errors correctly
- Runbook shows 45+ FKs

---

## Phase 4: Performance Testing (Day 4-5)

**Goal:** Verify FK constraints don't impact performance significantly

### Step 4.1: Establish Baseline

**Before applying FKs (or use staging without FKs):**

```sql
-- Test query: Create workflow instance
EXPLAIN ANALYZE
INSERT INTO workflow_instances (id, workspace_id, config_version_id, ...)
SELECT gen_random_uuid()::text, ws.id, cv.id, ...
FROM workspaces ws
JOIN config_versions cv ON cv.workspace_id = ws.id
WHERE ws.code = 'XLSMART-AVIAT' AND cv.status = 'ACTIVE'
LIMIT 1;

-- Record baseline latency (e.g., 10ms)
```

---

### Step 4.2: Measure Performance After FKs

**After applying FKs:**

```sql
-- Run same query
EXPLAIN ANALYZE
INSERT INTO workflow_instances (id, workspace_id, config_version_id, ...)
SELECT gen_random_uuid()::text, ws.id, cv.id, ...
FROM workspaces ws
JOIN config_versions cv ON cv.workspace_id = ws.id
WHERE ws.code = 'XLSMART-AVIAT' AND cv.status = 'ACTIVE'
LIMIT 1;

-- Compare latency (e.g., 12ms = +2ms overhead)
```

**Acceptable Threshold:** +5-10ms per operation

---

### Step 4.3: Load Testing

```bash
# Use k6 or similar tool for load testing

# Test 1: Concurrent workflow creation
# 10 concurrent users, 100 iterations each
k6 run --vus 10 --iterations 100 tests/load/create-workflows.js

# Test 2: Bulk ATP submission creation
# 5 concurrent users, 50 iterations each
k6 run --vus 5 --iterations 50 tests/load/create-submissions.js
```

**Metrics to Capture:**
- Average latency
- P95 latency
- P99 latency
- Error rate
- Throughput (requests/second)

---

### Step 4.4: Review Query Plans

```sql
-- Check if indexes are being used
EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM workflow_instances
WHERE workspace_id = 'some-workspace-id'
  AND config_version_id = 'some-config-id';

-- Look for:
-- - Index Scan (good)
-- - Seq Scan (bad, may need index)
```

**If Seq Scan:**

```sql
-- Add composite index
CREATE INDEX idx_workflow_instances_workspace_config
ON workflow_instances(workspace_id, config_version_id);
```

---

### Step 4.5: Document Performance Results

| Operation | Baseline | With FKs | Overhead | Acceptable |
|-----------|----------|----------|----------|------------|
| Create workflow | 10ms | 12ms | +2ms | ✅ Yes |
| Create submission | 15ms | 17ms | +2ms | ✅ Yes |
| Bulk import (100) | 500ms | 550ms | +50ms | ✅ Yes |
| Query workflows | 5ms | 6ms | +1ms | ✅ Yes |

**✅ Phase 4 Complete When:** Performance overhead is acceptable (+5-10ms max)

---

## Phase 5: Production Deployment (Day 6-7)

**Goal:** Deploy FK constraints to production with minimal downtime

### Step 5.1: Pre-Deployment Checklist

**Planning:**
- [ ] Choose maintenance window (low-traffic period)
- [ ] Notify stakeholders (users, ops team)
- [ ] Schedule deployment window (e.g., 2 AM - 4 AM)
- [ ] Assign on-call engineer during deployment

**Preparation:**
- [ ] Create production database backup
- [ ] Test rollback procedure in staging
- [ ] Prepare monitoring dashboards
- [ ] Prepare smoke tests

**Backup:**

```bash
# On production server
ssh apms@apms.datacodesolution.com

# Create backup
pg_dump -U apms_user -d apms_db > /tmp/prod_backup_before_fks_$(date +%Y%m%d_%H%M%S).sql

# Verify backup
ls -lh /tmp/prod_backup_before_fks_*.sql
```

---

### Step 5.2: Apply Migration to Production

**During Maintenance Window:**

```bash
# SSH to production
ssh apms@apms.datacodesolution.com

# Navigate to backend directory
cd /var/www/apms/backend

# Pull latest migration
git pull origin main

# Apply migration (NOT VALID part only)
psql -U apms_user -d apms_db -f prisma/migrations/YYYYMMDDHHMMSS_add_master_tables_fks/migration.sql

# Check for errors
echo $?
# Should be 0
```

**Expected Output:** `ALTER TABLE` successful for all FKs

---

### Step 5.3: Validate Constraints

**After migration applied:**

```sql
-- Validate constraints (can be done after maintenance window)
-- Start with critical constraints first

ALTER TABLE workflow_instances
VALIDATE CONSTRAINT fk_workflow_instances_config_version;

-- Check progress
SELECT conname, convalidated
FROM pg_constraint
WHERE connamespace = 'public'::regnamespace
  AND contype = 'f'
  AND convalidated = false
ORDER BY conname;
```

**Continue validating remaining constraints during low-traffic periods**

---

### Step 5.4: Regenerate Prisma Client

```bash
# On production server
cd /var/www/apms/backend

# Regenerate Prisma client
npx prisma generate

# Restart backend service
pm2 restart apms-api-production

# Verify service is running
pm2 status apms-api-production
```

---

### Step 5.5: Smoke Tests

```bash
# Test 1: Health check
curl https://apms.datacodesolution.com/health
# Expected: 200 OK

# Test 2: Create workflow (via API or UI)
# Verify: Workflow created successfully

# Test 3: Query workflows
# Verify: Workloads returned correctly

# Test 4: Create ATP submission
# Verify: Submission created successfully
```

---

### Step 5.6: Monitor First 24 Hours

**Metrics to Watch:**

1. **Error Logs:**
   ```bash
   pm2 logs apms-api-production --err
   # Look for: FK violation errors
   ```

2. **Database Performance:**
   ```sql
   -- Check slow queries
   SELECT query, calls, total_time, mean_time
   FROM pg_stat_statements
   WHERE query LIKE '%workflow_instances%'
   ORDER BY mean_time DESC
   LIMIT 10;
   ```

3. **Application Metrics:**
   - Request latency
   - Error rate
   - Throughput

4. **User Feedback:**
   - Monitor support channels
   - Check for complaints about errors

---

### Step 5.7: Rollback Plan (If Needed)

**If critical issues occur:**

```bash
# Stop application
pm2 stop apms-api-production

# Drop FKs
psql -U apms_user -d apms_db <<EOF
ALTER TABLE workflow_instances DROP CONSTRAINT fk_workflow_instances_config_version;
ALTER TABLE workflow_instances DROP CONSTRAINT fk_workflow_instances_workspace;
-- ... repeat for all FKs
EOF

# Restart application
pm2 start apms-api-production

# Investigate issue
# Fix root cause
# Re-apply FKs when ready
```

**✅ Phase 5 Complete When:**
- All FKs applied to production
- All constraints validated
- Smoke tests passing
- 24-hour monitoring successful

---

## Success Criteria

### Phase Completion Criteria

| Phase | Criteria | Status |
|-------|----------|--------|
| Phase 1 | 0 orphaned records in staging | ⬜ |
| Phase 2 | Migration file created and syntax validated | ⬜ |
| Phase 3 | All FKs applied in staging, tests passing, runbook shows 45+ FKs | ⬜ |
| Phase 4 | Performance overhead acceptable (+5-10ms max) | ⬜ |
| Phase 5 | All FKs in production, smoke tests passing, 24-hr monitoring successful | ⬜ |

### Overall Success Criteria

- ✅ All 45+ FK constraints applied to production
- ✅ All constraints validated
- ✅ Application handles FK violations gracefully
- ✅ Performance impact acceptable (<10ms overhead)
- ✅ No data corruption
- ✅ Error rates not increased
- ✅ Runbook validates schema integrity

---

## Timeline

### Week 1
- **Day 1:** Phase 1 - Pre-FK Orphan Audit
- **Day 2:** Phase 2 - Create FK Migration
- **Day 3:** Phase 3 - Test in Staging
- **Day 4-5:** Phase 4 - Performance Testing

### Week 2
- **Day 6-7:** Phase 5 - Production Deployment

**Total:** 7-10 business days

---

## Risk Mitigation

### Low Risk Approach

1. **NOT VALID Pattern:** Minimizes migration locking
2. **Staging Testing:** Catches issues before production
3. **Backup Before Deploy:** Quick rollback capability
4. **Maintenance Window:** Reduces user impact
5. **Gradual Validation:** Spread validation over time

### Monitoring

- Real-time error monitoring
- Database performance metrics
- Application performance metrics
- User feedback channels

---

## Rollback Decision Matrix

| Scenario | Action | Rationale |
|----------|--------|-----------|
| Performance degradation >20ms | Rollback | Exceeds acceptable threshold |
| Error rate increase >5% | Rollback | Application impact too high |
| Critical user complaints | Rollback | Business impact |
| FK violation errors >1/hour | Investigate | May indicate data quality issues |
| All smoke tests pass | Continue | Deployment successful |

---

## Post-Deployment

### Day 1-7: Monitor

- Check error logs daily
- Review performance metrics
- Monitor user feedback
- Validate constraint counts

### Week 2-4: Optimize

- Review slow queries
- Add missing indexes if needed
- Optimize application code
- Update documentation

### Month 2+: Maintain

- Run FK health check monthly
- Review constraint violations
- Update runbook if needed
- Document lessons learned

---

## References

- [ADR 001: Foreign Key Strategy](./docs/ADR/001-foreign-key-strategy-master-tables-v2.md)
- [FK_STRATEGY_ANALYSIS.md](./FK_STRATEGY_ANALYSIS.md)
- [ORPHAN_CHECK_AUDITS.md](./ORPHAN_CHECK_AUDITS.md)
- [README_RUNBOOK.md](./backend/prisma/migrations/20251229010228_add_master_tables_final_v2/README_RUNBOOK.md)

---

**Execution Plan Status:** ✅ **READY TO EXECUTE**
**Next Step:** Phase 1 - Pre-FK Orphan Audit
**Timeline:** 7-10 business days
**Risk Level:** 🟢 LOW

---

*Created: 2025-12-29*
*Migration ID: 20251229010228_add_master_tables_final_v2*
*Decision: Option A - Add Missing FK Constraints*
*Execution: READY TO START*
