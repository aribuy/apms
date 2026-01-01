const prismaMock = {
  audit_logs: {
    findMany: jest.fn()
  }
};

jest.mock('../../src/utils/prisma', () => ({
  prisma: prismaMock
}));

jest.mock('../../src/middleware/auth', () => ({
  authenticateToken: (req, _res, next) => {
    req.user = { id: 'user-1' };
    next();
  }
}));

const auditRoutes = require('../../src/routes/auditRoutes');

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
  const layer = auditRoutes.stack.find(
    (entry) => entry.route && entry.route.path === path && entry.route.methods[method]
  );
  return layer.route.stack[layer.route.stack.length - 1].handle;
};

describe('auditRoutes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    prismaMock.audit_logs.findMany.mockReset();
  });

  it('returns audit logs for authorized user', async () => {
    prismaMock.audit_logs.findMany.mockResolvedValueOnce([{ id: 'a1' }]);
    const handler = getRouteHandler('get', '/logs');
    const req = {
      user: { id: 'user-1' },
      query: { limit: '1', offset: '0' }
    };
    const res = makeRes();

    await handler(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.body.data).toHaveLength(1);
  });

  it('returns 401 if user missing', async () => {
    const handler = getRouteHandler('get', '/logs');
    const req = { user: null, query: {} };
    const res = makeRes();

    await handler(req, res);

    expect(res.statusCode).toBe(401);
  });
});
