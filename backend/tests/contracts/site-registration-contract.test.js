// Contract Tests: Site Registration API
// Purpose: Ensure API responses match expected structure
// Critical: Prevent "site created but ATP missing" scenarios

require('../helpers/test-env');

const request = require('supertest');
const { PrismaClient } = require('@prisma/client');
const { createTestServer, closeTestServer } = require('../helpers/test-server');
const { ensureDocControllerUser } = require('../helpers/test-users');
const {
  generateTestSiteData,
  generateIdempotencyKey,
  cleanupTestData
} = require('../fixtures/test-data-generator');

describe('Contract Tests: Site Registration API', () => {
  let app;
  let server;
  let prisma;

  beforeAll(async () => {
    app = require('../../server');
    server = await createTestServer(app);
    prisma = new PrismaClient();
    await ensureDocControllerUser(prisma);
  });

  afterAll(async () => {
    await closeTestServer(server);
    await prisma.$disconnect();
  });

  afterEach(async () => {
    // Cleanup test data after each test
    await cleanupTestData(prisma, null);
  });

  describe('POST /api/v1/site-registration/register - Contract Validation', () => {

    test('must return success: true in response', async () => {
      const siteData = generateTestSiteData();

      const res = await request(server)
        .post('/api/v1/site-registration/register')
        .send(siteData);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    test('must create site object with all required fields', async () => {
      const siteData = generateTestSiteData();

      const res = await request(server)
        .post('/api/v1/site-registration/register')
        .send(siteData);

      expect(res.body.data).toBeDefined();
      expect(res.body.data.site).toBeDefined();

      // CRITICAL: Site must have ID
      expect(res.body.data.site.id).toBeDefined();
      expect(typeof res.body.data.site.id).toBe('string');

      // CRITICAL: Site must have siteId
      expect(res.body.data.site.siteId).toBe(siteData.customerSiteId);

      // CRITICAL: Site must have status
      expect(res.body.data.site.status).toBeDefined();
      expect(res.body.data.site.status).toMatch(/ACTIVE|PENDING/);

      // CRITICAL: Coordinates must be present
      expect(res.body.data.site.neLatitude).toBeDefined();
      expect(res.body.data.site.neLongitude).toBeDefined();
      expect(res.body.data.site.feLatitude).toBeDefined();
      expect(res.body.data.site.feLongitude).toBeDefined();

      // CRITICAL: Region must be present
      expect(res.body.data.site.region).toBe(siteData.region);
    });

    test('must create atpTasks array with all required fields', async () => {
      const siteData = generateTestSiteData({
        atpRequirements: { software: true, hardware: true }
      });

      const res = await request(server)
        .post('/api/v1/site-registration/register')
        .send(siteData);

      // CRITICAL: atpTasks must be an array
      expect(res.body.data.atpTasks).toBeDefined();
      expect(Array.isArray(res.body.data.atpTasks)).toBe(true);

      // CRITICAL: Must create 2 tasks (SW + HW)
      expect(res.body.data.atpTasks.length).toBe(2);

      // Validate Software ATP Task
      const swTask = res.body.data.atpTasks.find(t => t.taskType === 'ATP_SOFTWARE');
      expect(swTask).toBeDefined();

      // CRITICAL: Task must have ID
      expect(swTask.id).toBeDefined();
      expect(typeof swTask.id).toBe('string');

      // CRITICAL: Task must have task_code
      expect(swTask.taskCode).toBeDefined();
      expect(swTask.taskCode).toMatch(/^ATP-SW-/);

      // CRITICAL: Task must have siteId (foreign key)
      expect(swTask.siteId).toBe(res.body.data.site.id);

      // CRITICAL: Task must have status
      expect(swTask.status).toBe('pending');

      // CRITICAL: Task must be assigned
      expect(swTask.assignedTo).toBeDefined();
      expect(swTask.assignedTo).toBe(res.body.data.assignedController);

      // CRITICAL: Task must have due date
      expect(swTask.dueDate).toBeDefined();

      // Validate Hardware ATP Task
      const hwTask = res.body.data.atpTasks.find(t => t.taskType === 'ATP_HARDWARE');
      expect(hwTask).toBeDefined();
      expect(hwTask.id).toBeDefined();
      expect(hwTask.taskCode).toMatch(/^ATP-HW-/);
      expect(hwTask.siteId).toBe(res.body.data.site.id);
      expect(hwTask.status).toBe('pending');
    });

    test('must create only Software ATP if only software required', async () => {
      const siteData = generateTestSiteData({
        atpRequirements: { software: true, hardware: false }
      });

      const res = await request(server)
        .post('/api/v1/site-registration/register')
        .send(siteData);

      expect(res.body.data.atpTasks).toHaveLength(1);
      expect(res.body.data.atpTasks[0].taskType).toBe('ATP_SOFTWARE');
    });

    test('must create only Hardware ATP if only hardware required', async () => {
      const siteData = generateTestSiteData({
        atpRequirements: { software: false, hardware: true }
      });

      const res = await request(server)
        .post('/api/v1/site-registration/register')
        .send(siteData);

      expect(res.body.data.atpTasks).toHaveLength(1);
      expect(res.body.data.atpTasks[0].taskType).toBe('ATP_HARDWARE');
    });

    test('must assign to correct regional Doc Controller', async () => {
      const regions = ['East Java', 'Central Java', 'West Java', 'Jabodetabek'];

      for (const region of regions) {
        const siteData = generateTestSiteData({ region });

        const res = await request(server)
          .post('/api/v1/site-registration/register')
          .send(siteData);

        const tasks = res.body.data.atpTasks;
        tasks.forEach(task => {
          expect(task.assignedTo).toBe(res.body.data.assignedController);
        });
      }
    });

    test('must return error for invalid coordinates', async () => {
      const siteData = generateTestSiteData({
        neLatitude: 50, // Outside Indonesia
        neLongitude: 50,
        feLatitude: 51,
        feLongitude: 51
      });

      const res = await request(server)
        .post('/api/v1/site-registration/register')
        .send(siteData);

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Coordinates must be within Indonesia bounds');
    });

    test('must return error for missing required fields', async () => {
      const res = await request(server)
        .post('/api/v1/site-registration/register')
        .send({
          customerSiteId: 'TEST-INVALID'
          // Missing customerSiteName
          // Missing coordinates
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });

    test('must create tasks with correct task_code pattern', async () => {
      const siteData = generateTestSiteData();

      const res = await request(server)
        .post('/api/v1/site-registration/register')
        .send(siteData);

      const swTask = res.body.data.atpTasks.find(t => t.taskType === 'ATP_SOFTWARE');
      const hwTask = res.body.data.atpTasks.find(t => t.taskType === 'ATP_HARDWARE');

      // CRITICAL: Task code must follow pattern
      expect(swTask.taskCode).toMatch(/^ATP-SW-.*-001$/);
      expect(hwTask.taskCode).toMatch(/^ATP-HW-.*-001$/);
    });

    test('must persist data to database', async () => {
      const siteData = generateTestSiteData();

      const res = await request(server)
        .post('/api/v1/site-registration/register')
        .send(siteData);

      const siteId = res.body.data.site.id;

      // Verify site exists in database
      const dbSite = await prisma.site.findUnique({
        where: { id: siteId }
      });

      expect(dbSite).toBeDefined();
      expect(dbSite.siteId).toBe(siteData.customerSiteId);

      // Verify tasks exist in database
      const dbTasks = await prisma.task.findMany({
        where: { siteId }
      });

      expect(dbTasks.length).toBe(2);
    });
  });

  describe('Contract: Response Time & Performance', () => {

    test('must respond within 2 seconds', async () => {
      const siteData = generateTestSiteData();

      const startTime = Date.now();

      const res = await request(server)
        .post('/api/v1/site-registration/register')
        .send(siteData);

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(res.status).toBe(200);
      expect(duration).toBeLessThan(2000);
    });
  });

  describe('Contract: Error Responses', () => {

    test('must return 400 for duplicate site ID', async () => {
      const siteData = generateTestSiteData();

      // First registration
      await request(server)
        .post('/api/v1/site-registration/register')
        .send(siteData);

      // Second registration with same ID
      const res = await request(server)
        .post('/api/v1/site-registration/register')
        .send(siteData);

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('already exists');
    });

    test('must return descriptive error message', async () => {
      const res = await request(server)
        .post('/api/v1/site-registration/register')
        .send({
          customerSiteId: 'TEST-INVALID'
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
      expect(typeof res.body.error).toBe('string');
      expect(res.body.error.length).toBeGreaterThan(0);
    });
  });
});
