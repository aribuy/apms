require('../helpers/test-env');
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret';

const request = require('supertest');
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const { createTestServer, closeTestServer } = require('../helpers/test-server');

describe('Auth Refresh Flow', () => {
  let app;
  let server;
  let prisma;
  const userId = `test-auth-${Date.now()}`;
  const email = `auth.flow.${Date.now()}@apms.com`;
  const password = 'TestPass123!';

  beforeAll(async () => {
    app = require('../../server');
    server = await createTestServer(app);
    prisma = new PrismaClient();

    const passwordHash = await bcrypt.hash(password, 10);
    await prisma.users.create({
      data: {
        id: userId,
        email,
        username: `auth_flow_${Date.now()}`,
        role: 'ADMIN',
        password_hash: passwordHash,
        updated_at: new Date(),
        status: 'ACTIVE'
      }
    });
  });

  afterAll(async () => {
    await prisma.refresh_tokens.deleteMany({ where: { user_id: userId } });
    await prisma.users.deleteMany({ where: { id: userId } });
    await closeTestServer(server);
    await prisma.$disconnect();
  });

  test('login issues refresh token and refresh rotates it', async () => {
    const loginRes = await request(server)
      .post('/api/v1/auth/login')
      .send({ email, password });

    expect(loginRes.status).toBe(200);
    expect(loginRes.body.success).toBe(true);

    const { refreshToken } = loginRes.body.data || {};
    expect(refreshToken).toBeTruthy();

    const refreshRes = await request(server)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken });

    expect(refreshRes.status).toBe(200);
    expect(refreshRes.body.success).toBe(true);
    expect(refreshRes.body.data.accessToken).toBeTruthy();
    expect(refreshRes.body.data.refreshToken).toBeTruthy();
    expect(refreshRes.body.data.refreshToken).not.toBe(refreshToken);

    const oldRefreshRes = await request(server)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken });

    expect(oldRefreshRes.status).toBe(401);
  });
});
