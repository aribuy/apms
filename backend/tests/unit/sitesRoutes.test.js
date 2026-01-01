const prismaInstance = {
  site: {
    findMany: jest.fn(),
    updateMany: jest.fn(),
    createMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn()
  }
};

jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => prismaInstance)
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

jest.mock('../../src/validations/site', () => ({
  siteBulkCreateSchema: { validate: (value) => ({ value }) },
  siteBulkUpdateSchema: { validate: (value) => ({ value }) },
  siteUpdateSchema: { validate: (value) => ({ value }) }
}));

const { logAuditEvent } = require('../../src/middleware/auditLogger');
const sitesRoutes = require('../../src/routes/sitesRoutes');

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
  const layer = sitesRoutes.stack.find(
    (entry) => entry.route && entry.route.path === path && entry.route.methods[method]
  );
  return layer.route.stack[layer.route.stack.length - 1].handle;
};

describe('sitesRoutes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('lists sites', async () => {
    prismaInstance.site.findMany.mockResolvedValueOnce([{ id: 's1' }]);
    const handler = getRouteHandler('get', '/');
    const req = { query: {}, user: { id: 'user-1' } };
    const res = makeRes();

    await handler(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveLength(1);
  });

  it('bulk creates sites and logs audit event', async () => {
    prismaInstance.site.createMany.mockResolvedValueOnce({ count: 1 });
    const handler = getRouteHandler('post', '/bulk');
    const req = {
      user: { id: 'user-1' },
      body: { sites: [{ siteId: 'S1', siteName: 'Site 1', region: 'R1', city: 'C1' }] },
      query: {},
      get: () => 'jest'
    };
    const res = makeRes();

    await handler(req, res);

    expect(res.statusCode).toBe(200);
    expect(logAuditEvent).toHaveBeenCalled();
  });

  it('updates a site and logs audit event', async () => {
    prismaInstance.site.findUnique.mockResolvedValueOnce({ id: 's1' });
    prismaInstance.site.update.mockResolvedValueOnce({ id: 's1', siteName: 'Updated' });
    const handler = getRouteHandler('put', '/:id');
    const req = {
      user: { id: 'user-1' },
      params: { id: 's1' },
      body: { siteName: 'Updated' },
      get: () => 'jest'
    };
    const res = makeRes();

    await handler(req, res);

    expect(res.statusCode).toBe(200);
    expect(logAuditEvent).toHaveBeenCalled();
  });

  it('deletes a site and logs audit event', async () => {
    prismaInstance.site.findUnique.mockResolvedValueOnce({ id: 's1' });
    prismaInstance.site.delete.mockResolvedValueOnce({ id: 's1' });
    const handler = getRouteHandler('delete', '/:id');
    const req = {
      user: { id: 'user-1' },
      params: { id: 's1' },
      get: () => 'jest'
    };
    const res = makeRes();

    await handler(req, res);

    expect(res.statusCode).toBe(200);
    expect(logAuditEvent).toHaveBeenCalled();
  });
});
