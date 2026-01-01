const express = require('express');
const router = express.Router();
const { prisma } = require('../utils/prisma');
const { authenticateToken } = require('../middleware/auth');
const logger = require('../utils/logger');

router.use(authenticateToken);

const requireAuth = (req, res) => {
  if (!req.user?.id) {
    res.status(401).json({ success: false, error: 'Unauthorized' });
    return false;
  }
  return true;
};

// GET /api/v1/audit/logs
router.get('/logs', async (req, res) => {
  try {
    if (!requireAuth(req, res)) return;

    const {
      userId,
      resource,
      action,
      limit = '50',
      offset = '0'
    } = req.query;

    const where = {};
    if (userId) where.user_id = userId;
    if (resource) where.resource = resource;
    if (action) where.action = action;

    const logs = await prisma.audit_logs.findMany({
      where,
      orderBy: { created_at: 'desc' },
      take: Math.min(Number(limit) || 50, 200),
      skip: Number(offset) || 0
    });

    res.json({ success: true, data: logs });
  } catch (error) {
    logger.error({ err: error }, 'Failed to fetch audit logs');
    res.status(500).json({ success: false, error: 'Failed to fetch audit logs' });
  }
});

module.exports = router;
