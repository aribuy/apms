# Orphan-Check Audit Queries
## Data Integrity Monitoring for Minimal FK Strategy

**Date:** 2025-12-29
**Purpose:** SQL queries to detect orphaned records when database FK constraints are minimal

---

## Overview

When foreign key constraints are not enforced at the database level, orphaned records can accumulate over time due to:
- Application bugs
- Failed transactions
- Manual data manipulation
- Concurrent modification conflicts

This document provides SQL queries to detect and monitor orphaned records.

---

## Critical Audit Queries

### 1. Workflow Instances with Invalid Config Version

**Risk:** 🔴 HIGH - Workflows reference frozen configs that don't exist

```sql
-- File: audits/check_orphaned_workflow_configs.sql

SELECT
    'workflow_instances orphaned (config_version_id)' as check_name,
    COUNT(*) as orphan_count,
    NOW() as checked_at
FROM workflow_instances wi
LEFT JOIN config_versions cv ON wi.config_version_id = cv.id
WHERE cv.id IS NULL;

-- Detailed breakdown:
SELECT
    wi.id as workflow_id,
    wi.workspace_id,
    wi.config_version_id as missing_config_id,
    wi.site_id,
    wi.status,
    wi.created_at
FROM workflow_instances wi
LEFT JOIN config_versions cv ON wi.config_version_id = cv.id
WHERE cv.id IS NULL
ORDER BY wi.created_at DESC;
```

**Threshold:** 🚨 **ALERT if count > 0** (should never have orphaned workflows)

---

### 2. Workflow Instances with Invalid Workspace

**Risk:** 🔴 HIGH - Workflows in non-existent workspaces

```sql
-- File: audits/check_orphaned_workspaces.sql

SELECT
    'workflow_instances orphaned (workspace_id)' as check_name,
    COUNT(*) as orphan_count,
    NOW() as checked_at
FROM workflow_instances wi
LEFT JOIN workspaces w ON wi.workspace_id = w.id
WHERE w.id IS NULL;

-- Detailed breakdown:
SELECT
    wi.id as workflow_id,
    wi.workspace_id as missing_workspace_id,
    wi.config_version_id,
    wi.site_id,
    wi.status
FROM workflow_instances wi
LEFT JOIN workspaces w ON wi.workspace_id = w.id
WHERE w.id IS NULL;
```

**Threshold:** 🚨 **ALERT if count > 0**

---

### 3. Workflow Stages with Invalid Workflow Instance

**Risk:** 🔴 HIGH - Approval stages without parent workflow

```sql
-- File: audits/check_orphaned_workflow_stages.sql

SELECT
    'workflow_stages orphaned (workflow_instance_id)' as check_name,
    COUNT(*) as orphan_count,
    NOW() as checked_at
FROM workflow_stages ws
LEFT JOIN workflow_instances wi ON ws.workflow_instance_id = wi.id
WHERE wi.id IS NULL;

-- Detailed breakdown:
SELECT
    ws.id as stage_id,
    ws.workflow_instance_id as missing_workflow_id,
    ws.stage_number,
    ws.stage_name,
    ws.status
FROM workflow_stages ws
LEFT JOIN workflow_instances wi ON ws.workflow_instance_id = wi.id
WHERE wi.id IS NULL
ORDER BY ws.created_at DESC;
```

**Threshold:** 🚨 **ALERT if count > 0**

---

### 4. ATP Submissions with Invalid Workflow

**Risk:** 🔴 HIGH - Submissions not linked to valid workflow

```sql
-- File: audits/check_orphaned_atp_submissions.sql

SELECT
    'atp_submissions orphaned (workflow_instance_id)' as check_name,
    COUNT(*) as orphan_count,
    NOW() as checked_at
FROM atp_submissions atp
LEFT JOIN workflow_instances wi ON atp.workflow_instance_id = wi.id
WHERE wi.id IS NULL;

-- Detailed breakdown:
SELECT
    atp.id as submission_id,
    atp.workflow_instance_id as missing_workflow_id,
    atp.submitted_by,
    atp.submission_date,
    atp.status
FROM atp_submissions atp
LEFT JOIN workflow_instances wi ON atp.workflow_instance_id = wi.id
WHERE wi.id IS NULL
ORDER BY atp.submission_date DESC;
```

**Threshold:** 🚨 **ALERT if count > 0**

---

### 5. ATP Scope Master with Invalid Workspace

**Risk:** 🟡 MEDIUM - Scopes not linked to workspace

```sql
-- File: audits/check_orphaned_atp_scopes.sql

SELECT
    'atp_scope_master orphaned (workspace_id)' as check_name,
    COUNT(*) as orphan_count,
    NOW() as checked_at
FROM atp_scope_master asm
LEFT JOIN workspaces w ON asm.workspace_id = w.id
WHERE w.id IS NULL;

-- Detailed breakdown:
SELECT
    asm.id as scope_id,
    asm.workspace_id as missing_workspace_id,
    asm.scope_code,
    asm.scope_name,
    asm.is_active
FROM atp_scope_master asm
LEFT JOIN workspaces w ON asm.workspace_id = w.id
WHERE w.id IS NULL;
```

**Threshold:** ⚠️ **WARN if count > 0**

---

### 6. Config Versions with Invalid Workspace

**Risk:** 🟡 MEDIUM - Configs in non-existent workspaces

```sql
-- File: audits/check_orphaned_config_versions.sql

SELECT
    'config_versions orphaned (workspace_id)' as check_name,
    COUNT(*) as orphan_count,
    NOW() as checked_at
FROM config_versions cv
LEFT JOIN workspaces w ON cv.workspace_id = w.id
WHERE w.id IS NULL;

-- Detailed breakdown:
SELECT
    cv.id as config_id,
    cv.workspace_id as missing_workspace_id,
    cv.version_number,
    cv.status,
    cv.source_file_name
FROM config_versions cv
LEFT JOIN workspaces w ON cv.workspace_id = w.id
WHERE w.id IS NULL
ORDER BY cv.created_at DESC;
```

**Threshold:** ⚠️ **WARN if count > 0**

---

### 7. Punchlists with Invalid Workflow

**Risk:** 🟡 MEDIUM - Punchlists without valid workflow

```sql
-- File: audits/check_orphaned_punchlists.sql

SELECT
    'punchlists orphaned (workflow_instance_id)' as check_name,
    COUNT(*) as orphan_count,
    NOW() as checked_at
FROM punchlists p
LEFT JOIN workflow_instances wi ON p.workflow_instance_id = wi.id
WHERE wi.id IS NULL;

-- Detailed breakdown:
SELECT
    p.id as punchlist_id,
    p.workflow_instance_id as missing_workflow_id,
    p.punchlist_type,
    p.status,
    p.created_at
FROM punchlists p
LEFT JOIN workflow_instances wi ON p.workflow_instance_id = wi.id
WHERE wi.id IS NULL
ORDER BY p.created_at DESC;
```

**Threshold:** ⚠️ **WARN if count > 0**

---

### 8. Approval Policy Master with Invalid Workspace

**Risk:** 🟡 MEDIUM - Policies in non-existent workspaces

```sql
-- File: audits/check_orphaned_approval_policies.sql

SELECT
    'approval_policy_master orphaned (workspace_id)' as check_name,
    COUNT(*) as orphan_count,
    NOW() as checked_at
FROM approval_policy_master apm
LEFT JOIN workspaces w ON apm.workspace_id = w.id
WHERE w.id IS NULL;

-- Detailed breakdown:
SELECT
    apm.id as policy_id,
    apm.workspace_id as missing_workspace_id,
    apm.policy_code,
    apm.policy_name,
    apm.is_active
FROM approval_policy_master apm
LEFT JOIN workspaces w ON apm.workspace_id = w.id
WHERE w.id IS NULL;
```

**Threshold:** ⚠️ **WARN if count > 0**

---

## Comprehensive Audit Report

### All Orphan Checks in One Query

```sql
-- File: audits/comprehensive_orphan_report.sql

WITH

-- Check 1: Workflow instances with missing config
workflow_config_orphans AS (
    SELECT COUNT(*) as count
    FROM workflow_instances wi
    LEFT JOIN config_versions cv ON wi.config_version_id = cv.id
    WHERE cv.id IS NULL
),

-- Check 2: Workflow instances with missing workspace
workflow_workspace_orphans AS (
    SELECT COUNT(*) as count
    FROM workflow_instances wi
    LEFT JOIN workspaces w ON wi.workspace_id = w.id
    WHERE w.id IS NULL
),

-- Check 3: Workflow stages with missing workflow
stage_orphans AS (
    SELECT COUNT(*) as count
    FROM workflow_stages ws
    LEFT JOIN workflow_instances wi ON ws.workflow_instance_id = wi.id
    WHERE wi.id IS NULL
),

-- Check 4: ATP submissions with missing workflow
atp_submission_orphans AS (
    SELECT COUNT(*) as count
    FROM atp_submissions atp
    LEFT JOIN workflow_instances wi ON atp.workflow_instance_id = wi.id
    WHERE wi.id IS NULL
),

-- Check 5: Config versions with missing workspace
config_workspace_orphans AS (
    SELECT COUNT(*) as count
    FROM config_versions cv
    LEFT JOIN workspaces w ON cv.workspace_id = w.id
    WHERE w.id IS NULL
),

-- Check 6: ATP scopes with missing workspace
atp_scope_orphans AS (
    SELECT COUNT(*) as count
    FROM atp_scope_master asm
    LEFT JOIN workspaces w ON asm.workspace_id = w.id
    WHERE w.id IS NULL
),

-- Check 7: Punchlists with missing workflow
punchlist_orphans AS (
    SELECT COUNT(*) as count
    FROM punchlists p
    LEFT JOIN workflow_instances wi ON p.workflow_instance_id = wi.id
    WHERE wi.id IS NULL
),

-- Check 8: Approval policies with missing workspace
approval_policy_orphans AS (
    SELECT COUNT(*) as count
    FROM approval_policy_master apm
    LEFT JOIN workspaces w ON apm.workspace_id = w.id
    WHERE w.id IS NULL
)

SELECT
    NOW() as checked_at,
    workflow_config_orphans.count as workflow_config_orphans,
    workflow_workspace_orphans.count as workflow_workspace_orphans,
    stage_orphans.count as stage_orphans,
    atp_submission_orphans.count as atp_submission_orphans,
    config_workspace_orphans.count as config_workspace_orphans,
    atp_scope_orphans.count as atp_scope_orphans,
    punchlist_orphans.count as punchlist_orphans,
    approval_policy_orphans.count as approval_policy_orphans,
    (
        workflow_config_orphans.count +
        workflow_workspace_orphans.count +
        stage_orphans.count +
        atp_submission_orphans.count +
        config_workspace_orphans.count +
        atp_scope_orphans.count +
        punchlist_orphans.count +
        approval_policy_orphans.count
    ) as total_orphans,
    CASE
        WHEN (
            workflow_config_orphans.count +
            workflow_workspace_orphans.count +
            stage_orphans.count +
            atp_submission_orphans.count +
            config_workspace_orphans.count +
            atp_scope_orphans.count +
            punchlist_orphans.count +
            approval_policy_orphans.count
        ) = 0 THEN '✅ HEALTHY'
        ELSE '🚨 DATA INTEGRITY ISSUES DETECTED'
    END as health_status;
```

---

## Automated Monitoring

### Create Audit Log Table

```sql
-- File: audits/01_create_audit_log_table.sql

CREATE TABLE IF NOT EXISTS data_integrity_audit_log (
    id BIGSERIAL PRIMARY KEY,
    checked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    workflow_config_orphans INTEGER NOT NULL DEFAULT 0,
    workflow_workspace_orphans INTEGER NOT NULL DEFAULT 0,
    stage_orphans INTEGER NOT NULL DEFAULT 0,
    atp_submission_orphans INTEGER NOT NULL DEFAULT 0,
    config_workspace_orphans INTEGER NOT NULL DEFAULT 0,
    atp_scope_orphans INTEGER NOT NULL DEFAULT 0,
    punchlist_orphans INTEGER NOT NULL DEFAULT 0,
    approval_policy_orphans INTEGER NOT NULL DEFAULT 0,
    total_orphans INTEGER NOT NULL DEFAULT 0,
    health_status TEXT NOT NULL,
    details JSONB
);

CREATE INDEX idx_audit_log_checked_at ON data_integrity_audit_log(checked_at DESC);
CREATE INDEX idx_audit_log_health_status ON data_integrity_audit_log(health_status);

COMMENT ON TABLE data_integrity_audit_log IS 'Audit log for data integrity checks';
COMMENT ON COLUMN data_integrity_audit_log.details IS 'Detailed breakdown of orphaned records';
```

---

### Scheduled Audit Function

```sql
-- File: audits/02_run_audit_function.sql

CREATE OR REPLACE FUNCTION run_data_integrity_audit()
RETURNS TABLE (
    checked_at TIMESTAMPTZ,
    total_orphans BIGINT,
    health_status TEXT
) AS $$
DECLARE
    v_workflow_config_orphans BIGINT;
    v_workflow_workspace_orphans BIGINT;
    v_stage_orphans BIGINT;
    v_atp_submission_orphans BIGINT;
    v_config_workspace_orphans BIGINT;
    v_atp_scope_orphans BIGINT;
    v_punchlist_orphans BIGINT;
    v_approval_policy_orphans BIGINT;
    v_total_orphans BIGINT;
    v_health_status TEXT;
    v_details JSONB;
BEGIN
    -- Run all checks
    SELECT COUNT(*) INTO v_workflow_config_orphans
    FROM workflow_instances wi
    LEFT JOIN config_versions cv ON wi.config_version_id = cv.id
    WHERE cv.id IS NULL;

    SELECT COUNT(*) INTO v_workflow_workspace_orphans
    FROM workflow_instances wi
    LEFT JOIN workspaces w ON wi.workspace_id = w.id
    WHERE w.id IS NULL;

    SELECT COUNT(*) INTO v_stage_orphans
    FROM workflow_stages ws
    LEFT JOIN workflow_instances wi ON ws.workflow_instance_id = wi.id
    WHERE wi.id IS NULL;

    SELECT COUNT(*) INTO v_atp_submission_orphans
    FROM atp_submissions atp
    LEFT JOIN workflow_instances wi ON atp.workflow_instance_id = wi.id
    WHERE wi.id IS NULL;

    SELECT COUNT(*) INTO v_config_workspace_orphans
    FROM config_versions cv
    LEFT JOIN workspaces w ON cv.workspace_id = w.id
    WHERE w.id IS NULL;

    SELECT COUNT(*) INTO v_atp_scope_orphans
    FROM atp_scope_master asm
    LEFT JOIN workspaces w ON asm.workspace_id = w.id
    WHERE w.id IS NULL;

    SELECT COUNT(*) INTO v_punchlist_orphans
    FROM punchlists p
    LEFT JOIN workflow_instances wi ON p.workflow_instance_id = wi.id
    WHERE wi.id IS NULL;

    SELECT COUNT(*) INTO v_approval_policy_orphans
    FROM approval_policy_master apm
    LEFT JOIN workspaces w ON apm.workspace_id = w.id
    WHERE w.id IS NULL;

    -- Calculate total
    v_total_orphans :=
        v_workflow_config_orphans +
        v_workflow_workspace_orphans +
        v_stage_orphans +
        v_atp_submission_orphans +
        v_config_workspace_orphans +
        v_atp_scope_orphans +
        v_punchlist_orphans +
        v_approval_policy_orphans;

    -- Determine health status
    v_health_status := CASE
        WHEN v_total_orphans = 0 THEN '✅ HEALTHY'
        ELSE '🚨 DATA INTEGRITY ISSUES DETECTED'
    END;

    -- Build details JSON
    v_details := jsonb_build_object(
        'workflow_config_orphans', v_workflow_config_orphans,
        'workflow_workspace_orphans', v_workflow_workspace_orphans,
        'stage_orphans', v_stage_orphans,
        'atp_submission_orphans', v_atp_submission_orphans,
        'config_workspace_orphans', v_config_workspace_orphans,
        'atp_scope_orphans', v_atp_scope_orphans,
        'punchlist_orphans', v_punchlist_orphans,
        'approval_policy_orphans', v_approval_policy_orphans
    );

    -- Log to audit table
    INSERT INTO data_integrity_audit_log (
        checked_at,
        workflow_config_orphans,
        workflow_workspace_orphans,
        stage_orphans,
        atp_submission_orphans,
        config_workspace_orphans,
        atp_scope_orphans,
        punchlist_orphans,
        approval_policy_orphans,
        total_orphans,
        health_status,
        details
    ) VALUES (
        NOW(),
        v_workflow_config_orphans,
        v_workflow_workspace_orphans,
        v_stage_orphans,
        v_atp_submission_orphans,
        v_config_workspace_orphans,
        v_atp_scope_orphans,
        v_punchlist_orphans,
        v_approval_policy_orphans,
        v_total_orphans,
        v_health_status,
        v_details
    );

    -- Return results
    RETURN QUERY SELECT NOW(), v_total_orphans, v_health_status;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION run_data_integrity_audit() IS 'Run all orphan-check queries and log results';
```

---

### Schedule Automated Audits

```sql
-- File: audits/03_schedule_daily_audits.sql

-- Run audit every day at 2 AM
-- Note: Requires pg_cron extension to be installed
-- CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Uncomment to schedule:
-- SELECT cron.schedule(
--     'data-integrity-audit',
--     '0 2 * * *', -- Every day at 2 AM
--     'SELECT run_data_integrity_audit();'
-- );

-- Manual alternative: Create a job in your application
```

---

## Application Integration

### Node.js Audit Runner

```javascript
// backend/src/jobs/dataIntegrityAudit.js

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Run data integrity audit and log results
 */
export async function runDataIntegrityAudit() {
  const startTime = Date.now();

  try {
    // Run the audit function
    const result = await prisma.$queryRaw`
      SELECT * FROM run_data_integrity_audit()
    `;

    const audit = result[0];

    console.log('=== Data Integrity Audit Results ===');
    console.log(`Checked At: ${audit.checked_at}`);
    console.log(`Total Orphans: ${audit.total_orphans}`);
    console.log(`Health Status: ${audit.health_status}`);

    // Alert if issues detected
    if (audit.total_orphans > 0) {
      console.error('⚠️ DATA INTEGRITY ISSUES DETECTED!');
      console.error('Please review orphan-check-audits.md for remediation');

      // Send alert (e.g., Slack, email, PagerDuty)
      await sendAlert({
        severity: 'WARNING',
        title: 'Data Integrity Issues Detected',
        message: `${audit.total_orphans} orphaned records found in database`,
        details: audit
      });
    }

    const duration = Date.now() - startTime;
    console.log(`Audit completed in ${duration}ms`);

    return audit;
  } catch (error) {
    console.error('Error running data integrity audit:', error);
    throw error;
  }
}

/**
 * Send alert to monitoring system
 */
async function sendAlert({ severity, title, message, details }) {
  // Implement your alerting logic here
  // Examples: Slack webhook, Email, PagerDuty, Sentry
  console.log(`[${severity}] ${title}: ${message}`);
}

// Command-line usage:
// node -e "import('./src/jobs/dataIntegrityAudit.js').then(m => m.runDataIntegrityAudit())"
```

---

## Alert Thresholds

### Recommended Alerting Rules

| Check Type | Threshold | Action |
|------------|-----------|--------|
| workflow_config_orphans | > 0 | 🚨 CRITICAL - Immediate investigation required |
| workflow_workspace_orphans | > 0 | 🚨 CRITICAL - Immediate investigation required |
| stage_orphans | > 0 | ⚠️ WARNING - Investigate within 24 hours |
| atp_submission_orphans | > 0 | 🚨 CRITICAL - Investigate within 4 hours |
| config_workspace_orphans | > 0 | ⚠️ WARNING - Investigate within 24 hours |
| atp_scope_orphans | > 0 | ⚠️ WARNING - Investigate within 24 hours |
| punchlist_orphans | > 0 | ⚠️ WARNING - Investigate within 24 hours |
| approval_policy_orphans | > 0 | ⚠️ WARNING - Investigate within 24 hours |

---

## Remediation

### If Orphans Detected

**Step 1: Investigate Root Cause**
```sql
-- Find orphaned records with details
SELECT * FROM comprehensive_orphan_report;
```

**Step 2: Review Application Logs**
- Check for failed transactions
- Look for concurrent modification errors
- Review recent deployments

**Step 3: Decide on Remediation Strategy**

Option A: **Delete Orphans** (if truly orphaned)
```sql
-- EXAMPLE: Delete workflow stages with missing parent
DELETE FROM workflow_stages
WHERE workflow_instance_id IN (
    SELECT ws.id
    FROM workflow_stages ws
    LEFT JOIN workflow_instances wi ON ws.workflow_instance_id = wi.id
    WHERE wi.id IS NULL
);
```

Option B: **Restore Missing References** (if references were accidentally deleted)
```sql
-- This requires manual restoration from backups
-- or recreating missing parent records
```

Option C: **Flag for Manual Review** (recommended)
```sql
-- Add a flag column
ALTER TABLE workflow_stages ADD COLUMN needs_review BOOLEAN DEFAULT false;

UPDATE workflow_stages
SET needs_review = true
WHERE workflow_instance_id IN (
    SELECT ws.id
    FROM workflow_stages ws
    LEFT JOIN workflow_instances wi ON ws.workflow_instance_id = wi.id
    WHERE wi.id IS NULL
);
```

---

## Monitoring Dashboard Query

### Recent Audit History

```sql
-- File: audits/audit_history_dashboard.sql

SELECT
    checked_at,
    total_orphans,
    workflow_config_orphans,
    workflow_workspace_orphans,
    stage_orphans,
    atp_submission_orphans,
    health_status
FROM data_integrity_audit_log
ORDER BY checked_at DESC
LIMIT 30;

-- Summary statistics
SELECT
    COUNT(*) as total_audits,
    MIN(checked_at) as first_audit,
    MAX(checked_at) as latest_audit,
    AVG(total_orphans) as avg_orphans,
    MAX(total_orphans) as max_orphans,
    SUM(CASE WHEN health_status = '✅ HEALTHY' THEN 1 ELSE 0 END) as healthy_checks,
    SUM(CASE WHEN health_status = '🚨 DATA INTEGRITY ISSUES DETECTED' THEN 1 ELSE 0 END) as failed_checks
FROM data_integrity_audit_log;
```

---

## Production Checklist

Before deploying to production with minimal FK strategy:

- [ ] Create audit log table (`01_create_audit_log_table.sql`)
- [ ] Create audit function (`02_run_audit_function.sql`)
- [ ] Schedule daily audits (cron or application job)
- [ ] Configure alerting for orphan detection
- [ ] Test remediation procedures in staging
- [ ] Document escalation procedures
- [ ] Create runbook for common orphan scenarios
- [ ] Integrate with monitoring dashboard
- [ ] Train operations team on remediation

---

## Conclusion

Orphan-check audits are **essential** when database foreign key constraints are minimal. This document provides:

- ✅ Critical orphan detection queries
- ✅ Comprehensive audit report
- ✅ Automated monitoring setup
- ✅ Application integration examples
- ✅ Alert threshold recommendations
- ✅ Remediation strategies

**However, the recommended approach is still to use database foreign key constraints** to prevent orphans from occurring in the first place. See [FK_STRATEGY_ANALYSIS.md](./FK_STRATEGY_ANALYSIS.md) for details.

---

*Created: 2025-12-29*
*Related: [FK_STRATEGY_ANALYSIS.md](./FK_STRATEGY_ANALYSIS.md) | [APP_LEVEL_VALIDATION.md](./APP_LEVEL_VALIDATION.md)*
