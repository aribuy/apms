// Integration Tests for Authentication API
const request = require('supertest');

const runApiIntegration = process.env.RUN_API_INTEGRATION === '1';

if (!runApiIntegration) {
  describe('Authentication API Integration Tests (skipped)', () => {
    test.skip('Set RUN_API_INTEGRATION=1 to enable', () => {});
  });
} else {
  require('../../helpers/test-env');

  const { PrismaClient } = require('@prisma/client');
  const { createAuthenticatedUser } = require('../helpers/auth.helper');
  const { cleanupAllTestData } = require('../helpers/db.helper');
  const { createTestServer, closeTestServer } = require('../helpers/test-server');

  describe('Authentication API Integration Tests', () => {
    let app;
    let server;
    let prisma;
    let testUser;

    beforeAll(async () => {
      app = require('../../../server');
      server = await createTestServer(app);
      prisma = new PrismaClient();
      await cleanupAllTestData(prisma);
    });

    beforeEach(async () => {
      testUser = await createAuthenticatedUser(prisma, 'Administrator');
    });

    afterEach(async () => {
      await cleanupAllTestData(prisma);
    });

    afterAll(async () => {
      await cleanupAllTestData(prisma);
      await closeTestServer(server);
      await prisma.$disconnect();
    });

    describe('POST /api/v1/auth/login', () => {
      it('should login with valid credentials', async () => {
        const response = await request(server)
          .post('/api/v1/auth/login')
          .send({
            email: testUser.user.email,
            password: 'Test123!'
          });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.token).toBeDefined();
        expect(response.body.data.user.email).toBe(testUser.user.email);
      });

      it('should reject invalid credentials', async () => {
        const response = await request(server)
          .post('/api/v1/auth/login')
          .send({
            email: testUser.user.email,
            password: 'WrongPassword123!'
          });

        expect(response.status).toBe(401);
        expect(response.body.success).toBe(false);
      });

      it('should reject non-existent user', async () => {
        const response = await request(server)
          .post('/api/v1/auth/login')
          .send({
            email: 'nonexistent@apms.com',
            password: 'Test123!'
          });

        expect(response.status).toBe(401);
        expect(response.body.success).toBe(false);
      });

      it('should validate required fields', async () => {
        const response = await request(server)
          .post('/api/v1/auth/login')
          .send({
            email: testUser.user.email
          });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
      });
    });

    describe('POST /api/v1/auth/logout', () => {
      it('should logout authenticated user', async () => {
        const response = await request(server)
          .post('/api/v1/auth/logout')
          .send({ refreshToken: testUser.refreshToken });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.message).toContain('Logged out');
      });
    });
  });
}
