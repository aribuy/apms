const express = require('express');
const router = express.Router();

// Use the same Prisma instance from server.js
let prisma;
try {
  const { PrismaClient } = require('@prisma/client');
  prisma = new PrismaClient();
  console.log('Prisma client initialized in taskRoutes');
} catch (error) {
  console.error('Error initializing Prisma:', error);
}

// Get all tasks with optional filtering
router.get('/', async (req, res) => {
  try {
    const { site_id, assigned_to, status, task_type, workflow_type } = req.query;

    const whereClause = {};
    if (site_id) whereClause.siteId = site_id;
    if (assigned_to) whereClause.assignedTo = assigned_to;
    if (status) whereClause.status = status;
    if (task_type) whereClause.taskType = task_type;
    if (workflow_type) whereClause.workflowType = workflow_type;

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

    console.log(`Found ${tasks.length} tasks`);
    res.json({
      success: true,
      data: tasks,
      count: tasks.length
    });
  } catch (error) {
    console.error('Error fetching tasks:', error);
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

    const tasks = await prisma.task.findMany({
      where: { siteId: siteId },
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
    console.error('Error fetching site tasks:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch site tasks',
      details: error.message
    });
  }
});

// Create new task
router.post('/', async (req, res) => {
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
        dependsOn,
        taskData: task_data || {}
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

    console.log('Task created:', newTask.taskCode);
    res.status(201).json({
      success: true,
      data: newTask,
      message: `Task ${newTask.taskCode} created successfully`
    });
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create task',
      details: error.message
    });
  }
});

// Update task
router.put('/:id', async (req, res) => {
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

    res.json({
      success: true,
      data: updatedTask,
      message: `Task ${updatedTask.taskCode} updated successfully`
    });
  } catch (error) {
    console.error('Error updating task:', error);
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

    const deletedTask = await prisma.task.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: `Task ${deletedTask.taskCode} deleted successfully`
    });
  } catch (error) {
    console.error('Error deleting task:', error);
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
    const { assigned_to, site_id } = req.query;

    const whereClause = {};
    if (assigned_to) whereClause.assignedTo = assigned_to;
    if (site_id) whereClause.siteId = site_id;

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
    console.error('Error fetching task stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch task statistics',
      details: error.message
    });
  }
});

module.exports = router;
