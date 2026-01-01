const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');

// Use the same Prisma instance from server.js
let prisma;
try {
  const { PrismaClient } = require('@prisma/client');
  prisma = new PrismaClient();
  logger.debug('Prisma client initialized in taskHistoryRoutes');
} catch (error) {
  logger.error({ err: error }, 'Error initializing Prisma');
}
const { validateBody } = require('../middleware/validator');
const { taskHistoryLogSchema } = require('../validations/taskHistory');

// Get complete site journey summary
router.get('/site-journey', async (req, res) => {
  try {
    const { site_id, region } = req.query;
    
    let query = `
      SELECT 
        s.id as site_id,
        s.site_id as site_code,
        s.site_name,
        s.region,
        s.city,
        s.created_at as site_registered_date,
        
        -- Task counts
        COUNT(DISTINCT t.id) as total_tasks,
        COUNT(DISTINCT CASE WHEN t.status = 'pending' THEN t.id END) as pending_tasks,
        COUNT(DISTINCT CASE WHEN t.status = 'in_progress' THEN t.id END) as in_progress_tasks,
        COUNT(DISTINCT CASE WHEN t.status = 'completed' THEN t.id END) as completed_tasks,
        
        -- ATP Journey milestones
        MIN(CASE WHEN th.event_type = 'CREATED' AND t.task_type = 'ATP_UPLOAD' THEN th.event_timestamp END) as atp_upload_task_created,
        MIN(CASE WHEN th.event_type = 'STATUS_CHANGED' AND t.task_type = 'ATP_UPLOAD' AND th.new_status = 'completed' THEN th.event_timestamp END) as atp_uploaded_date,
        MIN(CASE WHEN th.workflow_stage = 'REVIEW_L1' AND th.event_type = 'CREATED' THEN th.event_timestamp END) as review_l1_started,
        MIN(CASE WHEN th.workflow_stage = 'REVIEW_L1' AND th.event_type = 'STATUS_CHANGED' AND th.new_status = 'completed' THEN th.event_timestamp END) as review_l1_completed,
        MIN(CASE WHEN th.workflow_stage = 'REVIEW_L2' AND th.event_type = 'CREATED' THEN th.event_timestamp END) as review_l2_started,
        MIN(CASE WHEN th.workflow_stage = 'REVIEW_L2' AND th.event_type = 'STATUS_CHANGED' AND th.new_status = 'completed' THEN th.event_timestamp END) as review_l2_completed,
        MIN(CASE WHEN th.workflow_stage = 'REVIEW_L3' AND th.event_type = 'CREATED' THEN th.event_timestamp END) as review_l3_started,
        MIN(CASE WHEN th.workflow_stage = 'REVIEW_L3' AND th.event_type = 'STATUS_CHANGED' AND th.new_status = 'completed' THEN th.event_timestamp END) as review_l3_completed,
        MAX(CASE WHEN th.decision = 'PASS' AND th.workflow_stage = 'REVIEW_L3' THEN th.event_timestamp END) as fully_approved_date,
        
        -- Current status
        (SELECT t2.status FROM tasks t2 WHERE t2.site_id = s.id AND t2.task_type = 'ATP_UPLOAD' ORDER BY t2.created_at DESC LIMIT 1) as current_atp_status,
        (SELECT th2.workflow_stage FROM task_history th2 WHERE th2.site_id = s.id ORDER BY th2.event_timestamp DESC LIMIT 1) as current_workflow_stage,
        
        -- Timing calculations
        CASE 
          WHEN MAX(CASE WHEN th.decision = 'PASS' AND th.workflow_stage = 'REVIEW_L3' THEN th.event_timestamp END) IS NOT NULL 
          THEN EXTRACT(EPOCH FROM (MAX(CASE WHEN th.decision = 'PASS' AND th.workflow_stage = 'REVIEW_L3' THEN th.event_timestamp END) - s.created_at))/86400
          ELSE NULL 
        END as total_days_to_completion,
        
        -- Last activity
        MAX(th.event_timestamp) as last_activity_date,
        (SELECT th3.event_description FROM task_history th3 WHERE th3.site_id = s.id ORDER BY th3.event_timestamp DESC LIMIT 1) as last_activity_description

      FROM sites s
      LEFT JOIN tasks t ON s.id = t.site_id
      LEFT JOIN task_history th ON s.id = th.site_id
    `;

    const conditions = [];
    const params = [];
    let paramIndex = 1;

    if (site_id) {
      conditions.push(`s.id = $${paramIndex}`);
      params.push(site_id);
      paramIndex++;
    }

    if (region) {
      conditions.push(`s.region = $${paramIndex}`);
      params.push(region);
      paramIndex++;
    }

    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }

    query += `
      GROUP BY s.id, s.site_id, s.site_name, s.region, s.city, s.created_at
      ORDER BY s.created_at DESC
    `;

    const result = await prisma.$queryRawUnsafe(query, ...params);

    res.json({
      success: true,
      data: result,
      count: result.length
    });
  } catch (error) {
    logger.error({ err: error }, 'Error fetching site journey');
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch site journey', 
      details: error.message 
    });
  }
});

// Get detailed task history for specific site
router.get('/site/:siteId/history', async (req, res) => {
  try {
    const { siteId } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    const history = await prisma.$queryRaw`
      SELECT 
        th.*,
        t.task_code,
        t.task_type,
        t.title as task_title,
        s.site_id as site_code,
        s.site_name
      FROM task_history th
      LEFT JOIN tasks t ON th.task_id = t.id
      LEFT JOIN sites s ON th.site_id = s.id
      WHERE th.site_id = ${siteId}
      ORDER BY th.event_timestamp DESC
      LIMIT ${parseInt(limit)}
      OFFSET ${parseInt(offset)}
    `;

    const totalCount = await prisma.$queryRaw`
      SELECT COUNT(*) as count
      FROM task_history th
      WHERE th.site_id = ${siteId}
    `;

    res.json({
      success: true,
      data: history,
      pagination: {
        total: parseInt(totalCount[0].count),
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: parseInt(offset) + parseInt(limit) < parseInt(totalCount[0].count)
      }
    });
  } catch (error) {
    logger.error({ err: error }, 'Error fetching site history');
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch site history', 
      details: error.message 
    });
  }
});

// Get task history for specific task
router.get('/task/:taskId/history', async (req, res) => {
  try {
    const { taskId } = req.params;

    const history = await prisma.$queryRaw`
      SELECT 
        th.*,
        t.task_code,
        t.task_type,
        t.title as task_title,
        s.site_id as site_code,
        s.site_name
      FROM task_history th
      LEFT JOIN tasks t ON th.task_id = t.id
      LEFT JOIN sites s ON th.site_id = s.id
      WHERE th.task_id = ${taskId}
      ORDER BY th.event_timestamp ASC
    `;

    res.json({
      success: true,
      data: history,
      count: history.length
    });
  } catch (error) {
    logger.error({ err: error }, 'Error fetching task history');
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch task history', 
      details: error.message 
    });
  }
});

// Export site journey data to CSV
router.get('/export/site-journey', async (req, res) => {
  try {
    const { format = 'csv' } = req.query;

    const query = `
      SELECT 
        s.site_id as "Site Code",
        s.site_name as "Site Name",
        s.region as "Region",
        s.city as "City",
        TO_CHAR(s.created_at, 'YYYY-MM-DD HH24:MI:SS') as "Site Registered Date",
        
        COUNT(DISTINCT t.id) as "Total Tasks",
        COUNT(DISTINCT CASE WHEN t.status = 'pending' THEN t.id END) as "Pending Tasks",
        COUNT(DISTINCT CASE WHEN t.status = 'in_progress' THEN t.id END) as "In Progress Tasks",
        COUNT(DISTINCT CASE WHEN t.status = 'completed' THEN t.id END) as "Completed Tasks",
        
        TO_CHAR(MIN(CASE WHEN th.event_type = 'CREATED' AND t.task_type = 'ATP_UPLOAD' THEN th.event_timestamp END), 'YYYY-MM-DD HH24:MI:SS') as "ATP Upload Task Created",
        TO_CHAR(MIN(CASE WHEN th.event_type = 'STATUS_CHANGED' AND t.task_type = 'ATP_UPLOAD' AND th.new_status = 'completed' THEN th.event_timestamp END), 'YYYY-MM-DD HH24:MI:SS') as "ATP Uploaded Date",
        TO_CHAR(MIN(CASE WHEN th.workflow_stage = 'REVIEW_L1' AND th.event_type = 'CREATED' THEN th.event_timestamp END), 'YYYY-MM-DD HH24:MI:SS') as "Review L1 Started",
        TO_CHAR(MIN(CASE WHEN th.workflow_stage = 'REVIEW_L1' AND th.event_type = 'STATUS_CHANGED' AND th.new_status = 'completed' THEN th.event_timestamp END), 'YYYY-MM-DD HH24:MI:SS') as "Review L1 Completed",
        TO_CHAR(MIN(CASE WHEN th.workflow_stage = 'REVIEW_L2' AND th.event_type = 'CREATED' THEN th.event_timestamp END), 'YYYY-MM-DD HH24:MI:SS') as "Review L2 Started",
        TO_CHAR(MIN(CASE WHEN th.workflow_stage = 'REVIEW_L2' AND th.event_type = 'STATUS_CHANGED' AND th.new_status = 'completed' THEN th.event_timestamp END), 'YYYY-MM-DD HH24:MI:SS') as "Review L2 Completed",
        TO_CHAR(MIN(CASE WHEN th.workflow_stage = 'REVIEW_L3' AND th.event_type = 'CREATED' THEN th.event_timestamp END), 'YYYY-MM-DD HH24:MI:SS') as "Review L3 Started",
        TO_CHAR(MIN(CASE WHEN th.workflow_stage = 'REVIEW_L3' AND th.event_type = 'STATUS_CHANGED' AND th.new_status = 'completed' THEN th.event_timestamp END), 'YYYY-MM-DD HH24:MI:SS') as "Review L3 Completed",
        TO_CHAR(MAX(CASE WHEN th.decision = 'PASS' AND th.workflow_stage = 'REVIEW_L3' THEN th.event_timestamp END), 'YYYY-MM-DD HH24:MI:SS') as "Fully Approved Date",
        
        (SELECT t2.status FROM tasks t2 WHERE t2.site_id = s.id AND t2.task_type = 'ATP_UPLOAD' ORDER BY t2.created_at DESC LIMIT 1) as "Current ATP Status",
        (SELECT th2.workflow_stage FROM task_history th2 WHERE th2.site_id = s.id ORDER BY th2.event_timestamp DESC LIMIT 1) as "Current Workflow Stage",
        
        ROUND(CASE 
          WHEN MAX(CASE WHEN th.decision = 'PASS' AND th.workflow_stage = 'REVIEW_L3' THEN th.event_timestamp END) IS NOT NULL 
          THEN EXTRACT(EPOCH FROM (MAX(CASE WHEN th.decision = 'PASS' AND th.workflow_stage = 'REVIEW_L3' THEN th.event_timestamp END) - s.created_at))/86400
          ELSE NULL 
        END, 2) as "Total Days to Completion",
        
        TO_CHAR(MAX(th.event_timestamp), 'YYYY-MM-DD HH24:MI:SS') as "Last Activity Date",
        (SELECT th3.event_description FROM task_history th3 WHERE th3.site_id = s.id ORDER BY th3.event_timestamp DESC LIMIT 1) as "Last Activity Description"

      FROM sites s
      LEFT JOIN tasks t ON s.id = t.site_id
      LEFT JOIN task_history th ON s.id = th.site_id
      GROUP BY s.id, s.site_id, s.site_name, s.region, s.city, s.created_at
      ORDER BY s.created_at DESC
    `;

    const result = await prisma.$queryRawUnsafe(query);

    if (format === 'csv') {
      // Convert to CSV
      const headers = Object.keys(result[0] || {});
      const csvContent = [
        headers.join(','),
        ...result.map(row => 
          headers.map(header => {
            const value = row[header];
            // Escape CSV values that contain commas or quotes
            if (value && (value.toString().includes(',') || value.toString().includes('"'))) {
              return `"${value.toString().replace(/"/g, '""')}"`;
            }
            return value || '';
          }).join(',')
        )
      ].join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="site-journey-export-${new Date().toISOString().split('T')[0]}.csv"`);
      res.send(csvContent);
    } else {
      // Return JSON
      res.json({
        success: true,
        data: result,
        count: result.length,
        exported_at: new Date().toISOString()
      });
    }
  } catch (error) {
    logger.error({ err: error }, 'Error exporting site journey');
    res.status(500).json({ 
      success: false, 
      error: 'Failed to export site journey', 
      details: error.message 
    });
  }
});

// Manually log task event (for API integration)
router.post('/log-event', validateBody(taskHistoryLogSchema, { stripUnknown: false }), async (req, res) => {
  try {
    const {
      site_id,
      task_id,
      event_type,
      event_description,
      old_status,
      new_status,
      decision,
      decision_comments,
      workflow_stage,
      performed_by,
      metadata = {}
    } = req.body;

    // Validate required fields
    if (!site_id || !task_id || !event_type || !event_description) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: site_id, task_id, event_type, event_description'
      });
    }

    const historyEntry = await prisma.$queryRaw`
      INSERT INTO task_history (
        site_id, task_id, event_type, event_description,
        old_status, new_status, decision, decision_comments,
        workflow_stage, performed_by, metadata
      ) VALUES (
        ${site_id}, ${task_id}, ${event_type}, ${event_description},
        ${old_status}, ${new_status}, ${decision}, ${decision_comments},
        ${workflow_stage}, ${performed_by}, ${JSON.stringify(metadata)}::jsonb
      ) RETURNING *
    `;

    res.status(201).json({
      success: true,
      data: historyEntry[0],
      message: 'Task event logged successfully'
    });
  } catch (error) {
    logger.error({ err: error }, 'Error logging task event');
    res.status(500).json({ 
      success: false, 
      error: 'Failed to log task event', 
      details: error.message 
    });
  }
});

module.exports = router;
