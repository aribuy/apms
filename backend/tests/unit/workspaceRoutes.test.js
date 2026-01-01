const prismaMock = {
  $queryRaw: jest.fn()
};

jest.mock('../../src/utils/prisma', () => ({
  prisma: prismaMock
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

jest.mock('../../src/middleware/rateLimiter', () => ({
  workspaceCreationLimiter: (_req, _res, next) => next(),
  workspaceMemberLimiter: (_req, _res, next) => next()
}));

jest.mock('../../src/validations/workspace', () => ({
  workspaceCreateSchema: { validate: (value) => ({ value }) },
  workspaceUpdateSchema: { validate: (value) => ({ value }) },
  userWorkspaceCreateSchema: { validate: (value) => ({ value }) },
  userWorkspaceUpdateSchema: { validate: (value) => ({ value }) },
  workspaceMemberCreateSchema: { validate: (value) => ({ value }) },
  workspaceMemberUpdateSchema: { validate: (value) => ({ value }) }
}));

const { logAuditEvent } = require('../../src/middleware/auditLogger');
const workspaceRoutes = require('../../src/routes/workspaceRoutes');

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
  const layer = workspaceRoutes.stack.find(
    (entry) => entry.route && entry.route.path === path && entry.route.methods[method]
  );
  return layer.route.stack[layer.route.stack.length - 1].handle;
};

describe('workspaceRoutes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    prismaMock.$queryRaw.mockReset();
  });

  it('lists workspaces for authorized user', async () => {
    prismaMock.$queryRaw.mockResolvedValueOnce([
      { id: 'w1', code: 'WS1', name: 'Workspace 1' }
    ]);

    const handler = getRouteHandler('get', '/workspaces');
    const req = {
      user: { id: 'user-1', role: 'SUPERADMIN' },
      get: () => 'jest'
    };
    req.query = {};
    const res = makeRes();

    await handler(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(prismaMock.$queryRaw).toHaveBeenCalled();
  });

  it('creates workspace for admin role', async () => {
    prismaMock.$queryRaw.mockResolvedValueOnce([
      {
        id: 'w1',
        code: 'WS1',
        name: 'Workspace 1',
        is_active: true
      }
    ]);

    const handler = getRouteHandler('post', '/workspaces');
    const req = {
      user: { id: 'user-1', role: 'SUPERADMIN' },
      get: () => 'jest',
      body: {
        code: 'WS1',
        name: 'Workspace 1',
        customerGroupId: 'CG1',
        vendorOwnerId: 'VO1'
      }
    };
    const res = makeRes();

    await handler(req, res);

    expect(res.statusCode).toBe(201);
    expect(res.body.data.id).toBe('w1');
    expect(logAuditEvent).toHaveBeenCalled();
  });

  it('blocks workspace creation for non-admin role', async () => {
    const handler = getRouteHandler('post', '/workspaces');
    const req = {
      user: { id: 'user-1', role: 'USER' },
      get: () => 'jest',
      body: {
        code: 'WS1',
        name: 'Workspace 1',
        customerGroupId: 'CG1',
        vendorOwnerId: 'VO1'
      }
    };
    const res = makeRes();

    await handler(req, res);

    expect(res.statusCode).toBe(403);
    expect(res.body.error).toBe('Forbidden');
  });

  it('updates workspace for admin role', async () => {
    prismaMock.$queryRaw
      .mockResolvedValueOnce([{ id: 'w1', code: 'WS1', name: 'Workspace 1' }])
      .mockResolvedValueOnce([{ id: 'w1', code: 'WS1', name: 'Workspace 1A' }]);

    const handler = getRouteHandler('put', '/workspaces/:workspaceId');
    const req = {
      user: { id: 'user-1', role: 'ADMIN' },
      get: () => 'jest',
      params: { workspaceId: 'w1' },
      body: { name: 'Workspace 1A' }
    };
    const res = makeRes();

    await handler(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.body.data.name).toBe('Workspace 1A');
    expect(logAuditEvent).toHaveBeenCalled();
  });
});
