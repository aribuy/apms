# Master Tables Implementation Guide

**Date:** 2025-12-29
**Status:** Ready for Implementation
**DDL Package:** PRODUCTION_GRADE_DDL.sql (Version 4.0 FINAL)

---

## Quick Start

### 1. Review Complete Documentation
- [PRODUCTION_GRADE_DDL.sql](./PRODUCTION_GRADE_DDL.sql) - Complete DDL package (16 tables)
- [Master_Tables_With_Versioned_Config.md](./Master_Tables_With_Versioned_Config.md) - Architecture v3.0
- [FINAL_Master_Tables_Proposal.md](./FINAL_Master_Tables_Proposal.md) - Design rationale v2.0
- [Master_Tables_Analysis.md](./Master_Tables_Analysis.md) - Initial analysis

### 2. Deployment Readiness Checklist
- [x] Complete DDL package created
- [x] Partial unique indexes for version control
- [x] All constraints and triggers defined
- [x] Deployment sequence documented
- [x] Validation scripts included
- [ ] Prisma schema conversion (NEXT STEP)
- [ ] Migration scripts creation
- [ ] Staging deployment
- [ ] Testing and validation
- [ ] Production deployment

---

## Architecture Summary

### Core Design Principles

1. **Workspace-Scoped Configuration**
   - All master config tables have `workspace_id + config_version_id`
   - Complete isolation between workspaces
   - No cross-workspace data leakage

2. **Versioned Configuration**
   - Every Excel import = new `config_version_id`
   - State machine: DRAFT → VALID → ACTIVE → ARCHIVED/SUPERSEDED
   - Partial unique index: Only 1 ACTIVE config per workspace per source_type
   - Runtime tables store frozen `config_version_id` (immutable)

3. **Freeze by Reference Strategy**
   - Config changes never affect running workflows
   - Full audit trail from runtime → config version → policy definition
   - Historical workflows remain intact even after config updates

4. **Cluster-Driven Routing**
   - Excel structure mapped to `cluster_master`
   - Geographic hierarchy: island_code → region_code → city_code
   - m_sequence (M1..M10) for ordering within region
   - Approver lookup: `cluster_approver_master` maps (cluster + role) → user_id

5. **Separation of Concerns**
   - RBAC roles (authentication) ≠ Approval roles (workflow chain)
   - Config tables (master) ≠ Runtime tables (instances)
   - Header tables (aggregates) ≠ Detail tables (line items)

---

## Table Structure Overview

### 16 Tables Total

**Core Infrastructure (1 table)**
1. `config_versions` - Heart of versioning system

**Master Configuration (8 tables)**
2. `atp_scope_master` - ATP scope definitions with scope_group
3. `vendor_master` - Vendor definitions
4. `approval_role_master` - Workflow chain roles (BO, SME, NOC_HEAD, etc.)
5. `approval_policy_master` - Policy header
6. `approval_policy_stages` - Policy detail with assignment modes
7. `cluster_master` - Cluster directory from Excel
8. `cluster_approver_master` - Cluster approver mapping

**Runtime Workflow (7 tables)**
9. `workflow_instances` - Runtime workflow header
10. `workflow_stages` - Runtime workflow detail
11. `approver_overrides` - Special case handling
12. `atp_submissions` - ATP process header
13. `atp_submission_documents` - Multi-upload support
14. `punchlists` - Punchlist header
15. `punchlist_items` - Punchlist detail
16. `workflow_stage_actions` - Granular audit log

---

## Critical Implementation Details

### 1. Partial Unique Index (MOST CRITICAL)

```sql
CREATE UNIQUE INDEX ux_config_versions_one_active_per_workspace
ON config_versions (workspace_id, source_type)
WHERE status = 'ACTIVE';
```

**What it does:**
- Ensures only 1 ACTIVE config per workspace per source_type
- Allows multiple DRAFT configs (for testing/validation)
- Allows multiple ARCHIVED configs (for history)

**Why it matters:**
- Prevents config conflicts
- Enables atomic version activation
- Supports rollback scenarios

### 2. scope_group Field

```sql
scope_group VARCHAR(50) NOT NULL
CHECK (scope_group IN ('MICROWAVE','RAN','CME','PLN'))
```

**Scope Groupings:**
- **MICROWAVE**: MW, MW_UPGRADE, MW_NEW, MW_DISMANTLE, VLAN_TAGGING
- **RAN**: RAN, RAN_UPGRADE, RAN_NEW
- **CME/PLN**: PLN, PLN_UPGRADE, PLN_NEW (Power Line Network)

### 3. Assignment Modes

```sql
assignment_mode VARCHAR(20) NOT NULL
CHECK (assignment_mode IN ('CLUSTER','STATIC_USER','RULE','AUTO'))
```

**Modes:**
- **CLUSTER**: Lookup approver from `cluster_approver_master`
- **STATIC_USER**: Predefined user in policy
- **RULE**: Custom logic (e.g., round-robin, load-based)
- **AUTO**: System assignment

### 4. Parallel Stages Support

```sql
is_parallel BOOLEAN DEFAULT FALSE,
parallel_group VARCHAR(10), -- A/B/C
```

**How it works:**
- Stages with same `parallel_group` can run in parallel
- All parallel stages must complete before moving to next stage
- Example: Stage 3A (SME_A) and Stage 3B (SME_B) run in parallel

### 5. Freeze by Reference

```sql
-- Runtime stores frozen config
CREATE TABLE workflow_instances (
    config_version_id UUID NOT NULL REFERENCES config_versions(id),
    ...
);
```

**Resolution Algorithm:**
```sql
SELECT * FROM approval_policy_master
WHERE workspace_id = :ws
  AND config_version_id = :cfg  -- FROZEN at creation
  AND scope_id = :scope
  AND (vendor_id = :vendor OR vendor_id IS NULL);
```

---

## Deployment Sequence

### Phase 1: Core Infrastructure
1. `config_versions`
2. `workspaces` (if not exists)

### Phase 2: Master Configuration
3. `atp_scope_master`
4. `vendor_master`
5. `approval_role_master`
6. `approval_policy_master`
7. `approval_policy_stages`

### Phase 3: Cluster Configuration
8. `cluster_master`
9. `cluster_approver_master`

### Phase 4: Runtime Workflow
10. `workflow_instances`
11. `workflow_stages`
12. `approver_overrides`

### Phase 5: ATP Submissions
13. `atp_submissions`
14. `atp_submission_documents`

### Phase 6: Punchlist System
15. `punchlists`
16. `punchlist_items`

### Phase 7: Audit & Logs
17. `workflow_stage_actions`

### Phase 8: Triggers
18. `trg_touch_updated_at()` function
19. Apply triggers to all tables

---

## Next Steps

### Step 1: Convert to Prisma Schema

Use the pattern from the previous session:

```prisma
model ConfigVersion {
  @@map("config_versions")

  id              String   @id @default(dbgenerated("gen_random_uuid()"))
  workspaceId     String   @map("workspace_id") @db.Uuid
  sourceFileName  String   @map("source_file_name") @db.VarChar(255)
  sourceType      String   @map("source_type") @db.VarChar(50)
  sourceChecksum  String?  @map("source_checksum") @db.VarChar(64)
  versionNumber   Int      @map("version_number")
  status          String   @map("status") @db.VarChar(20)
  // ... more fields

  workspace       Workspace @relation(fields: [workspaceId], references: [id])

  @@index([workspaceId, status], map: "idx_config_versions_workspace")
  @@index([workspaceId, sourceType, versionNumber(sort: Desc)], map: "idx_config_versions_version")
}

model AtpScopeMaster {
  @@map("atp_scope_master")

  id               String   @id @default(dbgenerated("gen_random_uuid()"))
  workspaceId      String   @map("workspace_id") @db.Uuid
  configVersionId  String   @map("config_version_id") @db.Uuid
  scopeCode        String   @map("scope_code") @db.VarChar(50)
  scopeName        String   @map("scope_name") @db.VarChar(150)
  scopeGroup       String   @map("scope_group") @db.VarChar(50)
  categoryCode     String?  @map("category_code") @db.VarChar(50)
  atpType          String   @map("atp_type") @default("BOTH") @db.VarChar(20)
  // ... more fields

  configVersion    ConfigVersion @relation(fields: [configVersionId], references: [id])
  workspace        Workspace @relation(fields: [workspaceId], references: [id])

  @@unique([workspaceId, scopeCode, configVersionId], map: "atp_scope_master_unique")
  @@index([workspaceId, configVersionId, isActive], map: "idx_atp_scope_workspace_version")
}
```

### Step 2: Create Migration Scripts

```bash
# Create migration
npx prisma migrate dev --name add_master_tables

# Generate Prisma Client
npx prisma generate

# Run migration in staging
npx prisma migrate deploy
```

### Step 3: Deploy to Staging

1. Backup staging database
2. Run migration scripts
3. Execute validation queries
4. Test Excel import flow
5. Verify version activation
6. Test runtime workflow creation

### Step 4: Create Import Services

```typescript
// services/ConfigImportService.ts
export class ConfigImportService {
  async importApprovalMatrix(file: Express.Multer.File, workspaceId: string) {
    // 1. Create config_version (DRAFT)
    const configVersion = await prisma.configVersion.create({
      data: {
        workspaceId,
        sourceFileName: file.originalname,
        sourceType: 'APPROVAL_MATRIX',
        versionNumber: await this.getNextVersionNumber(workspaceId, 'APPROVAL_MATRIX'),
        status: 'DRAFT',
      }
    });

    // 2. Parse Excel
    const data = await this.parseExcel(file);

    // 3. Validate data
    const validation = await this.validateData(data, workspaceId);
    if (!validation.isValid) {
      await prisma.configVersion.update({
        where: { id: configVersion.id },
        data: {
          validationStatus: 'INVALID',
          validationErrors: JSON.stringify(validation.errors),
        }
      });
      throw new Error(validation.errors.join(', '));
    }

    // 4. Import to master tables
    await this.importToMasterTables(data, configVersion.id, workspaceId);

    // 5. Update config_version to VALID
    await prisma.configVersion.update({
      where: { id: configVersion.id },
      data: {
        validationStatus: 'VALID',
        status: 'ACTIVE',
        activatedAt: new Date(),
      }
    });

    return configVersion;
  }
}
```

### Step 5: Create Runtime Services

```typescript
// services/WorkflowService.ts
export class WorkflowService {
  async createWorkflow(submissionData: AtpSubmissionDto) {
    // 1. Resolve approval policy
    const policy = await this.resolveApprovalPolicy({
      workspaceId: submissionData.workspaceId,
      scopeId: submissionData.scopeId,
      vendorId: submissionData.vendorId,
      atpCategory: submissionData.atpCategory,
    });

    // 2. Create workflow instance (FROZEN config_version_id)
    const workflow = await prisma.workflowInstance.create({
      data: {
        workspaceId: submissionData.workspaceId,
        configVersionId: policy.configVersionId, // FROZEN
        approvalPolicyId: policy.id,
        siteId: submissionData.siteId,
        vendorId: submissionData.vendorId,
        scopeId: submissionData.scopeId,
        atpCategory: submissionData.atpCategory,
        totalStages: policy.stages.length,
      }
    });

    // 3. Create workflow stages (FROZEN approvers)
    for (const stage of policy.stages) {
      const approver = await this.resolveApprover({
        stage,
        siteId: submissionData.siteId,
        configVersionId: policy.configVersionId, // FROZEN
      });

      await prisma.workflowStage.create({
        data: {
          workflowInstanceId: workflow.id,
          configVersionId: policy.configVersionId, // FROZEN
          stageNumber: stage.stageNumber,
          approvalRoleId: stage.approvalRoleId,
          isParallel: stage.isParallel,
          parallelGroup: stage.parallelGroup,
          approverUserId: approver.userId, // RESOLVED & FROZEN
          slaDueAt: this.calculateSlaDueAt(stage.slaHours),
          policyStageId: stage.id,
        }
      });
    }

    return workflow;
  }
}
```

---

## Validation Checklist

After deployment, verify:

- [ ] All 16 tables created successfully
- [ ] Partial unique indexes active (check `ux_config_versions_one_active_per_workspace`)
- [ ] All foreign keys valid (no orphaned references)
- [ ] Triggers active (`trg_*_touch` triggers)
- [ ] Constraints active (CHECK constraints on status fields, etc.)
- [ ] Sample data inserted successfully
- [ ] Version activation test (DRAFT → ACTIVE transition)
- [ ] Runtime workflow creation test (frozen config_version_id)
- [ ] Approver resolution test (cluster-driven lookup)

---

## Sample Data Initialization

See PRODUCTION_GRADE_DDL.sql for sample data:
- ATP scopes (MW, RAN, PLN with scope_group)
- Approval roles (BO, SME, NOC_HEAD, RTH_HEAD)
- Clusters (East Java, West Java, Central Java with M1..M10)

---

## Troubleshooting

### Issue: Duplicate ACTIVE configs
**Solution:** Check partial unique index. Only 1 ACTIVE per workspace per source_type allowed.

### Issue: Runtime workflow affected by config changes
**Solution:** Verify `config_version_id` is frozen at workflow creation. Do not update runtime tables when config changes.

### Issue: Approver not found
**Solution:** Check `cluster_approver_master` mapping. Verify `workspace_id + cluster_id + approval_role_id + config_version_id` combination exists.

### Issue: Version activation fails
**Solution:** Ensure current ACTIVE version is archived before activating new version. Use transaction for atomic operation.

---

## References

- [Complete DDL](./PRODUCTION_GRADE_DDL.sql)
- [Architecture v3.0](./Master_Tables_With_Versioned_Config.md)
- [Design Rationale v2.0](./FINAL_Master_Tables_Proposal.md)
- [Troubleshooting Log](./COMPREHENSIVE_TROUBLESHOOTING_LOG.md)

---

**Document Status:** ✅ Ready for Implementation
**Last Updated:** 2025-12-29
**Next Action:** Convert DDL to Prisma schema and create migration scripts
