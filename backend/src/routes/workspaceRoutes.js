// Workspace Management Routes
// Provides workspace CRUD, membership management, and default workspace switch

const express = require('express');
const router = express.Router();
const { prisma } = require('../utils/prisma');
const { authenticateToken } = require('../middleware/auth');
const { workspaceCreationLimiter, workspaceMemberLimiter } = require('../middleware/rateLimiter');
const { logAuditEvent } = require('../middleware/auditLogger');
const { validateBody } = require('../middleware/validator');
const {
  workspaceCreateSchema,
  workspaceUpdateSchema,
  userWorkspaceCreateSchema,
  userWorkspaceUpdateSchema,
  workspaceMemberCreateSchema,
  workspaceMemberUpdateSchema
} = require('../validations/workspace');

router.use(authenticateToken);

const requireAuth = (req, res) => {
  if (!req.user?.id) {
    res.status(401).json({ success: false, error: 'Unauthorized' });
    return false;
  }
  return true;
};

const requireAdminRole = (req, res) => {
  const role = req.user?.role?.toUpperCase();
  if (!role || (role !== 'SUPERADMIN' && role !== 'ADMIN')) {
    res.status(403).json({ success: false, error: 'Forbidden' });
    return false;
  }
  return true;
};

/**
 * PUT /api/v1/workspaces/:workspaceId/default
 * Set a workspace as user's default workspace
 */
router.put('/workspaces/:workspaceId/default', async (req, res) => {
  try {
    if (!requireAuth(req, res)) return;

    const userId = req.user.id;
    const { workspaceId } = req.params;

    const membership = await prisma.$queryRaw`
      SELECT id FROM workspace_members
      WHERE user_id = ${userId}
      AND workspace_id = ${workspaceId}::UUID
    `;

    if (!membership || membership.length === 0) {
      return res.status(403).json({
        success: false,
        error: 'User is not a member of this workspace'
      });
    }

    await prisma.$queryRaw`
      UPDATE workspace_members
      SET is_default = false, updated_at = NOW()
      WHERE user_id = ${userId}
    `;

    await prisma.$queryRaw`
      UPDATE workspace_members
      SET is_default = true, updated_at = NOW()
      WHERE user_id = ${userId}
      AND workspace_id = ${workspaceId}::UUID
    `;

    res.json({
      success: true,
      message: 'Default workspace updated successfully'
    });
  } catch (error) {
    console.error('Error setting default workspace:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * GET /api/v1/workspaces
 * List workspaces
 */
router.get('/workspaces', async (req, res) => {
  try {
    if (!requireAuth(req, res)) return;

    const includeInactive = req.query.includeInactive === 'true';
    const workspaces = await prisma.$queryRaw`
      SELECT id, code, name, is_active, created_at, updated_at
      FROM workspaces
      WHERE ${includeInactive}::boolean = true OR is_active = true
      ORDER BY name ASC
    `;

    res.json({ success: true, data: workspaces });
  } catch (error) {
    console.error('Error listing workspaces:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * POST /api/v1/workspaces
 * Create a new workspace
 */
router.post('/workspaces', workspaceCreationLimiter, validateBody(workspaceCreateSchema), async (req, res) => {
  try {
    if (!requireAuth(req, res)) return;
    if (!requireAdminRole(req, res)) return;

    const { code, name, customerGroupId, vendorOwnerId } = req.body;
    if (!code || !name || !customerGroupId || !vendorOwnerId) {
      return res.status(400).json({
        success: false,
        error: 'code, name, customerGroupId, and vendorOwnerId are required'
      });
    }

    const workspace = await prisma.$queryRaw`
      INSERT INTO workspaces (code, name, customer_group_id, vendor_owner_id, is_active, created_at, updated_at)
      VALUES (${code}, ${name}, ${customerGroupId}, ${vendorOwnerId}, true, NOW(), NOW())
      RETURNING id, code, name, is_active, created_at, updated_at
    `;

    const created = workspace[0];
    await logAuditEvent({
      userId: req.user?.id,
      action: 'CREATE',
      resource: 'workspace',
      resourceId: created?.id,
      newData: created,
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    res.status(201).json({ success: true, data: created });
  } catch (error) {
    console.error('Error creating workspace:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * PUT /api/v1/workspaces/:workspaceId
 * Update a workspace
 */
router.put('/workspaces/:workspaceId', validateBody(workspaceUpdateSchema), async (req, res) => {
  try {
    if (!requireAuth(req, res)) return;
    if (!requireAdminRole(req, res)) return;

    const { workspaceId } = req.params;
    const code = req.body.code ?? null;
    const name = req.body.name ?? null;
    const customerGroupId = req.body.customerGroupId ?? null;
    const vendorOwnerId = req.body.vendorOwnerId ?? null;
    const isActive = req.body.isActive ?? null;

    const existing = await prisma.$queryRaw`
      SELECT id, code, name, is_active, created_at, updated_at
      FROM workspaces
      WHERE id = ${workspaceId}::UUID
    `;

    const workspace = await prisma.$queryRaw`
      UPDATE workspaces
      SET
        code = COALESCE(${code}, code),
        name = COALESCE(${name}, name),
        customer_group_id = COALESCE(${customerGroupId}, customer_group_id),
        vendor_owner_id = COALESCE(${vendorOwnerId}, vendor_owner_id),
        is_active = COALESCE(${isActive}, is_active),
        updated_at = NOW()
      WHERE id = ${workspaceId}::UUID
      RETURNING id, code, name, is_active, created_at, updated_at
    `;

    if (!workspace || workspace.length === 0) {
      return res.status(404).json({ success: false, error: 'Workspace not found' });
    }

    const updated = workspace[0];
    await logAuditEvent({
      userId: req.user?.id,
      action: 'UPDATE',
      resource: 'workspace',
      resourceId: updated?.id,
      oldData: existing?.[0] || null,
      newData: updated,
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    console.error('Error updating workspace:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * DELETE /api/v1/workspaces/:workspaceId
 * Soft disable a workspace
 */
router.delete('/workspaces/:workspaceId', async (req, res) => {
  try {
    if (!requireAuth(req, res)) return;
    if (!requireAdminRole(req, res)) return;

    const { workspaceId } = req.params;
    const workspace = await prisma.$queryRaw`
      UPDATE workspaces
      SET is_active = false, updated_at = NOW()
      WHERE id = ${workspaceId}::UUID
      RETURNING id, code, name, is_active, created_at, updated_at
    `;

    if (!workspace || workspace.length === 0) {
      return res.status(404).json({ success: false, error: 'Workspace not found' });
    }

    const disabled = workspace[0];
    await logAuditEvent({
      userId: req.user?.id,
      action: 'DISABLE',
      resource: 'workspace',
      resourceId: disabled?.id,
      oldData: existing?.[0] || null,
      newData: disabled,
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    res.json({ success: true, data: disabled });
  } catch (error) {
    console.error('Error disabling workspace:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * GET /api/v1/workspaces/:workspaceId/members
 * List workspace members
 */
router.get('/workspaces/:workspaceId/members', async (req, res) => {
  try {
    if (!requireAuth(req, res)) return;

    const { workspaceId } = req.params;
    const members = await prisma.$queryRaw`
      SELECT
        wm.user_id AS "userId",
        wm.role,
        wm.is_default AS "isDefault",
        u.email,
        u.username,
        u.name
      FROM workspace_members wm
      JOIN users u ON u.id = wm.user_id
      WHERE wm.workspace_id = ${workspaceId}::UUID
      ORDER BY u.email ASC
    `;

    res.json({ success: true, data: members });
  } catch (error) {
    console.error('Error listing workspace members:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * GET /api/v1/users/:userId/workspaces
 * List workspaces for a user
 */
router.get('/users/:userId/workspaces', async (req, res) => {
  try {
    if (!requireAuth(req, res)) return;

    const { userId } = req.params;
    const memberships = await prisma.$queryRaw`
      SELECT
        wm.workspace_id AS "workspaceId",
        wm.role,
        wm.is_default AS "isDefault",
        w.code,
        w.name
      FROM workspace_members wm
      JOIN workspaces w ON w.id = wm.workspace_id
      WHERE wm.user_id = ${userId}
      ORDER BY w.name ASC
    `;

    res.json({ success: true, data: memberships });
  } catch (error) {
    console.error('Error listing user workspaces:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * POST /api/v1/users/:userId/workspaces
 * Add a workspace membership for a user
 */
router.post('/users/:userId/workspaces', validateBody(userWorkspaceCreateSchema), async (req, res) => {
  try {
    if (!requireAuth(req, res)) return;
    if (!requireAdminRole(req, res)) return;

    const { userId } = req.params;
    const { workspaceId, role, isDefault } = req.body;

    if (!workspaceId || !role) {
      return res.status(400).json({ success: false, error: 'workspaceId and role are required' });
    }

    if (isDefault) {
      await prisma.$queryRaw`
        UPDATE workspace_members
        SET is_default = false, updated_at = NOW()
        WHERE user_id = ${userId}
      `;
    }

    await prisma.$queryRaw`
      INSERT INTO workspace_members (id, workspace_id, user_id, role, is_default, created_at, updated_at)
      VALUES ('wm_' || ${userId}, ${workspaceId}::UUID, ${userId}, ${role}, ${!!isDefault}, NOW(), NOW())
      ON CONFLICT (workspace_id, user_id) DO UPDATE
      SET role = EXCLUDED.role,
          is_default = EXCLUDED.is_default,
          updated_at = NOW()
    `;

    await logAuditEvent({
      userId: req.user?.id,
      action: 'ADD_MEMBER',
      resource: 'workspace_member',
      resourceId: `${workspaceId}:${userId}`,
      newData: { workspaceId, userId, role, isDefault: !!isDefault },
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    res.status(201).json({ success: true, message: 'Workspace access added' });
  } catch (error) {
    console.error('Error adding user workspace:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * PUT /api/v1/users/:userId/workspaces/:workspaceId
 * Update user membership role/default
 */
router.put('/users/:userId/workspaces/:workspaceId', validateBody(userWorkspaceUpdateSchema), async (req, res) => {
  try {
    if (!requireAuth(req, res)) return;
    if (!requireAdminRole(req, res)) return;

    const { userId, workspaceId } = req.params;
    const role = req.body.role ?? null;
    const isDefault = req.body.isDefault ?? null;

    if (isDefault === true) {
      await prisma.$queryRaw`
        UPDATE workspace_members
        SET is_default = false, updated_at = NOW()
        WHERE user_id = ${userId}
      `;
    }

    const updated = await prisma.$queryRaw`
      UPDATE workspace_members
      SET
        role = COALESCE(${role}, role),
        is_default = COALESCE(${isDefault}, is_default),
        updated_at = NOW()
      WHERE workspace_id = ${workspaceId}::UUID
      AND user_id = ${userId}
      RETURNING user_id, role, is_default
    `;

    if (!updated || updated.length === 0) {
      return res.status(404).json({ success: false, error: 'Membership not found' });
    }

    await logAuditEvent({
      userId: req.user?.id,
      action: 'UPDATE_MEMBER',
      resource: 'workspace_member',
      resourceId: `${workspaceId}:${userId}`,
      newData: updated[0],
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    res.json({ success: true, data: updated[0] });
  } catch (error) {
    console.error('Error updating user workspace:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * DELETE /api/v1/users/:userId/workspaces/:workspaceId
 * Remove a workspace membership for a user
 */
router.delete('/users/:userId/workspaces/:workspaceId', async (req, res) => {
  try {
    if (!requireAuth(req, res)) return;
    if (!requireAdminRole(req, res)) return;

    const { userId, workspaceId } = req.params;
    const removed = await prisma.$queryRaw`
      DELETE FROM workspace_members
      WHERE workspace_id = ${workspaceId}::UUID
      AND user_id = ${userId}
      RETURNING user_id
    `;

    if (!removed || removed.length === 0) {
      return res.status(404).json({ success: false, error: 'Membership not found' });
    }

    await logAuditEvent({
      userId: req.user?.id,
      action: 'REMOVE_MEMBER',
      resource: 'workspace_member',
      resourceId: `${workspaceId}:${userId}`,
      newData: { workspaceId, userId },
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    res.json({ success: true, message: 'Workspace access removed' });
  } catch (error) {
    console.error('Error removing user workspace:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * POST /api/v1/workspaces/:workspaceId/members
 * Add a workspace member
 */
router.post('/workspaces/:workspaceId/members', workspaceMemberLimiter, validateBody(workspaceMemberCreateSchema), async (req, res) => {
  try {
    if (!requireAuth(req, res)) return;
    if (!requireAdminRole(req, res)) return;

    const { workspaceId } = req.params;
    const { userId, email, role, isDefault } = req.body;

    if (!userId && !email) {
      return res.status(400).json({ success: false, error: 'userId or email is required' });
    }
    if (!role) {
      return res.status(400).json({ success: false, error: 'role is required' });
    }

    const userRows = userId
      ? await prisma.$queryRaw`SELECT id, email FROM users WHERE id = ${userId}`
      : await prisma.$queryRaw`SELECT id, email FROM users WHERE email = ${email}`;

    if (!userRows || userRows.length === 0) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const targetUserId = userRows[0].id;

    if (isDefault) {
      await prisma.$queryRaw`
        UPDATE workspace_members
        SET is_default = false, updated_at = NOW()
        WHERE user_id = ${targetUserId}
      `;
    }

    await prisma.$queryRaw`
      INSERT INTO workspace_members (id, workspace_id, user_id, role, is_default, created_at, updated_at)
      VALUES ('wm_' || ${targetUserId}, ${workspaceId}::UUID, ${targetUserId}, ${role}, ${!!isDefault}, NOW(), NOW())
      ON CONFLICT (workspace_id, user_id) DO UPDATE
      SET role = EXCLUDED.role,
          is_default = EXCLUDED.is_default,
          updated_at = NOW()
    `;

    await logAuditEvent({
      userId: req.user?.id,
      action: 'ADD_MEMBER',
      resource: 'workspace_member',
      resourceId: `${workspaceId}:${targetUserId}`,
      newData: { workspaceId, userId: targetUserId, role, isDefault: !!isDefault },
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    res.status(201).json({ success: true, message: 'Member added' });
  } catch (error) {
    console.error('Error adding workspace member:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * PUT /api/v1/workspaces/:workspaceId/members/:userId
 * Update a member role / default flag
 */
router.put('/workspaces/:workspaceId/members/:userId', validateBody(workspaceMemberUpdateSchema), async (req, res) => {
  try {
    if (!requireAuth(req, res)) return;
    if (!requireAdminRole(req, res)) return;

    const { workspaceId, userId } = req.params;
    const role = req.body.role ?? null;
    const isDefault = req.body.isDefault ?? null;

    if (isDefault === true) {
      await prisma.$queryRaw`
        UPDATE workspace_members
        SET is_default = false, updated_at = NOW()
        WHERE user_id = ${userId}
      `;
    }

    const updated = await prisma.$queryRaw`
      UPDATE workspace_members
      SET
        role = COALESCE(${role}, role),
        is_default = COALESCE(${isDefault}, is_default),
        updated_at = NOW()
      WHERE workspace_id = ${workspaceId}::UUID
      AND user_id = ${userId}
      RETURNING user_id, role, is_default
    `;

    if (!updated || updated.length === 0) {
      return res.status(404).json({ success: false, error: 'Membership not found' });
    }

    await logAuditEvent({
      userId: req.user?.id,
      action: 'UPDATE_MEMBER',
      resource: 'workspace_member',
      resourceId: `${workspaceId}:${userId}`,
      newData: updated[0],
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    res.json({ success: true, data: updated[0] });
  } catch (error) {
    console.error('Error updating workspace member:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * DELETE /api/v1/workspaces/:workspaceId/members/:userId
 * Remove a member from workspace
 */
router.delete('/workspaces/:workspaceId/members/:userId', async (req, res) => {
  try {
    if (!requireAuth(req, res)) return;
    if (!requireAdminRole(req, res)) return;

    const { workspaceId, userId } = req.params;
    const removed = await prisma.$queryRaw`
      DELETE FROM workspace_members
      WHERE workspace_id = ${workspaceId}::UUID
      AND user_id = ${userId}
      RETURNING user_id
    `;

    if (!removed || removed.length === 0) {
      return res.status(404).json({ success: false, error: 'Membership not found' });
    }

    await logAuditEvent({
      userId: req.user?.id,
      action: 'REMOVE_MEMBER',
      resource: 'workspace_member',
      resourceId: `${workspaceId}:${userId}`,
      newData: { workspaceId, userId },
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    res.json({ success: true, message: 'Member removed' });
  } catch (error) {
    console.error('Error removing workspace member:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

module.exports = router;
