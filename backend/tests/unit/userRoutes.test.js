const prismaMock = {
  $queryRaw: jest.fn()
};

jest.mock('../../src/utils/prisma', () => ({
  prisma: prismaMock
}));

jest.mock('../../src/middleware/auth', () => ({
  authenticateToken: (req, _res, next) => {
    req.user = { id: 'user-1', role: 'SUPERADMIN' };
    next();
  }
}));

jest.mock('../../src/middleware/auditLogger', () => ({
  logAuditEvent: jest.fn()
}));

jest.mock('../../src/validations/user', () => ({
  userCreateSchema: { validate: (value) => ({ value }) },
  userUpdateSchema: { validate: (value) => ({ value }) }
}));

const { logAuditEvent } = require('../../src/middleware/auditLogger');
const userRoutes = require('../../src/routes/userRoutes');

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
  const layer = userRoutes.stack.find(
    (entry) => entry.route && entry.route.path === path && entry.route.methods[method]
  );
  return layer.route.stack[layer.route.stack.length - 1].handle;
};

describe('userRoutes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    prismaMock.$queryRaw.mockReset();
  });

  it('lists users from database', async () => {
    prismaMock.$queryRaw.mockResolvedValueOnce([
      { id: 'u1', email: 'user@example.com' }
    ]);
    const handler = getRouteHandler('get', '/');
    const req = {};
    const res = makeRes();

    await handler(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.body.data).toHaveLength(1);
  });

  it('creates user and logs audit event', async () => {
    prismaMock.$queryRaw.mockResolvedValueOnce([
      { id: 'u1', email: 'user@example.com', username: 'user' }
    ]);
    const handler = getRouteHandler('post', '/create');
    const req = {
      user: { id: 'admin-1' },
      body: { email: 'user@example.com', username: 'user' },
      get: () => 'jest'
    };
    const res = makeRes();

    await handler(req, res);

    expect(res.statusCode).toBe(200);
    expect(logAuditEvent).toHaveBeenCalled();
  });

  it('updates user and logs audit event', async () => {
    prismaMock.$queryRaw.mockResolvedValueOnce([
      { id: 'u1', email: 'user@example.com', username: 'user' }
    ]);
    const handler = getRouteHandler('put', '/update/:id');
    const req = {
      user: { id: 'admin-1' },
      params: { id: 'u1' },
      body: { name: 'Updated' },
      get: () => 'jest'
    };
    const res = makeRes();

    await handler(req, res);

    expect(res.statusCode).toBe(200);
    expect(logAuditEvent).toHaveBeenCalled();
  });

  it('deletes user and logs audit event', async () => {
    prismaMock.$queryRaw.mockResolvedValueOnce([{ id: 'u1' }]);
    const handler = getRouteHandler('delete', '/delete/:id');
    const req = {
      user: { id: 'admin-1' },
      params: { id: 'u1' },
      get: () => 'jest'
    };
    const res = makeRes();

    await handler(req, res);

    expect(res.statusCode).toBe(200);
    expect(logAuditEvent).toHaveBeenCalled();
  });
});
