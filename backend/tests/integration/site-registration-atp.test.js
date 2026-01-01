// API Integration Tests: Site Registration → Auto ATP Creation
// Coverage: Business logic, data validation, workflow automation

require('../helpers/test-env');

const request = require('supertest');
const { PrismaClient } = require('@prisma/client');
const { createTestServer, closeTestServer } = require('../helpers/test-server');
const { ensureDocControllerUser } = require('../helpers/test-users');

describe('Site Registration → Auto ATP Flow', () => {
  let app;
  let server;
  let prisma;

  beforeAll(async () => {
    // Setup test app
    app = require('../../server');
    server = await createTestServer(app);
    prisma = new PrismaClient();
    await ensureDocControllerUser(prisma);
  });

  afterAll(async () => {
    await closeTestServer(server);
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // Clean test data before each test
    await prisma.task.deleteMany({
      where: { taskCode: { contains: 'TEST-' } }
    });
    await prisma.site.deleteMany({
      where: { siteId: { startsWith: 'TEST-' } }
    });
  });

  describe('POST /api/v1/site-registration/register', () => {

    test('should create site and auto-generate 2 ATP tasks (SW + HW)', async () => {
      const siteData = {
        customerSiteId: `TEST-SITE-${Date.now()}`,
        customerSiteName: 'E2E Test Site',
        neTowerId: 'NE-TWR-001',
        neTowerName: 'NE Tower',
        feTowerId: 'FE-TWR-001',
        feTowerName: 'FE Tower',
        neLatitude: -7.2575,
        neLongitude: 112.7521,
        feLatitude: -7.2675,
        feLongitude: 112.7621,
        region: 'East Java',
        coverageArea: 'Urban',
        activityFlow: 'MW Upgrade',
        sowCategory: 'Deployment',
        projectCode: 'PRJ-001',
        frequencyBand: '18GHz',
        linkCapacity: '512Mbps',
        antennaSize: '0.6m',
        equipmentType: 'AVIAT',
        atpRequirements: {
          software: true,
          hardware: true
        }
      };

      const res = await request(server)
        .post('/api/v1/site-registration/register')
        .send(siteData);

      // Assertions
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.site).toBeDefined();
      expect(res.body.data.site.siteId).toBe(siteData.customerSiteId);
      expect(res.body.data.site.status).toBe('ACTIVE');

      // Verify ATP Tasks
      expect(res.body.data.atpTasks).toBeDefined();
      expect(res.body.data.atpTasks).toHaveLength(2);

      // Verify Software ATP
      const swTask = res.body.data.atpTasks.find(
        t => t.taskType === 'ATP_SOFTWARE'
      );
      expect(swTask).toBeDefined();
      expect(swTask.taskCode).toMatch(/^ATP-SW-TEST-SITE-\d+-001$/);
      expect(swTask.assignedTo).toBe(res.body.data.assignedController);
      expect(swTask.status).toBe('pending');
      expect(swTask.priority).toBe('high');

      // Verify Hardware ATP
      const hwTask = res.body.data.atpTasks.find(
        t => t.taskType === 'ATP_HARDWARE'
      );
      expect(hwTask).toBeDefined();
      expect(hwTask.taskCode).toMatch(/^ATP-HW-TEST-SITE-\d+-001$/);
      expect(hwTask.assignedTo).toBe(res.body.data.assignedController);
      expect(hwTask.status).toBe('pending');
      expect(hwTask.priority).toBe('high');
    });

    test('should auto-assign to correct regional Doc Controller', async () => {
      const regions = [
        { region: 'East Java' },
        { region: 'Central Java' },
        { region: 'West Java' },
        { region: 'Jabodetabek' }
      ];

      for (const { region } of regions) {
        const res = await request(server)
          .post('/api/v1/site-registration/register')
          .send({
            customerSiteId: `TEST-${region.replace(' ', '-')}-${Date.now()}`,
            customerSiteName: `${region} Test Site`,
            neTowerId: 'NE-001',
            neTowerName: 'NE Tower',
            feTowerId: 'FE-001',
            feTowerName: 'FE Tower',
            neLatitude: -7.2575,
            neLongitude: 112.7521,
            feLatitude: -7.2675,
            feLongitude: 112.7621,
            region,
            atpRequirements: { software: true, hardware: true }
          });

        const tasks = res.body.data.atpTasks;
        tasks.forEach(task => {
          expect(task.assignedTo).toBe(res.body.data.assignedController);
        });
      }
    });

    test('should only create Software ATP if only software required', async () => {
      const res = await request(server)
        .post('/api/v1/site-registration/register')
        .send({
          customerSiteId: `TEST-SW-ONLY-${Date.now()}`,
          customerSiteName: 'Software Only Test',
          neTowerId: 'NE-001',
          neTowerName: 'NE Tower',
          feTowerId: 'FE-001',
          feTowerName: 'FE Tower',
          neLatitude: -7.2575,
          neLongitude: 112.7521,
          feLatitude: -7.2675,
          feLongitude: 112.7621,
          region: 'East Java',
          atpRequirements: { software: true, hardware: false }
        });

      expect(res.body.data.atpTasks).toHaveLength(1);
      expect(res.body.data.atpTasks[0].taskType).toBe('ATP_SOFTWARE');
    });

    test('should only create Hardware ATP if only hardware required', async () => {
      const res = await request(server)
        .post('/api/v1/site-registration/register')
        .send({
          customerSiteId: `TEST-HW-ONLY-${Date.now()}`,
          customerSiteName: 'Hardware Only Test',
          neTowerId: 'NE-001',
          neTowerName: 'NE Tower',
          feTowerId: 'FE-001',
          feTowerName: 'FE Tower',
          neLatitude: -7.2575,
          neLongitude: 112.7521,
          feLatitude: -7.2675,
          feLongitude: 112.7621,
          region: 'East Java',
          atpRequirements: { software: false, hardware: true }
        });

      expect(res.body.data.atpTasks).toHaveLength(1);
      expect(res.body.data.atpTasks[0].taskType).toBe('ATP_HARDWARE');
    });

    test('should reject site with coordinates outside Indonesia bounds', async () => {
      const res = await request(server)
        .post('/api/v1/site-registration/register')
        .send({
          customerSiteId: `TEST-INVALID-${Date.now()}`,
          customerSiteName: 'Invalid Coordinates',
          neTowerId: 'NE-001',
          neTowerName: 'NE Tower',
          feTowerId: 'FE-001',
          feTowerName: 'FE Tower',
          neLatitude: 50, // Outside Indonesia
          neLongitude: 50,
          feLatitude: 51,
          feLongitude: 51,
          region: 'East Java',
          atpRequirements: { software: true, hardware: true }
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Coordinates must be within Indonesia bounds');
    });

    test('should reject duplicate site ID', async () => {
      const siteData = {
        customerSiteId: `TEST-DUPLICATE-${Date.now()}`,
        customerSiteName: 'Duplicate Test',
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
      };

      // First registration
      await request(server)
        .post('/api/v1/site-registration/register')
        .send(siteData);

      // Second registration with same ID
      const res = await request(server)
        .post('/api/v1/site-registration/register')
        .send(siteData);

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Site ID already exists');
    });

    test('should set due date to 7 days from registration', async () => {
      const res = await request(server)
        .post('/api/v1/site-registration/register')
        .send({
          customerSiteId: `TEST-DUEDATE-${Date.now()}`,
          customerSiteName: 'Due Date Test',
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

      const tasks = res.body.data.atpTasks;
      const now = Date.now();
      const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;

      tasks.forEach(task => {
        const dueDate = new Date(task.dueDate).getTime();
        const timeDiff = Math.abs(dueDate - now);
        // Allow 1 minute tolerance
        expect(timeDiff).toBeGreaterThan(sevenDaysMs - 60000);
        expect(timeDiff).toBeLessThan(sevenDaysMs + 60000);
      });
    });
  });

  describe('Task Management Integration', () => {

    test('created tasks should be queryable via Task API', async () => {
      const siteId = `TEST-QUERY-${Date.now()}`;

      // Register site
      await request(server)
        .post('/api/v1/site-registration/register')
        .send({
          customerSiteId: siteId,
          customerSiteName: 'Query Test',
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

      // Query tasks
      const tasksRes = await request(server)
        .get('/api/v1/tasks')
        .expect(200);

      const createdTasks = tasksRes.body.data?.filter(
        task => task.taskCode?.includes(siteId)
      ) || [];

      expect(createdTasks.length).toBeGreaterThanOrEqual(2);

      const swTask = createdTasks.find(t => t.taskType === 'ATP_SOFTWARE');
      const hwTask = createdTasks.find(t => t.taskType === 'ATP_HARDWARE');

      expect(swTask).toBeDefined();
      expect(hwTask).toBeDefined();
    });
  });
});
