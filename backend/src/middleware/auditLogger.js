const crypto = require('crypto');
const { prisma } = require('../utils/prisma');
const logger = require('../utils/logger');

const logAuditEvent = async ({
  userId,
  action,
  resource,
  resourceId,
  oldData = null,
  newData = null,
  ipAddress,
  userAgent
}) => {
  if (!userId) {
    return;
  }

  try {
    await prisma.audit_logs.create({
      data: {
        id: crypto.randomUUID(),
        user_id: userId,
        action,
        resource,
        resource_id: resourceId || null,
        old_data: oldData,
        new_data: newData,
        ip_address: ipAddress || null,
        user_agent: userAgent || null
      }
    });
  } catch (error) {
    logger.error({ err: error }, 'Failed to write audit log');
  }
};

module.exports = { logAuditEvent };
