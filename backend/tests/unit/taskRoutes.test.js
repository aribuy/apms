const prismaInstance = {
  task: {
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    findUnique: jest.fn()
  },
  site: {
    findUnique: jest.fn()
  }
};

jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => prismaInstance)
}));

jest.mock('../../src/middleware/auth', () => ({
  authenticateToken: (req, _res, next) => {
    const role = req.headers['x-test-role'] || 'SUPERADMIN';
    const userId = req.headers['x-test-user'] || 'user-1';
    req.user = { id: userId, role };
    next();
  }
}));

jest.mock('../../src/middleware/auditLogger', () => ({
  logAuditEvent: jest.fn()
}));

jest.mock('../../src/validations/task', () => ({
  taskCreateSchema: {
    validate: (value) => ({ value })
  },
  taskUpdateSchema: {
    validate: (value) => ({ value })
  }
}));

const { logAuditEvent } = require('../../src/middleware/auditLogger');
const taskRoutes = require('../../src/routes/taskRoutes');

const makeRes = () => {
  const res = {};
  res.statusCode = 200;
  res.status = jest.fn((code) => {
    res.statusCode = code;
    return res;
  });
  res.json = jest.fn((payload) => {
    res.body = payload;
    return res;
  });
  return res;
};

const getRouteHandler = (method, path) => {
  const layer = taskRoutes.stack.find(
    (entry) => entry.route && entry.route.path === path && entry.route.methods[method]
  );
  return layer.route.stack[layer.route.stack.length - 1].handle;
};

describe('taskRoutes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    prismaInstance.task.findMany.mockReset();
    prismaInstance.task.create.mockReset();
    prismaInstance.task.delete.mockReset();
    prismaInstance.task.findUnique.mockReset();
    prismaInstance.site.findUnique.mockReset();
  });

  it('lists tasks', async () => {
    prismaInstance.task.findMany.mockResolvedValueOnce([
      { id: 't1', taskCode: 'TASK-1' }
    ]);

    const handler = getRouteHandler('get', '/');
    const req = {
      user: { id: 'user-1', role: 'SUPERADMIN' },
      query: {},
      get: () => 'jest'
    };
    const res = makeRes();

    await handler(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.body.data).toHaveLength(1);
  });

  it('rejects task creation when required fields missing', async () => {
    const handler = getRouteHandler('post', '/');
    const req = {
      user: { id: 'user-1', role: 'SUPERADMIN' },
      get: () => 'jest',
      body: { title: 'Missing site' }
    };
    const res = makeRes();

    await handler(req, res);

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe('Missing required fields: site_id, task_type, title');
  });

  it('creates task when site exists', async () => {
    prismaInstance.site.findUnique.mockResolvedValueOnce({ id: 's1', workspaceId: 'w1' });
    prismaInstance.task.create.mockResolvedValueOnce({
      id: 't1',
      taskCode: 'TASK-1',
      sites: { siteId: 'S1' }
    });

    const handler = getRouteHandler('post', '/');
    const req = {
      user: { id: 'user-1', role: 'SUPERADMIN' },
      get: () => 'jest',
      body: {
        site_id: 's1',
        task_type: 'TEST',
        title: 'Test task'
      }
    };
    const res = makeRes();

    await handler(req, res);

    expect(res.statusCode).toBe(201);
    expect(res.body.data.id).toBe('t1');
    expect(logAuditEvent).toHaveBeenCalled();
  });

  it('deletes task and logs audit event', async () => {
    prismaInstance.task.findUnique.mockResolvedValueOnce({ id: 't1' });
    prismaInstance.task.delete.mockResolvedValueOnce({ id: 't1', taskCode: 'TASK-1' });

    const handler = getRouteHandler('delete', '/:id');
    const req = {
      user: { id: 'user-1', role: 'SUPERADMIN' },
      get: () => 'jest',
      params: { id: 't1' }
    };
    const res = makeRes();

    await handler(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toContain('TASK-1');
    expect(logAuditEvent).toHaveBeenCalled();
  });
});
