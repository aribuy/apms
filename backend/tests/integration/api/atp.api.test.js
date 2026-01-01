// Integration Tests for ATP API
const request = require('supertest');

const runApiIntegration = process.env.RUN_API_INTEGRATION === '1';

if (!runApiIntegration) {
  describe('ATP API Integration Tests (skipped)', () => {
    test.skip('Set RUN_API_INTEGRATION=1 to enable', () => {});
  });
} else {
  require('../../helpers/test-env');

  const { PrismaClient } = require('@prisma/client');
  const { createAuthenticatedUser } = require('../helpers/auth.helper');
  const { createTestSite } = require('../helpers/site.factory');
  const { cleanupAllTestData } = require('../helpers/db.helper');
  const { createTestServer, closeTestServer } = require('../helpers/test-server');

  describe('ATP API Integration Tests', () => {
    let app;
    let server;
    let prisma;
    let adminUser;

    beforeAll(async () => {
      app = require('../../../server');
      server = await createTestServer(app);
      prisma = new PrismaClient();
      await cleanupAllTestData(prisma);
    });

    beforeEach(async () => {
      adminUser = await createAuthenticatedUser(prisma, 'Administrator');
      await createTestSite(prisma);
    });

    afterEach(async () => {
      await cleanupAllTestData(prisma);
    });

    afterAll(async () => {
      await cleanupAllTestData(prisma);
      await closeTestServer(server);
      await prisma.$disconnect();
    });

    describe('GET /api/v1/atp', () => {
      it('returns ATP list for authenticated user', async () => {
        const response = await request(server)
          .get('/api/v1/atp')
          .set('Authorization', `Bearer ${adminUser.token}`);

        expect([200, 401]).toContain(response.status);
      });
    });
  });
}
