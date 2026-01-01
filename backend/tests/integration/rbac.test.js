require('../helpers/test-env');
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret';

const jwt = require('jsonwebtoken');
const request = require('supertest');
const { PrismaClient } = require('@prisma/client');
const { createTestServer, closeTestServer } = require('../helpers/test-server');
const { ensureDocControllerUser } = require('../helpers/test-users');

describe('RBAC & Security Tests', () => {
  let app;
  let server;
  let prisma;
  let token;

  beforeAll(async () => {
    app = require('../../server');
    server = await createTestServer(app);
    prisma = new PrismaClient();
    await ensureDocControllerUser(prisma);
    await prisma.users.upsert({
      where: { id: 'test-user' },
      update: {},
      create: {
        id: 'test-user',
        email: 'test.user@apms.local',
        username: 'test_user',
        name: 'Test User',
        role: 'admin',
        status: 'ACTIVE',
        updated_at: new Date()
      }
    });
    token = jwt.sign(
      { id: 'test-user', email: 'test.user@apms.local', role: 'admin' },
      process.env.JWT_SECRET
    );
  });

  afterAll(async () => {
    await closeTestServer(server);
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    await prisma.task.deleteMany({
      where: { taskCode: { contains: 'TEST-RBAC-' } }
    });
    await prisma.site.deleteMany({
      where: { siteId: { startsWith: 'TEST-RBAC-' } }
    });
  });

  test('site registration works without auth', async () => {
    const res = await request(server)
      .post('/api/v1/site-registration/register')
      .send({
        customerSiteId: `TEST-RBAC-${Date.now()}`,
        customerSiteName: 'RBAC Test Site',
        neTowerId: 'NE-001',
        neTowerName: 'NE Tower',
        feTowerId: 'FE-001',
        feTowerName: 'FE Tower',
        neLatitude: -7.2575,
        neLongitude: 112.7521,
        feLatitude: -7.2675,
        feLongitude: 112.7621,
        region: 'East Java',
        atpRequirements: { software: true, hardware: true }
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('audit logs require authentication', async () => {
    const res = await request(server)
      .get('/api/v1/audit/logs');

    expect(res.status).toBe(401);
    expect(res.body.error).toContain('Unauthorized');
  });

  test('creating a user with auth writes an audit log', async () => {
    const email = `rbac.audit.${Date.now()}@apms.com`;
    const createRes = await request(server)
      .post('/api/v1/users/create')
      .set('Authorization', `Bearer ${token}`)
      .send({
        email,
        username: `rbac_${Date.now()}`,
        name: 'RBAC Audit User',
        userType: 'INTERNAL',
        status: 'ACTIVE'
      });

    expect(createRes.status).toBe(200);
    expect(createRes.body.success).toBe(true);

    const auditRes = await request(server)
      .get('/api/v1/audit/logs?resource=user')
      .set('Authorization', `Bearer ${token}`);

    expect(auditRes.status).toBe(200);
    const logs = auditRes.body.data || [];
    const logForUser = logs.find((log) => log.resource_id === createRes.body.data.id);
    expect(logForUser).toBeDefined();
  });
});
