const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');
const { authenticateToken } = require('../middleware/auth');
const { logAuditEvent } = require('../middleware/auditLogger');
const { validateBody } = require('../middleware/validator');
const {
  siteBulkCreateSchema,
  siteBulkUpdateSchema,
  siteUpdateSchema,
  siteDuplicateCheckSchema
} = require('../validations/site');

router.use(authenticateToken);

// Use the same Prisma instance from server.js
let prisma;
try {
  const { PrismaClient, Prisma } = require('@prisma/client');
  prisma = new PrismaClient();
  prisma._rawHelpers = { Prisma };
  logger.debug('Prisma client initialized in sitesRoutes');
} catch (error) {
  logger.error({ err: error }, 'Error initializing Prisma');
}

// Get all sites
router.get('/', async (req, res) => {
  try {
    logger.debug('Fetching sites from database');
    const { workspace_id, workspaceId } = req.query;
    const whereClause = {};
    if (workspaceId || workspace_id) whereClause.workspaceId = workspaceId || workspace_id;

    const sites = await prisma.site.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' }
    });
    logger.debug({ count: sites.length }, 'Sites fetched');
    res.json(sites);
  } catch (error) {
    logger.error({ err: error }, 'Error fetching sites');
    res.status(500).json({ error: 'Failed to fetch sites', details: error.message });
  }
});

// Check for duplicate sites
router.post('/check-duplicates', validateBody(siteDuplicateCheckSchema), async (req, res) => {
  const { sites } = req.body;
  const { workspace_id, workspaceId } = req.query;

  if (!sites || !Array.isArray(sites)) {
    return res.status(400).json({ error: 'Sites array is required' });
  }

  try {
    const siteIds = sites.map(site => site.siteId);
    const whereClause = {
      siteId: { in: siteIds }
    };
    if (workspaceId || workspace_id) {
      whereClause.workspaceId = workspaceId || workspace_id;
    }
    const existingSites = await prisma.site.findMany({ where: whereClause });

    const duplicateIds = existingSites.map(site => site.siteId);
    const duplicateSites = sites.filter(site => duplicateIds.includes(site.siteId));

    res.json({
      duplicates: duplicateSites.length,
      duplicateList: duplicateSites,
      existingData: existingSites
    });
  } catch (error) {
    logger.error({ err: error }, 'Error checking duplicates');
    res.status(500).json({ error: 'Failed to check duplicates' });
  }
});

// Update existing sites (bulk)
router.put('/update-bulk', validateBody(siteBulkUpdateSchema), async (req, res) => {
  const { sites } = req.body;
  const { workspace_id, workspaceId } = req.query;
  const resolvedWorkspaceId = req.body.workspaceId || req.body.workspace_id || workspaceId || workspace_id;

  try {
    let updatedCount = 0;

    for (const site of sites) {
      const whereClause = { siteId: site.siteId };
      if (resolvedWorkspaceId) {
        whereClause.workspaceId = resolvedWorkspaceId;
      }
      await prisma.site.updateMany({
        where: whereClause,
        data: {
          siteName: site.siteName,
          region: site.region,
          city: site.city,
          updatedAt: new Date()
        }
      });
      updatedCount++;
    }

    await logAuditEvent({
      userId: req.user?.id,
      action: 'BULK_UPDATE',
      resource: 'site',
      resourceId: resolvedWorkspaceId || null,
      newData: {
        updatedCount,
        workspaceId: resolvedWorkspaceId,
        siteIds: sites.map(site => site.siteId)
      },
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    res.json({
      message: `${updatedCount} sites updated successfully`,
      updated: updatedCount
    });
  } catch (error) {
    logger.error({ err: error }, 'Error updating sites');
    res.status(500).json({ error: 'Failed to update sites' });
  }
});

// Create multiple sites (bulk)
router.post('/bulk', validateBody(siteBulkCreateSchema), async (req, res) => {
  const { sites } = req.body;
  const { workspace_id, workspaceId } = req.query;
  const resolvedWorkspaceId = req.body.workspaceId || req.body.workspace_id || workspaceId || workspace_id;

  if (!sites || !Array.isArray(sites)) {
    return res.status(400).json({ error: 'Sites array is required' });
  }

  try {
    const normalizeBoolean = (value) => {
      if (typeof value === 'boolean') return value;
      if (value === null || value === undefined) return undefined;
      const normalized = String(value).trim().toLowerCase();
      if (['true', 'yes', 'y', '1'].includes(normalized)) return true;
      if (['false', 'no', 'n', '0'].includes(normalized)) return false;
      return undefined;
    };

    const resolveAtpType = (value) => {
      if (!value) return undefined;
      const normalized = String(value).trim().toUpperCase();
      if (['SOFTWARE', 'HARDWARE', 'BOTH'].includes(normalized)) return normalized;
      return undefined;
    };

    const resolveDocControllerId = async (workspaceIdValue) => {
      if (!workspaceIdValue) {
        const fallback = await prisma.users.findFirst({
          where: { role: 'DOC_CONTROL' },
          select: { id: true }
        });
        return fallback?.id || null;
      }

      const rows = await prisma.$queryRaw(
        prisma._rawHelpers.Prisma.sql`
          SELECT user_id
          FROM workspace_members
          WHERE workspace_id = ${workspaceIdValue}::uuid AND role = 'DOC_CONTROL'
          LIMIT 1
        `
      );
      if (rows && rows.length > 0) return rows[0].user_id;

      const fallback = await prisma.users.findFirst({
        where: { role: 'DOC_CONTROL' },
        select: { id: true }
      });
      return fallback?.id || null;
    };

    let createdCount = 0;
    let updatedCount = 0;
    let taskCreatedCount = 0;
    const taskTypesCreated = [];

    const docControllerId = await resolveDocControllerId(resolvedWorkspaceId);

    for (const site of sites) {
      const atpRequiredInput = normalizeBoolean(site.atpRequired ?? site.atp_required ?? site.atpRequiredFlag);
      const atpTypeInput = resolveAtpType(site.atpType ?? site.atp_type);

      const siteData = {
        siteId: site.siteId,
        siteName: site.siteName,
        scope: site.scope || site.siteType || 'MW',
        region: site.region,
        city: site.city,
        neLatitude: site.neLatitude ?? null,
        neLongitude: site.neLongitude ?? null,
        feLatitude: site.feLatitude ?? null,
        feLongitude: site.feLongitude ?? null,
        status: site.status || 'ACTIVE',
        workflowStage: site.workflowStage || 'REGISTERED',
        ...(resolvedWorkspaceId ? { workspaceId: resolvedWorkspaceId } : {})
      };

      const existing = await prisma.site.findUnique({
        where: { siteId: site.siteId }
      });

      let atpRequired = existing?.atpRequired ?? false;
      let atpType = existing?.atpType ?? 'BOTH';
      if (typeof atpRequiredInput !== 'undefined') atpRequired = atpRequiredInput;
      if (typeof atpTypeInput !== 'undefined') atpType = atpTypeInput;

      if (existing) {
        await prisma.site.update({
          where: { id: existing.id },
          data: {
            ...siteData,
            atpRequired,
            atpType
          }
        });
        updatedCount++;
      } else {
        await prisma.site.create({
          data: {
            id: require('crypto').randomUUID(),
            ...siteData,
            atpRequired: typeof atpRequiredInput === 'undefined' ? false : atpRequired,
            atpType: atpType || 'BOTH'
          }
        });
        createdCount++;
      }

      const shouldCreateTasks = (existing ? existing.atpRequired !== true : true) && atpRequired === true;
      if (shouldCreateTasks) {
        const siteRecord = existing || await prisma.site.findUnique({ where: { siteId: site.siteId } });
        if (!siteRecord) continue;

        const taskTypes = atpType === 'BOTH'
          ? ['ATP_SOFTWARE', 'ATP_HARDWARE']
          : atpType === 'SOFTWARE'
            ? ['ATP_SOFTWARE']
            : ['ATP_HARDWARE'];

        for (const taskType of taskTypes) {
          const existingTask = await prisma.task.findFirst({
            where: { siteId: siteRecord.id, taskType }
          });
          if (existingTask) continue;

          await prisma.task.create({
            data: {
              taskCode: `${taskType.replace('ATP_', 'ATP-')}-${siteRecord.siteId}-${String(Date.now()).slice(-4)}`,
              taskType,
              title: `${taskType === 'ATP_SOFTWARE' ? 'Software' : 'Hardware'} ATP Task - ${siteRecord.siteId}`,
              description: `${taskType === 'ATP_SOFTWARE' ? 'Software' : 'Hardware'} ATP testing for ${siteRecord.siteName}`,
              status: 'pending',
              priority: 'high',
              assignedTo: docControllerId,
              siteId: siteRecord.id,
              dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
              taskData: {},
              workspaceId: resolvedWorkspaceId || siteRecord.workspaceId || null
            }
          });
          taskCreatedCount++;
          taskTypesCreated.push(taskType);
        }
      }
    }

    await logAuditEvent({
      userId: req.user?.id,
      action: 'BULK_CREATE',
      resource: 'site',
      resourceId: resolvedWorkspaceId || null,
      newData: {
        createdCount,
        updatedCount,
        taskCreatedCount,
        workspaceId: resolvedWorkspaceId,
        siteIds: sites.map(site => site.siteId)
      },
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    res.json({
      message: `${createdCount} sites created, ${updatedCount} updated, ${taskCreatedCount} ATP tasks created`,
      created: createdCount,
      updated: updatedCount,
      tasksCreated: taskCreatedCount,
      taskTypesCreated
    });
  } catch (error) {
    logger.error({ err: error }, 'Error creating sites');
    res.status(500).json({ error: 'Failed to create sites' });
  }
});

// Update site
router.put('/:id', validateBody(siteUpdateSchema), async (req, res) => {
  const { id } = req.params;

  try {
    const existingSite = await prisma.site.findUnique({
      where: { id }
    });

    const updatedSite = await prisma.site.update({
      where: { id },
      data: { ...req.body, updatedAt: new Date() }
    });

    await logAuditEvent({
      userId: req.user?.id,
      action: 'UPDATE',
      resource: 'site',
      resourceId: updatedSite?.id,
      oldData: existingSite,
      newData: updatedSite,
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    res.json({ message: 'Site updated successfully', site: updatedSite });
  } catch (error) {
    logger.error({ err: error }, 'Error updating site');
    res.status(500).json({ error: 'Failed to update site' });
  }
});

// Delete site
router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const existingSite = await prisma.site.findUnique({
      where: { id }
    });

    await prisma.site.delete({
      where: { id }
    });

    await logAuditEvent({
      userId: req.user?.id,
      action: 'DELETE',
      resource: 'site',
      resourceId: existingSite?.id,
      oldData: existingSite,
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    res.json({ message: 'Site deleted successfully' });
  } catch (error) {
    logger.error({ err: error }, 'Error deleting site');
    res.status(500).json({ error: 'Failed to delete site' });
  }
});

module.exports = router;
