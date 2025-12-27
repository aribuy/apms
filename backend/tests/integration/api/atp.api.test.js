// Integration Tests for ATP API
const request = require('supertest');
const { createAuthenticatedUser } = require('../helpers/auth.helper');
const { createTestSite } = require('../helpers/site.factory');
const { createTestATP, createTestATPWithStatus } = require('../helpers/atp.factory');
const { cleanupAllTestData } = require('../helpers/db.helper');

describe('ATP API Integration Tests', () => {
  let app;
  let adminUser;
  let vendorUser;
  let boUser;
  let testSite;
  let testATP;

  beforeAll(async () => {
    app = require('../../src/app');
    await cleanupAllTestData();
  });

  beforeEach(async () => {
    adminUser = await createAuthenticatedUser(prisma, 'Administrator');
    vendorUser = await createAuthenticatedUser(prisma, 'VENDOR');
    boUser = await createAuthenticatedUser(prisma, 'BO');
    testSite = await createTestSite();
    testATP = await createTestATP(testSite.id);
  });

  afterEach(async () => {
    await cleanupAllTestData();
  });

  afterAll(async () => {
    await cleanupAllTestData();
  });

  describe('GET /api/v1/atp', () => {
    it('should return all ATP documents for admin', async () => {
      const response = await request(app)
        .get('/api/v1/atp')
        .set('Authorization', `Bearer ${adminUser.token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should filter by status', async () => {
      const response = await request(app)
        .get('/api/v1/atp?status=pending_review')
        .set('Authorization', `Bearer ${adminUser.token}`);

      expect(response.status).toBe(200);
      response.body.data.forEach(atp => {
        expect(atp.status).toBe('pending_review');
      });
    });

    it('should filter by ATP type', async () => {
      const response = await request(app)
        .get('/api/v1/atp?type=SOFTWARE')
        .set('Authorization', `Bearer ${adminUser.token}`);

      expect(response.status).toBe(200);
      response.body.data.forEach(atp => {
        expect(atp.atp_type).toBe('SOFTWARE');
      });
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get('/api/v1/atp?page=1&limit=10')
        .set('Authorization', `Bearer ${adminUser.token}`);

      expect(response.status).toBe(200);
      expect(response.body.data.pagination).toBeDefined();
    });
  });

  describe('POST /api/v1/atp/upload-analyze', () => {
    it('should upload and analyze ATP document', async () => {
      const response = await request(app)
        .post('/api/v1/atp/upload-analyze')
        .set('Authorization', `Bearer ${vendorUser.token}`)
        .field('site_id', testSite.id)
        .attach('file', Buffer.from('test pdf content'), 'test-atp.pdf');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.category).toBeDefined();
      expect(response.body.data.confidence).toBeDefined();
    });

    it('should reject upload without file', async () => {
      const response = await request(app)
        .post('/api/v1/atp/upload-analyze')
        .set('Authorization', `Bearer ${vendorUser.token}`)
        .field('site_id', testSite.id);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should validate file type', async () => {
      const response = await request(app)
        .post('/api/v1/atp/upload-analyze')
        .set('Authorization', `Bearer ${vendorUser.token}`)
        .field('site_id', testSite.id)
        .attach('file', Buffer.from('invalid content'), 'test.txt');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/atp/submit', () => {
    it('should submit ATP for review', async () => {
      const atpData = {
        site_id: testSite.id,
        atp_type: 'SOFTWARE',
        file_path: '/test/path/atp.pdf',
        file_size: 1024000
      };

      const response = await request(app)
        .post('/api/v1/atp/submit')
        .set('Authorization', `Bearer ${vendorUser.token}`)
        .send(atpData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('pending_review');
    });

    it('should initialize workflow stages', async () => {
      const atpData = {
        site_id: testSite.id,
        atp_type: 'SOFTWARE'
      };

      const response = await request(app)
        .post('/api/v1/atp/submit')
        .set('Authorization', `Bearer ${vendorUser.token}`)
        .send(atpData);

      expect(response.status).toBe(201);
      expect(response.body.data.review_stages).toBeDefined();
      expect(response.body.data.review_stages.length).toBe(3); // BO, SME, HEAD_NOC
    });
  });

  describe('GET /api/v1/atp/reviews/pending', () => {
    it('should return pending reviews for BO role', async () => {
      const response = await request(app)
        .get('/api/v1/atp/reviews/pending?role=BO')
        .set('Authorization', `Bearer ${boUser.token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should filter by role', async () => {
      const softwareATP = await createTestATP(testSite.id, { atp_type: 'SOFTWARE' });
      const hardwareATP = await createTestATP(testSite.id, { atp_type: 'HARDWARE' });

      const response = await request(app)
        .get('/api/v1/atp/reviews/pending?role=BO')
        .set('Authorization', `Bearer ${boUser.token}`);

      expect(response.status).toBe(200);
      response.body.data.forEach(atp => {
        expect(atp.atp_type).toMatch(/SOFTWARE|COMBINED/);
      });
    });
  });

  describe('POST /api/v1/atp/:atpId/review', () => {
    it('should approve ATP and move to next stage', async () => {
      const reviewData = {
        decision: 'APPROVE',
        comments: 'Approved for testing'
      };

      const response = await request(app)
        .post(`/api/v1/atp/${testATP.id}/review`)
        .set('Authorization', `Bearer ${boUser.token}`)
        .send(reviewData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.current_stage).toBeDefined();
    });

    it('should reject ATP with reason', async () => {
      const reviewData = {
        decision: 'REJECT',
        comments: 'Incomplete documentation',
        rejection_reason: 'Missing site diagram'
      };

      const response = await request(app)
        .post(`/api/v1/atp/${testATP.id}/review`)
        .set('Authorization', `Bearer ${boUser.token}`)
        .send(reviewData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('rejected');
    });

    it('should create punchlist items on APPROVE_WITH_PUNCHLIST', async () => {
      const reviewData = {
        decision: 'APPROVE_WITH_PUNCHLIST',
        comments: 'Minor issues to fix',
        punchlist_items: [
          {
            item_number: 'PL-001',
            description: 'Update configuration',
            severity: 'MINOR'
          }
        ]
      };

      const response = await request(app)
        .post(`/api/v1/atp/${testATP.id}/review`)
        .set('Authorization', `Bearer ${boUser.token}`)
        .send(reviewData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.punchlist_items).toBeDefined();
      expect(response.body.data.punchlist_items.length).toBeGreaterThan(0);
    });
  });

  describe('GET /api/v1/atp/:atpId/workflow-status', () => {
    it('should return workflow status', async () => {
      const response = await request(app)
        .get(`/api/v1/atp/${testATP.id}/workflow-status`)
        .set('Authorization', `Bearer ${adminUser.token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.stages).toBeDefined();
      expect(response.body.data.progress).toBeDefined();
    });

    it('should show all review stages', async () => {
      const response = await request(app)
        .get(`/api/v1/atp/${testATP.id}/workflow-status`)
        .set('Authorization', `Bearer ${adminUser.token}`);

      expect(response.body.data.stages.length).toBe(3); // BO, SME, HEAD_NOC
      response.body.data.stages.forEach(stage => {
        expect(stage).toHaveProperty('stage_name');
        expect(stage).toHaveProperty('status');
        expect(stage).toHaveProperty('sla_deadline');
      });
    });
  });

  describe('POST /api/v1/atp/:atpId/quick-approve', () => {
    it('should quick approve ATP (testing only)', async () => {
      const response = await request(app)
        .post(`/api/v1/atp/${testATP.id}/quick-approve`)
        .set('Authorization', `Bearer ${adminUser.token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('approved');
    });

    it('should approve all stages', async () => {
      const response = await request(app)
        .post(`/api/v1/atp/${testATP.id}/quick-approve`)
        .set('Authorization', `Bearer ${adminUser.token}`);

      const workflow = await request(app)
        .get(`/api/v1/atp/${testATP.id}/workflow-status`)
        .set('Authorization', `Bearer ${adminUser.token}`);

      workflow.body.data.stages.forEach(stage => {
        expect(stage.status).toBe('APPROVED');
      });
    });
  });
});
