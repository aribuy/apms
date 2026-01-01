// Workspace Context API Routes
// Provides user's workspace memberships and active config versions

const express = require('express');
const router = express.Router();
const { prisma } = require('../utils/prisma');
const { authenticateToken } = require('../middleware/auth');
const logger = require('../utils/logger');

// Apply JWT authentication middleware to all routes
router.use(authenticateToken);

/**
 * GET /api/v1/user/context
 * Get user's workspace context including current workspace, memberships, and active configs
 *
 * For testing with hardcoded auth, pass userId as query param: ?userId=cmezu3img0000jiaj1w1jfcj1
 * In production, this will use JWT middleware to extract userId from token
 */
router.get('/context', async (req, res) => {
  try {
    // Get user ID - from JWT middleware (req.user) or query param (for testing)
    const userId = req.user?.id || req.query.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized - No user ID found'
      });
    }

    // Get user's workspace memberships with workspace details
    const memberships = await prisma.$queryRaw`
      SELECT
        wm.id,
        wm.workspace_id,
        wm.role,
        wm.is_default,
        w.code,
        w.name,
        w.is_active
      FROM workspace_members wm
      INNER JOIN workspaces w ON wm.workspace_id = w.id
      WHERE wm.user_id = ${userId}
      AND w.is_active = true
      ORDER BY wm.is_default DESC, w.name ASC
    `;

    if (!memberships || memberships.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No active workspace memberships found for user'
      });
    }

    // Get default or first membership as current workspace
    const defaultMembership = memberships.find(m => m.is_default) || memberships[0];
    const currentWorkspace = {
      id: defaultMembership.workspace_id,
      code: defaultMembership.code,
      name: defaultMembership.name,
      isActive: defaultMembership.is_active
    };

    // Get active configs for current workspace (optional - may not exist yet)
    let activeConfigs = [];
    try {
      activeConfigs = await prisma.$queryRaw`
        SELECT
          id,
          workspace_id,
          version_number as "versionNumber",
          status,
          source_type as "sourceType",
          created_at as "createdAt"
        FROM config_versions
        WHERE workspace_id = ${defaultMembership.workspace_id}::UUID
        AND status = 'ACTIVE'
        ORDER BY version_number DESC
      `;
    } catch {
      // config_versions table doesn't exist yet - that's okay
      logger.warn('config_versions table not found, using empty array');
      activeConfigs = [];
    }

    // Format user workspaces for response
    const userWorkspaces = memberships.map(m => ({
      id: m.id,
      workspaceId: m.workspace_id,
      role: m.role,
      isDefault: m.is_default,
      workspace: {
        id: m.workspace_id,
        code: m.code,
        name: m.name,
        isActive: m.is_active
      }
    }));

    res.json({
      success: true,
      data: {
        currentWorkspace,
        userWorkspaces,
        activeConfigs,
        userRole: defaultMembership.role
      }
    });

  } catch (error) {
    logger.error({ err: error }, 'Error fetching workspace context');
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * PUT /api/v1/workspaces/:workspaceId/default
 * Set a workspace as user's default workspace
 */
router.put('/workspaces/:workspaceId/default', async (req, res) => {
  try {
    const userId = req.user?.id || req.query.userId;
    const { workspaceId } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized'
      });
    }

    // Verify user is member of this workspace
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

    // Remove default flag from all user's workspaces
    await prisma.$queryRaw`
      UPDATE workspace_members
      SET is_default = false
      WHERE user_id = ${userId}
    `;

    // Set new default workspace
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
    logger.error({ err: error }, 'Error setting default workspace');
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

module.exports = router;
