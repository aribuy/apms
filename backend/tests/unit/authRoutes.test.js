const prismaMock = {
  user: {
    findUnique: jest.fn()
  }
};

jest.mock('../../src/utils/prisma', () => ({
  prisma: prismaMock
}));

jest.mock('bcryptjs', () => ({
  compare: jest.fn()
}));

jest.mock('jsonwebtoken', () => ({
  sign: jest.fn(() => 'jwt-token'),
  verify: jest.fn(() => ({ id: 'u1' }))
}));

const bcrypt = require('bcryptjs');
const authRoutes = require('../../src/routes/authRoutes');

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
  const layer = authRoutes.stack.find(
    (entry) => entry.route && entry.route.path === path && entry.route.methods[method]
  );
  return layer.route.stack[layer.route.stack.length - 1].handle;
};

describe('authRoutes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    prismaMock.user.findUnique.mockReset();
  });

  it('rejects login with missing fields', async () => {
    const handler = getRouteHandler('post', '/login');
    const req = { body: {} };
    const res = makeRes();

    await handler(req, res);

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe('Email and password are required');
  });

  it('logs in with valid credentials', async () => {
    prismaMock.user.findUnique.mockResolvedValueOnce({
      id: 'u1',
      email: 'user@example.com',
      username: 'user',
      role: 'ADMIN',
      passwordHash: 'hash'
    });
    bcrypt.compare.mockResolvedValueOnce(true);

    const handler = getRouteHandler('post', '/login');
    const req = { body: { email: 'user@example.com', password: 'pass' } };
    const res = makeRes();

    await handler(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.accessToken).toBe('jwt-token');
  });

  it('returns user profile for valid token', async () => {
    prismaMock.user.findUnique.mockResolvedValueOnce({
      id: 'u1',
      email: 'user@example.com',
      username: 'user',
      role: 'ADMIN',
      createdAt: '2025-01-01'
    });

    const handler = getRouteHandler('get', '/me');
    const req = { headers: { authorization: 'Bearer token' } };
    const res = makeRes();

    await handler(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.body.data.user.id).toBe('u1');
  });
});
