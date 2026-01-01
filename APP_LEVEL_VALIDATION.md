# Application-Level Validation Examples
## Compensating Controls for Minimal FK Strategy

**Date:** 2025-12-29
**Purpose:** Provide code examples for referential integrity validation if using minimal FK strategy

---

## Overview

When database foreign key constraints are minimal, the application must enforce referential integrity. This document provides Prisma-based validation examples for all critical relationships.

---

## Core Validation Pattern

### Generic Reference Validator

```typescript
// backend/src/utils/referenceValidator.ts

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Generic validator for checking if a referenced record exists
 * @param tableName - Name of the table to check
 * @param id - ID value to validate
 * @param idColumn - ID column name (default: 'id')
 * @returns Promise<boolean> - true if reference exists
 */
export async function referenceExists(
  tableName: string,
  id: string,
  idColumn: string = 'id'
): Promise<boolean> {
  try {
    // @ts-ignore - Dynamic table access
    const record = await prisma[tableName].findUnique({
      where: { [idColumn]: id },
      select: { [idColumn]: true }
    });
    return record !== null;
  } catch (error) {
    console.error(`Reference check failed for ${tableName}.${idColumn}:`, error);
    return false;
  }
}

/**
 * Validate multiple references in parallel
 * @param validations - Array of validation objects
 * @returns Object with validation results
 */
export async function validateReferences(
  validations: Array<{
    tableName: string;
    id: string;
    idColumn?: string;
    fieldName: string; // For error messages
  }>
): Promise<{ valid: boolean; errors: string[] }> {
  const results = await Promise.all(
    validations.map(async (v) => ({
      fieldName: v.fieldName,
      exists: await referenceExists(v.tableName, v.id, v.idColumn)
    }))
  );

  const errors = results
    .filter((r) => !r.exists)
    .map((r) => `Invalid reference: ${r.fieldName}`);

  return {
    valid: errors.length === 0,
    errors
  };
}
```

---

## Workflow Instance Validation

### Creating Workflow Instance

```typescript
// backend/src/services/workflowInstanceService.ts

import { prisma } from '../lib/prisma';
import { validateReferences } from '../utils/referenceValidator';

export async function createWorkflowInstance(data: {
  workspaceId: string;
  configVersionId: string;
  approvalPolicyId: string;
  siteId: string;
  scopeId: string;
  atpCategory: string;
  createdBy: string;
}) {
  // ============================================================
  // STEP 1: Validate all references before creating record
  // ============================================================
  const validation = await validateReferences([
    {
      tableName: 'workspace',
      id: data.workspaceId,
      fieldName: 'workspaceId'
    },
    {
      tableName: 'configVersion',
      id: data.configVersionId,
      fieldName: 'configVersionId'
    },
    {
      tableName: 'approvalPolicyMaster',
      id: data.approvalPolicyId,
      fieldName: 'approvalPolicyId'
    },
    {
      tableName: 'atpScopeMaster',
      id: data.scopeId,
      fieldName: 'scopeId'
    }
  ]);

  if (!validation.valid) {
    throw new Error(
      `Referential integrity violation:\n${validation.errors.join('\n')}`
    );
  }

  // ============================================================
  // STEP 2: Additional business logic validation
  // ============================================================

  // Verify config_version belongs to workspace
  const configVersion = await prisma.configVersion.findUnique({
    where: { id: data.configVersionId }
  });

  if (configVersion?.workspaceId !== data.workspaceId) {
    throw new Error(
      'Config version does not belong to the specified workspace'
    );
  }

  // Verify config_version is ACTIVE (not DRAFT)
  if (configVersion?.status !== 'ACTIVE') {
    throw new Error(
      'Cannot create workflow from DRAFT config version. Use ACTIVE version.'
    );
  }

  // Verify approval_policy belongs to workspace
  const approvalPolicy = await prisma.approvalPolicyMaster.findUnique({
    where: { id: data.approvalPolicyId }
  });

  if (approvalPolicy?.workspaceId !== data.workspaceId) {
    throw new Error(
      'Approval policy does not belong to the specified workspace'
    );
  }

  // ============================================================
  // STEP 3: Create workflow instance
  // ============================================================
  const workflowInstance = await prisma.workflowInstance.create({
    data: {
      id: crypto.randomUUID(),
      workspaceId: data.workspaceId,
      configVersionId: data.configVersionId, // FROZEN reference
      approvalPolicyId: data.approvalPolicyId,
      siteId: data.siteId,
      scopeId: data.scopeId,
      atpCategory: data.atpCategory,
      status: 'IN_PROGRESS',
      currentStageNumber: 1,
      createdBy: data.createdBy,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  });

  return workflowInstance;
}
```

---

## ATP Submission Validation

### Creating ATP Submission

```typescript
// backend/src/services/atpSubmissionService.ts

import { prisma } from '../lib/prisma';
import { validateReferences } from '../utils/referenceValidator';

export async function createATPSubmission(data: {
  workflowInstanceId: string;
  submittedBy: string;
  files: Array<{
    fileName: string;
    fileUrl: string;
    uploadedBy: string;
  }>;
}) {
  // ============================================================
  // STEP 1: Validate workflow_instance exists
  // ============================================================
  const workflowExists = await validateReferences([
    {
      tableName: 'workflowInstance',
      id: data.workflowInstanceId,
      fieldName: 'workflowInstanceId'
    }
  ]);

  if (!workflowExists.valid) {
    throw new Error('Invalid workflow_instance_id');
  });

  // ============================================================
  // STEP 2: Validate workflow state
  // ============================================================
  const workflow = await prisma.workflowInstance.findUnique({
    where: { id: data.workflowInstanceId },
    include: {
      configVersion: true
    }
  });

  if (!workflow) {
    throw new Error('Workflow instance not found');
  }

  // Verify workflow is in correct state for submission
  if (workflow.status !== 'IN_PROGRESS') {
    throw new Error(
      `Cannot submit ATP for workflow in status: ${workflow.status}`
    );
  }

  // ============================================================
  // STEP 3: Create ATP submission
  // ============================================================
  const submission = await prisma.$transaction(async (tx) => {
    const atpSubmission = await tx.aTPSubmission.create({
      data: {
        id: crypto.randomUUID(),
        workflowInstanceId: data.workflowInstanceId,
        submittedBy: data.submittedBy,
        submissionDate: new Date(),
        status: 'PENDING_APPROVAL',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    // Create document records
    const documents = await tx.aTPSubmissionDocument.createMany({
      data: data.files.map((file) => ({
        id: crypto.randomUUID(),
        submissionId: atpSubmission.id,
        fileName: file.fileName,
        fileUrl: file.fileUrl,
        uploadedBy: file.uploadedBy,
        uploadedAt: new Date()
      }))
    });

    return { atpSubmission, documentsCreated: documents.count };
  });

  return submission;
}
```

---

## Bulk Validation Utilities

### Batch Reference Checker

```typescript
// backend/src/utils/bulkValidator.ts

import { prisma } from '../lib/prisma';

/**
 * Validate multiple records have valid references
 * Useful for batch operations or data imports
 */
export async function validateBatchReferences<T extends Record<string, any>>(
  records: T[],
  referenceFields: Array<{
    fieldName: keyof T;
    tableName: string;
    idColumn?: string;
  }>
): Promise<{ valid: boolean; errors: Array<{ index: number; error: string }> }> {
  const errors: Array<{ index: number; error: string }> = [];

  for (let i = 0; i < records.length; i++) {
    const record = records[i];

    for (const refField of referenceFields) {
      const refId = record[refField.fieldName];

      if (!refId) {
        errors.push({
          index: i,
          error: `${String(refField.fieldName)} is missing`
        });
        continue;
      }

      // Check if reference exists
      const exists = await checkReference(
        refField.tableName,
        refId as string,
        refField.idColumn
      );

      if (!exists) {
        errors.push({
          index: i,
          error: `Invalid ${String(refField.fieldName)}: ${refId}`
        });
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

async function checkReference(
  tableName: string,
  id: string,
  idColumn: string = 'id'
): Promise<boolean> {
  try {
    // @ts-ignore
    const record = await prisma[tableName].findUnique({
      where: { [idColumn]: id }
    });
    return record !== null;
  } catch {
    return false;
  }
}

// Usage example:
async function bulkImportWorkflowStages(
  stages: Array<{
    workflowInstanceId: string;
    clusterId?: string;
    stageNumber: number;
    stageName: string;
  }>
) {
  const validation = await validateBatchReferences(stages, [
    {
      fieldName: 'workflowInstanceId',
      tableName: 'workflowInstance'
    },
    {
      fieldName: 'clusterId',
      tableName: 'clusterMaster'
    }
  ]);

  if (!validation.valid) {
    throw new Error(
      'Batch validation failed:\n' +
        validation.errors.map((e) => `Row ${e.index}: ${e.error}`).join('\n')
    );
  }

  // Proceed with bulk insert...
}
```

---

## Middleware Validation

### Request Validation Middleware

```typescript
// backend/src/middleware/validateReferences.ts

import { Request, Response, NextFunction } from 'express';
import { validateReferences } from '../utils/referenceValidator';

/**
 * Middleware to validate config_version_id in request body
 */
export async function validateConfigVersionReference(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const configVersionId = req.body.configVersionId;

  if (!configVersionId) {
    return res.status(400).json({
      error: 'configVersionId is required'
    });
  }

  const validation = await validateReferences([
    {
      tableName: 'configVersion',
      id: configVersionId,
      fieldName: 'configVersionId'
    }
  ]);

  if (!validation.valid) {
    return res.status(400).json({
      error: 'Invalid config_version_id',
      details: validation.errors
    });
  }

  next();
}

/**
 * Middleware to validate workspace_id belongs to user
 */
export async function validateWorkspaceAccess(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const workspaceId = req.body.workspaceId || req.params.workspaceId;
  const userId = req.user?.id; // From auth middleware

  if (!workspaceId || !userId) {
    return res.status(400).json({
      error: 'workspaceId and userId are required'
    });
  }

  // Verify workspace exists
  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId }
  });

  if (!workspace) {
    return res.status(404).json({
      error: 'Workspace not found'
    });
  }

  // Verify user has access to workspace
  const hasAccess = await prisma.workspaceUser.findFirst({
    where: {
      workspaceId,
      userId
    }
  });

  if (!hasAccess) {
    return res.status(403).json({
      error: 'User does not have access to this workspace'
    });
  }

  // Attach workspace to request for use in controllers
  req.workspace = workspace;
  next();
}
```

---

## Error Handling

### Standardized Error Responses

```typescript
// backend/src/errors/ReferenceError.ts

export class ReferenceError extends Error {
  public readonly field: string;
  public readonly value: string;
  public readonly table: string;

  constructor(field: string, value: string, table: string) {
    super(`Invalid reference: ${field} = ${value} (not found in ${table})`);
    this.name = 'ReferenceError';
    this.field = field;
    this.value = value;
    this.table = table;
  }

  toJSON() {
    return {
      error: this.name,
      message: this.message,
      field: this.field,
      value: this.value,
      table: this.table
    };
  }
}

// Usage in controllers
try {
  const result = await validateReferences([...]);
  if (!result.valid) {
    throw new ReferenceError('configVersionId', 'invalid-id', 'config_versions');
  }
} catch (error) {
  if (error instanceof ReferenceError) {
    return res.status(400).json(error.toJSON());
  }
  // Handle other errors...
}
```

---

## Testing

### Validation Tests

```typescript
// backend/src/tests/referenceValidation.test.ts

import { validateReferences } from '../utils/referenceValidator';
import { prisma } from '../lib/prisma';

describe('Reference Validation', () => {
  it('should detect invalid config_version_id', async () => {
    const result = await validateReferences([
      {
        tableName: 'configVersion',
        id: 'non-existent-id',
        fieldName: 'configVersionId'
      }
    ]);

    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Invalid reference: configVersionId');
  });

  it('should pass valid references', async () => {
    // Create test workspace and config
    const workspace = await prisma.workspace.create({
      data: { /* ... */ }
    });

    const config = await prisma.configVersion.create({
      data: {
        id: crypto.randomUUID(),
        workspaceId: workspace.id,
        /* ... */
      }
    });

    const result = await validateReferences([
      {
        tableName: 'configVersion',
        id: config.id,
        fieldName: 'configVersionId'
      }
    ]);

    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });
});
```

---

## Integration with Routes

### Example Route Implementation

```typescript
// backend/src/routes/workflowInstanceRoutes.ts

import express from 'express';
import { validateConfigVersionReference } from '../middleware/validateReferences';
import { createWorkflowInstance } from '../services/workflowInstanceService';

const router = express.Router();

/**
 * POST /api/v1/workflow-instances
 * Create new workflow instance
 */
router.post(
  '/workflow-instances',
  validateConfigVersionReference, // <-- Validate before controller
  async (req, res) => {
    try {
      const workflow = await createWorkflowInstance({
        workspaceId: req.body.workspaceId,
        configVersionId: req.body.configVersionId,
        approvalPolicyId: req.body.approvalPolicyId,
        siteId: req.body.siteId,
        scopeId: req.body.scopeId,
        atpCategory: req.body.atpCategory,
        createdBy: req.user.id
      });

      res.status(201).json({
        success: true,
        data: workflow
      });
    } catch (error) {
      if (error instanceof ReferenceError) {
        return res.status(400).json(error.toJSON());
      }

      console.error('Error creating workflow instance:', error);
      res.status(500).json({
        error: 'Internal server error'
      });
    }
  }
);

export default router;
```

---

## Best Practices

### ✅ DO

1. **Validate ALL references** before INSERT/UPDATE operations
2. **Use transactions** for multi-table operations
3. **Return descriptive errors** with field names and values
4. **Log validation failures** for monitoring
5. **Cache frequently accessed references** (e.g., config versions)
6. **Use middleware** for common validations
7. **Write tests** for validation logic

### ❌ DON'T

1. ❌ Skip validation for "trusted" internal services
2. ❌ Assume references exist without checking
3. ❌ Use generic error messages
4. ❌ Forget to validate in background jobs
5. ❌ Skip validation in bulk operations
6. ❌ Trust client-provided data without verification

---

## Performance Considerations

### Optimization Strategies

1. **Batch validations:**
   ```typescript
   // Instead of:
   for (const id of ids) {
     await validateReferences([{ tableName: 'X', id }]);
   }

   // Use:
   const records = await prisma.configVersion.findMany({
     where: { id: { in: ids } }
   });
   ```

2. **Cache valid references:**
   ```typescript
   const cache = new Map();
   async function getCachedReference(table: string, id: string) {
     const key = `${table}:${id}`;
     if (cache.has(key)) return cache.get(key);

     const record = await prisma[table].findUnique({ where: { id } });
     cache.set(key, record);
     return record;
   }
   ```

3. **Use SELECT-only queries:**
   ```typescript
   // Fast: Only checks existence
   await prisma.configVersion.findUnique({
     where: { id },
     select: { id: true } // <-- Only select ID
   });
   ```

---

## Monitoring & Alerts

### Metrics to Track

```typescript
// backend/src/metrics/validationMetrics.ts

export const validationMetrics = {
  totalValidations: 0,
  failedValidations: 0,
  validationErrors: [] as Array<{
    timestamp: Date;
    field: string;
    value: string;
    table: string;
  }>
};

export function logValidationError(field: string, value: string, table: string) {
  validationMetrics.failedValidations++;
  validationMetrics.validationErrors.push({
    timestamp: new Date(),
    field,
    value,
    table
  });

  // Alert if error rate exceeds threshold
  const errorRate =
    validationMetrics.failedValidations / validationMetrics.totalValidations;

  if (errorRate > 0.05) {
    // 5% error rate threshold
    console.error('⚠️ High validation error rate:', errorRate);
    // Send alert to monitoring system...
  }
}
```

---

## Conclusion

Application-level validation is **essential** if using minimal FK strategy. This document provides:

- ✅ Generic validation utilities
- ✅ Service-layer examples
- ✅ Middleware patterns
- ✅ Error handling strategies
- ✅ Testing approaches
- ✅ Performance optimizations

**However, the recommended approach is still to use database foreign key constraints** for guaranteed data integrity. See [FK_STRATEGY_ANALYSIS.md](./FK_STRATEGY_ANALYSIS.md) for details.

---

*Created: 2025-12-29*
*Related: [FK_STRATEGY_ANALYSIS.md](./FK_STRATEGY_ANALYSIS.md) | [ORPHAN_CHECK_AUDITS.md](./ORPHAN_CHECK_AUDITS.md)*
