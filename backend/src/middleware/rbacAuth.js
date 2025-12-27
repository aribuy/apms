// Enhanced RBAC Middleware
// Purpose: Database-driven RBAC enforcement
// Author: System Enhancement
// Date: 2025-12-27

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Check if user has specific permission
 * @param {string} userId - User ID
 * @param {string} permissionCode - Permission code (e.g., 'atp.document.approve')
 * @returns {Promise<boolean>}
 */
const hasPermission = async (userId, permissionCode) => {
  try {
    // Check database for permission
    const result = await prisma.$queryRaw`
      SELECT EXISTS(
        SELECT 1
        FROM v_effective_permissions
        WHERE user_id = $1
        AND permission_code = $2
      ) as has_perm
    `, [userId, permissionCode];

    return result[0]?.has_perm || false;
  } catch (error) {
    console.error('Permission check error:', error);
    return false;
  }
};

/**
 * Check if user has ANY of the specified permissions
 * @param {string} userId - User ID
 * @param {string[]} permissionCodes - Array of permission codes
 * @returns {Promise<boolean>}
 */
const hasAnyPermission = async (userId, permissionCodes) => {
  try {
    const result = await prisma.$queryRaw`
      SELECT EXISTS(
        SELECT 1
        FROM v_effective_permissions
        WHERE user_id = $1
        AND permission_code = ANY($2)
      ) as has_perm
    `, [userId, permissionCodes];

    return result[0]?.has_perm || false;
  } catch (error) {
    console.error('Permission check error:', error);
    return false;
  }
};

/**
 * Check if user has ALL specified permissions
 * @param {string} userId - User ID
 * @param {string[]} permissionCodes - Array of permission codes
 * @returns {Promise<boolean>}
 */
const hasAllPermissions = async (userId, permissionCodes) => {
  try {
    const result = await prisma.$queryRaw`
      SELECT COUNT(DISTINCT permission_code) as perm_count
      FROM v_effective_permissions
      WHERE user_id = $1
      AND permission_code = ANY($2)
    `, [userId, permissionCodes];

    return result[0]?.perm_count === permissionCodes.length;
  } catch (error) {
    console.error('Permission check error:', error);
    return false;
  }
};

/**
 * Get all user permissions
 * @param {string} userId - User ID
 * @returns {Promise<Array>} Array of permission objects
 */
const getUserPermissions = async (userId) => {
  try {
    const permissions = await prisma.$queryRaw`
      SELECT
        permission_code,
        permission_name,
        module,
        action,
        resource,
        conditions
      FROM v_effective_permissions
      WHERE user_id = $1
      ORDER BY module, resource, action
    `, [userId];

    return permissions;
  } catch (error) {
    console.error('Get permissions error:', error);
    return [];
  }
};

/**
 * Authorization middleware factory
 * @param {string|string[]} permissionCodes - Required permission(s)
 * @param {string} strategy - 'any' or 'all' (default: 'any')
 */
const authorize = (permissionCodes, strategy = 'any') => {
  return async (req, res, next) => {
    try {
      // Get user from request (set by auth middleware)
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized: No user context'
        });
      }

      // Admin bypass
      if (req.user?.role === 'Administrator' || req.user?.role === 'admin') {
        return next();
      }

      // Normalize permissionCodes to array
      const codes = Array.isArray(permissionCodes) ? permissionCodes : [permissionCodes];

      // Check permissions based on strategy
      let hasAccess = false;
      if (strategy === 'all') {
        hasAccess = await hasAllPermissions(userId, codes);
      } else {
        hasAccess = await hasAnyPermission(userId, codes);
      }

      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          error: 'Forbidden: Insufficient permissions',
          required: codes,
          strategy: strategy
        });
      }

      // Attach permissions to request for use in controllers
      req.userPermissions = await getUserPermissions(userId);
      next();
    } catch (error) {
      console.error('Authorization error:', error);
      res.status(500).json({
        success: false,
        error: 'Authorization check failed'
      });
    }
  };
};

/**
 * Resource-based authorization middleware
 * Checks if user can access specific resource (e.g., ATP document they own)
 * @param {string} resourceType - Resource type (e.g., 'atp_document')
 * @param {string} action - Action (e.g., 'update', 'delete')
 */
const authorizeResource = (resourceType, action) => {
  return async (req, res, next) => {
    try {
      const userId = req.user?.id;
      const resourceId = req.params.id || req.body.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized'
        });
      }

      // Admin bypass
      if (req.user?.role === 'Administrator' || req.user?.role === 'admin') {
        return next();
      }

      // Check resource-level permission
      const permissionCode = `${resourceType}.${action}`;
      const hasAccess = await hasPermission(userId, permissionCode);

      if (!hasAccess) {
        // Check if user owns the resource
        const ownsResource = await checkResourceOwnership(userId, resourceType, resourceId);

        if (!ownsResource) {
          return res.status(403).json({
            success: false,
            error: 'Forbidden: You do not have permission to access this resource'
          });
        }
      }

      next();
    } catch (error) {
      console.error('Resource authorization error:', error);
      res.status(500).json({
        success: false,
        error: 'Authorization check failed'
      });
    }
  };
};

/**
 * Check if user owns the resource
 */
const checkResourceOwnership = async (userId, resourceType, resourceId) => {
  try {
    switch (resourceType) {
      case 'atp_document':
        const doc = await prisma.$queryRaw`
          SELECT submitted_by FROM atp_documents WHERE id = $1
        `, [resourceId]);
        return doc[0]?.submitted_by === userId;

      case 'site':
        const site = await prisma.$queryRaw`
          SELECT created_by FROM sites WHERE id = $1
        `, [resourceId];
        return site[0]?.created_by === userId;

      case 'task':
        const task = await prisma.$queryRaw`
          SELECT assigned_by FROM tasks WHERE id = $1
        `, [resourceId];
        return task[0]?.assigned_by === userId;

      default:
        return false;
    }
  } catch (error) {
    console.error('Ownership check error:', error);
    return false;
  }
};

/**
 * Log audit entry
 * @param {Object} auditData - Audit data
 */
const logAudit = async (auditData) => {
  try {
    const {
      userId,
      userEmail,
      userRole,
      action,
      resourceType,
      resourceId,
      oldData,
      newData,
      ipAddress,
      userAgent,
      status = 'SUCCESS'
    } = auditData;

    await prisma.$queryRaw`
      SELECT log_audit(
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10
      )
    `, [
      userId, userEmail, userRole, action, resourceType, resourceId,
      oldData ? JSON.stringify(oldData) : null,
      newData ? JSON.stringify(newData) : null,
      ipAddress,
      userAgent,
      status
    ]);

    console.log(`[AUDIT] ${action} on ${resourceType}:${resourceId} by ${userEmail}`);
  } catch (error) {
    console.error('Audit log error:', error);
  }
};

/**
 * Audit logging middleware
 */
const auditLog = (action, resourceType) => {
  return async (req, res, next) => {
    // Store original send to intercept response
    const originalSend = res.send;
    let responseData;

    res.send = function(data) {
      responseData = data;
      originalSend.call(this, data);
    };

    // Continue to next middleware
    next();

    // Log after response is sent
    res.on('finish', async () => {
      try {
        const resourceId = req.params.id || req.body.id || responseData?.id;

        await logAudit({
          userId: req.user?.id,
          userEmail: req.user?.email,
          userRole: req.user?.role,
          action: action,
          resourceType: resourceType,
          resourceId: resourceId,
          oldData: req.oldData, // Set by controller if needed
          newData: req.body || responseData,
          ipAddress: req.ip,
          userAgent: req.get('user-agent'),
          status: res.statusCode < 400 ? 'SUCCESS' : 'FAILURE'
        });
      } catch (error) {
        console.error('Audit logging error:', error);
      }
    });
  };
};

module.exports = {
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  getUserPermissions,
  authorize,
  authorizeResource,
  checkResourceOwnership,
  logAudit,
  auditLog
};
