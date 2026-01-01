const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');
const { authenticateToken } = require('../middleware/auth');
const { logAuditEvent } = require('../middleware/auditLogger');
const { validateBody } = require('../middleware/validator');
const { taskCreateSchema, taskUpdateSchema } = require('../validations/task');

router.use(authenticateToken);

// Use the same Prisma instance from server.js
let prisma;
try {
  const { PrismaClient } = require('@prisma/client');
  prisma = new PrismaClient();
  logger.debug('Prisma client initialized in taskRoutes');
} catch (error) {
  logger.error({ err: error }, 'Error initializing Prisma');
}

// Get all tasks with optional filtering
router.get('/', async (req, res) => {
  try {
    const {
      site_id,
      assigned_to,
      assigned_role,
      status,
      task_type,
      workflow_type,
      workspace_id,
      workspaceId
    } = req.query;

    const whereClause = {};
    if (site_id) whereClause.siteId = site_id;
    if (assigned_to) whereClause.assignedTo = assigned_to;
    if (assigned_role) whereClause.assignedRole = assigned_role;
    if (status) whereClause.status = status;
    if (task_type) whereClause.taskType = task_type;
    if (workflow_type) whereClause.workflowType = workflow_type;
    if (workspaceId || workspace_id) whereClause.workspaceId = workspaceId || workspace_id;

    const tasks = await prisma.task.findMany({
      where: whereClause,
      include: {
        sites: {
          select: {
            siteId: true,
            siteName: true,
            region: true,
            city: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    logger.debug({ count: tasks.length }, 'Tasks fetched');
    res.json({
      success: true,
      data: tasks,
      count: tasks.length
    });
  } catch (error) {
    logger.error({ err: error }, 'Error fetching tasks');
    res.status(500).json({
      success: false,
      error: 'Failed to fetch tasks',
      details: error.message
    });
  }
});

// Get tasks for specific site
router.get('/site/:siteId', async (req, res) => {
  try {
    const { siteId } = req.params;
    const { workspace_id, workspaceId } = req.query;
    const whereClause = { siteId };
    if (workspaceId || workspace_id) whereClause.workspaceId = workspaceId || workspace_id;

    const tasks = await prisma.task.findMany({
      where: whereClause,
      include: {
        sites: {
          select: {
            siteId: true,
            siteName: true,
            region: true,
            city: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      data: tasks,
      count: tasks.length,
      site_id: siteId
    });
  } catch (error) {
    logger.error({ err: error }, 'Error fetching site tasks');
    res.status(500).json({
      success: false,
      error: 'Failed to fetch site tasks',
      details: error.message
    });
  }
});

// Create new task
router.post('/', validateBody(taskCreateSchema), async (req, res) => {
  try {
    const {
      site_id,
      task_type,
      title,
      description,
      assigned_to,
      workflow_type,
      stage_number,
      priority,
      sla_deadline,
      parent_task_id,
      depends_on,
      task_data
    } = req.body;

    // Validate required fields
    if (!site_id || !task_type || !title) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: site_id, task_type, title'
      });
    }

    // Verify site exists
    const site = await prisma.site.findUnique({
      where: { id: site_id }
    });

    if (!site) {
      return res.status(404).json({
        success: false,
        error: 'Site not found'
      });
    }

    const newTask = await prisma.task.create({
      data: {
        siteId: site_id,
        taskType: task_type,
        title,
        description,
        assignedTo: assigned_to,
        workflowType: workflow_type,
        stageNumber: stage_number || 1,
        priority: priority || 'normal',
        slaDeadline: sla_deadline ? new Date(sla_deadline) : null,
        parentTaskId: parent_task_id,
        dependsOn: depends_on,
        taskData: task_data || {},
        workspaceId: req.body.workspaceId || req.body.workspace_id || site.workspaceId || null
      },
      include: {
        sites: {
          select: {
            siteId: true,
            siteName: true,
            region: true,
            city: true
          }
        }
      }
    });

    await logAuditEvent({
      userId: req.user?.id,
      action: 'CREATE',
      resource: 'task',
      resourceId: newTask?.id,
      newData: newTask,
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    logger.info({ taskCode: newTask.taskCode }, 'Task created');
    res.status(201).json({
      success: true,
      data: newTask,
      message: `Task ${newTask.taskCode} created successfully`
    });
  } catch (error) {
    logger.error({ err: error }, 'Error creating task');
    res.status(500).json({
      success: false,
      error: 'Failed to create task',
      details: error.message
    });
  }
});

// Update task
router.put('/:id', validateBody(taskUpdateSchema), async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    // Convert date strings to Date objects
    if (updateData.sla_deadline) {
      updateData.slaDeadline = new Date(updateData.sla_deadline);
    }
    if (updateData.started_at) {
      updateData.startedAt = new Date(updateData.started_at);
    }
    if (updateData.completed_at) {
      updateData.completedAt = new Date(updateData.completed_at);
    }

    const existingTask = await prisma.task.findUnique({
      where: { id }
    });

    const updatedTask = await prisma.task.update({
      where: { id },
      data: updateData,
      include: {
        sites: {
          select: {
            siteId: true,
            siteName: true,
            region: true,
            city: true
          }
        }
      }
    });

    await logAuditEvent({
      userId: req.user?.id,
      action: 'UPDATE',
      resource: 'task',
      resourceId: updatedTask?.id,
      oldData: existingTask,
      newData: updatedTask,
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    res.json({
      success: true,
      data: updatedTask,
      message: `Task ${updatedTask.taskCode} updated successfully`
    });
  } catch (error) {
    logger.error({ err: error }, 'Error updating task');
    res.status(500).json({
      success: false,
      error: 'Failed to update task',
      details: error.message
    });
  }
});

// Delete task
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const existingTask = await prisma.task.findUnique({
      where: { id }
    });

    const deletedTask = await prisma.task.delete({
      where: { id }
    });

    await logAuditEvent({
      userId: req.user?.id,
      action: 'DELETE',
      resource: 'task',
      resourceId: deletedTask?.id,
      oldData: existingTask,
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    res.json({
      success: true,
      message: `Task ${deletedTask.taskCode} deleted successfully`
    });
  } catch (error) {
    logger.error({ err: error }, 'Error deleting task');
    res.status(500).json({
      success: false,
      error: 'Failed to delete task',
      details: error.message
    });
  }
});

// Get task statistics
router.get('/stats', async (req, res) => {
  try {
    const { assigned_to, site_id, workspace_id, workspaceId } = req.query;

    const whereClause = {};
    if (assigned_to) whereClause.assignedTo = assigned_to;
    if (site_id) whereClause.siteId = site_id;
    if (workspaceId || workspace_id) whereClause.workspaceId = workspaceId || workspace_id;

    const [
      totalTasks,
      pendingTasks,
      inProgressTasks,
      completedTasks,
      overdueTasks
    ] = await Promise.all([
      prisma.task.count({ where: whereClause }),
      prisma.task.count({ where: { ...whereClause, status: 'pending' } }),
      prisma.task.count({ where: { ...whereClause, status: 'in_progress' } }),
      prisma.task.count({ where: { ...whereClause, status: 'completed' } }),
      prisma.task.count({
        where: {
          ...whereClause,
          slaDeadline: { lt: new Date() },
          status: { not: 'completed' }
        }
      })
    ]);

    res.json({
      success: true,
      data: {
        total: totalTasks,
        pending: pendingTasks,
        in_progress: inProgressTasks,
        completed: completedTasks,
        overdue: overdueTasks
      }
    });
  } catch (error) {
    logger.error({ err: error }, 'Error fetching task stats');
    res.status(500).json({
      success: false,
      error: 'Failed to fetch task statistics',
      details: error.message
    });
  }
});

module.exports = router;
