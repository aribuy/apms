jest.mock('../../src/utils/logger', () => ({
  error: jest.fn()
}));

jest.mock('../../src/utils/prisma', () => ({
  prisma: {
    audit_logs: {
      create: jest.fn()
    }
  }
}));

const logger = require('../../src/utils/logger');
const { prisma } = require('../../src/utils/prisma');
const { logAuditEvent } = require('../../src/middleware/auditLogger');

describe('logAuditEvent', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('does nothing when userId is missing', async () => {
    await logAuditEvent({
      action: 'CREATE',
      resource: 'task'
    });

    expect(prisma.audit_logs.create).not.toHaveBeenCalled();
  });

  it('writes audit log entry when userId is provided', async () => {
    await logAuditEvent({
      userId: 'user-1',
      action: 'CREATE',
      resource: 'task',
      resourceId: 'task-1',
      newData: { id: 'task-1' },
      ipAddress: '127.0.0.1',
      userAgent: 'jest'
    });

    expect(prisma.audit_logs.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        user_id: 'user-1',
        action: 'CREATE',
        resource: 'task',
        resource_id: 'task-1'
      })
    });
  });

  it('logs error when write fails', async () => {
    prisma.audit_logs.create.mockRejectedValueOnce(new Error('db error'));

    await logAuditEvent({
      userId: 'user-1',
      action: 'CREATE',
      resource: 'task'
    });

    expect(logger.error).toHaveBeenCalled();
  });
});
