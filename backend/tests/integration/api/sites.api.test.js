// Integration Tests for Sites API
const request = require('supertest');

const runApiIntegration = process.env.RUN_API_INTEGRATION === '1';

if (!runApiIntegration) {
  describe('Sites API Integration Tests (skipped)', () => {
    test.skip('Set RUN_API_INTEGRATION=1 to enable', () => {});
  });
} else {
  require('../../helpers/test-env');

  const { PrismaClient } = require('@prisma/client');
  const { createAuthenticatedUser } = require('../helpers/auth.helper');
  const { createTestSite, cleanupTestSites } = require('../helpers/site.factory');
  const { cleanupAllTestData } = require('../helpers/db.helper');
  const { createTestServer, closeTestServer } = require('../helpers/test-server');

  describe('Sites API Integration Tests', () => {
    let app;
    let server;
    let prisma;
    let adminUser;
    let testSite;

    beforeAll(async () => {
      app = require('../../../server');
      server = await createTestServer(app);
      prisma = new PrismaClient();
      await cleanupAllTestData(prisma);
    });

    beforeEach(async () => {
      adminUser = await createAuthenticatedUser(prisma, 'Administrator');
      testSite = await createTestSite(prisma);
    });

    afterEach(async () => {
      await cleanupTestSites(prisma);
      await cleanupAllTestData(prisma);
    });

    afterAll(async () => {
      await cleanupAllTestData(prisma);
      await closeTestServer(server);
      await prisma.$disconnect();
    });

    describe('GET /api/v1/sites', () => {
      it('should return all sites for authenticated user', async () => {
        const response = await request(server)
          .get('/api/v1/sites')
          .set('Authorization', `Bearer ${adminUser.token}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(Array.isArray(response.body.data)).toBe(true);
      });
    });
  });
}
