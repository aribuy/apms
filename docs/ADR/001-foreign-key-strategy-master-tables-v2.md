# ADR 001: Foreign Key Strategy for Master Tables V2

**Status:** ✅ **ACCEPTED**
**Date:** 2025-12-29
**Decision Makers:** Technical Lead / Architecture Team
**Migration:** `20251229010228_add_master_tables_final_v2`

---

## Context

During staging deployment of the master tables migration (`20251229010228_add_master_tables_final_v2`), schema validation revealed that only **1 foreign key constraint** was created out of approximately 45 potential relationships:

**Created:**
- `config_versions.workspace_id → workspaces.id`

**Missing (Critical Examples):**
- `workflow_instances.config_version_id → config_versions.id`
- `workflow_instances.workspace_id → workspaces.id`
- `workflow_stages.workflow_instance_id → workflow_instances.id`
- `atp_submissions.workflow_instance_id → workflow_instances.id`
- And ~40 other relationships

**Staging Validation Results:**
- ✅ Schema structure: 16/16 tables created
- ✅ Type alignments: All TEXT/UUID correct
- ✅ Core invariants: Freeze-by-reference verified working
- ✅ Service status: Online and stable
- ⚠️ **Referential integrity: Minimal enforcement (1 FK only)**

This creates a **MEDIUM risk** scenario where:
- Database does not enforce referential integrity
- Orphaned records can accumulate silently
- Application bugs can corrupt data without detection
- Requires permanent compensating controls if FKs not added

---

## Decision

**✅ CHOSEN: Option A - Add Missing Foreign Key Constraints**

We will add all missing foreign key constraints to enforce referential integrity at the database level before production deployment.

---

## Rationale

### Why Option A (Add FKs) Over Option B (Minimal FKs)

**1. Database as Single Source of Truth**
- PostgreSQL is designed to enforce referential integrity
- Database-level guarantees are more reliable than application-level validation
- Protects against data corruption even if application has bugs
- Industry best practice for relational databases

**2. Lower Operational Risk**
- **Option A Risk:** 🟢 LOW
- **Option B Risk:** 🟡 MEDIUM (requires permanent compensating controls)

**3. Simpler Application Code**
- No need to implement comprehensive validation in every service
- Trust database constraints instead of duplicating logic
- Easier to reason about system behavior
- Reduced code complexity = fewer bugs

**4. Faster Time to Production**
- **Option A:** 7-10 business days
- **Option B:** 12-15 business days (implementing compensating controls)

**5. Reduced Long-Term Maintenance**
- No permanent orphan-check audits required
- No additional monitoring infrastructure
- No ongoing validation code maintenance
- Database handles integrity automatically

**6. Negligible Performance Impact**
- FK validation overhead: +1-5ms per operation
- Modern PostgreSQL FK validation is highly optimized
- Proper indexing minimizes overhead
- Data integrity > micro-optimizations

**7. Production Readiness**
- Database constraints prevent silent corruption
- Automatic enforcement 24/7/365
- No reliance on application code correctness
- Easier compliance with data integrity requirements

---

## Alternatives Considered

### Option B: Minimal FK Strategy (REJECTED)

**Approach:** Keep only 1 FK, implement application-level validation

**Pros:**
- Faster bulk inserts (no FK validation overhead)
- More flexible data manipulation
- Easier data migration/repair

**Cons:**
- MEDIUM risk of silent data corruption
- Requires permanent compensating controls:
  - Comprehensive app-level validation (2-3 days implementation)
  - Daily orphan-check audits (ongoing operations burden)
  - Monitoring and alerting infrastructure
  - Remediation procedures and runbooks
- More complex application code
- Higher long-term maintenance cost
- Longer timeline to production (12-15 days)

**Rejection Rationale:**
The performance benefits are negligible compared to the risks and operational burden. Application-level validation is inherently less reliable than database constraints.

---

## Implementation Plan

### Phase 1: Pre-FK Orphan Audit (1 day)

**Objective:** Ensure no existing orphaned records before adding FKs

**Steps:**
1. Run comprehensive orphan detection queries
2. Document any orphaned records found
3. Decision: Fix orphans OR document as acceptable technical debt
4. Re-run audit to verify clean state

**Queries:** See [ORPHAN_CHECK_AUDITS.md](../../ORPHAN_CHECK_AUDITS.md)

**Success Criteria:**
- 0 orphaned records in critical relationships (workflow_instances, atp_submissions)
- Documented exceptions (if any) with remediation plan

---

### Phase 2: Create FK Migration (1 day)

**Objective:** Add all missing FK constraints using safe migration pattern

**Migration Pattern:** `NOT VALID` → `VALIDATE`

**Why this pattern:**
- `NOT VALID`: Adds constraint without checking existing data (fast, minimal locking)
- `VALIDATE`: Checks existing data in background (can be done later)
- Reduces migration risk and downtime

**Steps:**

```sql
-- Step 1: Create migration
npx prisma migrate dev --name add_master_tables_fks

-- Step 2: Edit migration file, use NOT VALID pattern
ALTER TABLE workflow_instances
ADD CONSTRAINT fk_workflow_instances_config_version
FOREIGN KEY (config_version_id)
REFERENCES config_versions(id)
ON DELETE RESTRICT
NOT VALID;  -- <-- Don't validate existing data yet

-- Step 3: Validate in separate step (can be done later)
ALTER TABLE workflow_instances
VALIDATE CONSTRAINT fk_workflow_instances_config_version;

-- Repeat for all FKs...
```

**FKs to Add (by priority):**

**Priority 1 (CRITICAL - Prevent orphaned workflows):**
```sql
-- Workflow instances must reference valid config
ALTER TABLE workflow_instances
ADD CONSTRAINT fk_workflow_instances_config_version
FOREIGN KEY (config_version_id) REFERENCES config_versions(id)
ON DELETE RESTRICT;

-- Workflow instances must belong to workspace
ALTER TABLE workflow_instances
ADD CONSTRAINT fk_workflow_instances_workspace
FOREIGN KEY (workspace_id) REFERENCES workspaces(id)
ON DELETE RESTRICT;
```

**Priority 2 (HIGH - Prevent orphaned stages):**
```sql
-- Workflow stages belong to workflow instance
ALTER TABLE workflow_stages
ADD CONSTRAINT fk_workflow_stages_workflow_instance
FOREIGN KEY (workflow_instance_id) REFERENCES workflow_instances(id)
ON DELETE CASCADE;

-- ATP submissions reference workflow
ALTER TABLE atp_submissions
ADD CONSTRAINT fk_atp_submissions_workflow_instance
FOREIGN KEY (workflow_instance_id) REFERENCES workflow_instances(id)
ON DELETE RESTRICT;
```

**Priority 3 (MEDIUM - Master tables):**
```sql
-- All master table workspace_id FKs
ALTER TABLE atp_scope_master
ADD CONSTRAINT fk_atp_scope_master_workspace
FOREIGN KEY (workspace_id) REFERENCES workspaces(id)
ON DELETE RESTRICT;

ALTER TABLE vendor_master
ADD CONSTRAINT fk_vendor_master_workspace
FOREIGN KEY (workspace_id) REFERENCES workspaces(id)
ON DELETE RESTRICT;

-- ... etc for all master tables
```

**Priority 4 (LOW - Nice-to-have):**
```sql
-- Cluster references, approval policies, etc.
-- Add as time permits
```

**See:** [FK_STRATEGY_ANALYSIS.md](../../FK_STRATEGY_ANALYSIS.md) for complete FK list

---

### Phase 3: Test in Staging (1 day)

**Objective:** Verify FK constraints work correctly

**Steps:**
1. Apply migration to staging database
2. Test `ON DELETE RESTRICT` prevents invalid deletions
3. Test `ON DELETE CASCADE` deletes child records correctly
4. Verify application handles FK violation errors gracefully
5. Re-run patched validation runbook

**Test Scenarios:**

```sql
-- Test 1: Cannot delete config_version referenced by workflow
DELETE FROM config_versions WHERE id = (SELECT id FROM config_versions LIMIT 1);
-- Expected: ERROR: FK violation

-- Test 2: Cannot create workflow with invalid config
INSERT INTO workflow_instances (config_version_id, ...)
VALUES ('non-existent-id', ...);
-- Expected: ERROR: FK violation

-- Test 3: Cascade delete works
DELETE FROM workflow_instances WHERE id = 'test-id';
-- Expected: workflow_stages for this workflow are deleted

-- Test 4: Application error handling
-- Attempt to create workflow with invalid config via API
-- Expected: 400 Bad Request with clear error message
```

**Success Criteria:**
- All FK constraints prevent invalid operations
- Application handles FK violations gracefully
- No data loss from cascade deletes
- Validation runbook passes with 45+ FKs

---

### Phase 4: Performance Testing (1 day)

**Objective:** Verify FK constraints don't impact performance significantly

**Steps:**
1. Establish baseline metrics (query latency, throughput)
2. Apply FK constraints
3. Re-measure performance
4. Compare pre/post FK metrics

**Key Metrics:**
- Workflow creation latency
- ATP submission creation latency
- Bulk config import performance
- Concurrent workflow creation throughput

**Acceptable Threshold:**
- +5-10ms overhead per operation
- No significant throughput degradation

**If performance impact exceeds threshold:**
- Review index coverage
- Optimize slow queries
- Consider selective FK removal (last resort)

---

### Phase 5: Production Deployment (1-2 days)

**Pre-Deployment:**
1. Create production database backup
2. Schedule maintenance window (low-traffic period)
3. Prepare rollback plan (reverse migration)
4. Notify stakeholders

**Deployment Steps:**
1. Apply FK migration to production
2. Monitor for FK violation errors
3. Validate constraints (`VALIDATE CONSTRAINT` steps)
4. Run smoke tests
5. Monitor application logs for errors

**Post-Deployment:**
1. Monitor error rates for 24 hours
2. Check for any FK violation spikes
3. Review application performance metrics
4. Validate no data corruption

**Rollback Plan:**
If critical issues occur:
```sql
-- Drop FKs
ALTER TABLE workflow_instances DROP CONSTRAINT fk_workflow_instances_config_version;
-- ... repeat for all FKs

-- Investigate issue
-- Fix root cause
-- Re-apply FKs
```

---

## ON DELETE Strategy

### Decision Matrix

| Relationship | ON DELETE | Rationale |
|--------------|-----------|-----------|
| config_versions → workspaces | RESTRICT | Preserve audit trail, prevent workspace deletion if configs exist |
| workflow_instances → config_versions | RESTRICT | **CRITICAL:** Freeze-by-reference requires frozen config |
| workflow_instances → workspaces | RESTRICT | Preserve audit trail, workspace isolation |
| workflow_stages → workflow_instances | CASCADE | Stages are part of workflow, delete if parent deleted |
| atp_submissions → workflow_instances | RESTRICT | Preserve submission audit trail |
| atp_submission_documents → atp_submissions | CASCADE | Documents belong to submission, safe to delete |
| punchlists → workflow_instances | RESTRICT | Preserve punchlist audit trail |
| punchlist_items → punchlists | CASCADE | Items belong to punchlist, safe to delete |
| All master tables → workspaces | RESTRICT | Preserve master data, workspace isolation |

**Principles:**
1. **Audit/history tables:** RESTRICT (preserve records)
2. **Child rows that are part of parent:** CASCADE (safe to delete)
3. **Workflow instances:** RESTRICT (preserve frozen config references)
4. **Master data:** RESTRICT (preserve business data)

---

## Consequences

### Positive
- ✅ Database enforces referential integrity
- ✅ No silent data corruption possible
- ✅ Simpler application code
- ✅ Lower operational risk
- ✅ Industry best practice followed
- ✅ Production-ready by default

### Negative
- ⚠️ Slight performance overhead (+1-5ms per operation)
- ⚠️ More complex data migrations (must respect FK order)
- ⚠️ Need to handle FK errors in application
- ⚠️ Requires 1-2 days extra development time

### Mitigations
- Performance impact is negligible (<5ms)
- Proper indexes minimize overhead
- Application error handling is straightforward
- Extra development time (7-10 days total) is acceptable for quality

---

## Compliance

### Data Integrity Requirements
- ✅ Database enforces referential integrity
- ✅ No orphaned records possible
- ✅ Audit trail preserved (ON DELETE RESTRICT)
- ✅ Workspace isolation guaranteed

### Monitoring
- ✅ FK violations are immediately visible (database errors)
- ✅ No need for permanent orphan-check audits
- ✅ Simplified monitoring (fewer alerts)

---

## References

### Documentation
- [FK_STRATEGY_ANALYSIS.md](../../FK_STRATEGY_ANALYSIS.md) - Detailed FK analysis
- [ORPHAN_CHECK_AUDITS.md](../../ORPHAN_CHECK_AUDITS.md) - Pre-FK audit queries
- [STAGING_DEPLOYMENT_FINAL_REPORT.md](../../STAGING_DEPLOYMENT_FINAL_REPORT.md) - Staging validation results
- [POST_STAGING_ACTION_ITEMS.md](../../POST_STAGING_ACTION_ITEMS.md) - Action items roadmap

### Migration Files
- `backend/prisma/migrations/20251229010228_add_master_tables_final_v2/migration.sql`
- `backend/prisma/migrations/20251229010228_add_master_tables_final_v2/constraints.sql`

### PostgreSQL Documentation
- [Foreign Key Constraints](https://www.postgresql.org/docs/current/ddl-constraints.html#DDL-CONSTRAINTS-FOREIGN-KEYS)
- [NOT VALID Constraint](https://www.postgresql.org/docs/current/sql-altertable.html)

---

## Timeline

| Phase | Duration | Target Date |
|-------|----------|-------------|
| Phase 1: Pre-FK Orphan Audit | 1 day | Week 1, Day 1 |
| Phase 2: Create FK Migration | 1 day | Week 1, Day 2 |
| Phase 3: Test in Staging | 1 day | Week 1, Day 3 |
| Phase 4: Performance Testing | 1 day | Week 1, Day 4-5 |
| Phase 5: Production Deployment | 1-2 days | Week 2, Day 1-2 |

**Total:** 7-10 business days

**Target Production Live Date:** Week 2, Day 3

---

## Reversibility

**Can this decision be reversed?** Yes, but **NOT RECOMMENDED**.

**If reversed (drop FKs):**
```sql
ALTER TABLE workflow_instances DROP CONSTRAINT fk_workflow_instances_config_version;
-- ... repeat for all FKs
```

**After reversal:**
- Must implement Option B compensating controls immediately
- Higher operational risk
- More complex application code
- Not recommended unless critical performance issue discovered

---

## Approval

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Technical Lead | _________________ | _____________ | _______ |
| Database Administrator | _________________ | _____________ | _______ |
| Development Lead | _________________ | _____________ | _______ |
| Product Owner | _________________ | _____________ | _______ |

---

**Decision Status:** ✅ **ACCEPTED**
**Implementation:** **READY TO START**
**Next Step:** Phase 1 - Pre-FK Orphan Audit

---

*ADR Created: 2025-12-29*
*Migration ID: 20251229010228_add_master_tables_final_v2*
*Decision: Option A - Add Missing Foreign Key Constraints*
*Rationale: Database integrity, simpler code, lower operational risk*
