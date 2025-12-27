// Integration Tests for Sites API
const request = require('supertest');
const { createAuthenticatedUser } = require('../helpers/auth.helper');
const { createTestSite, cleanupTestSites } = require('../helpers/site.factory');
const { cleanupAllTestData } = require('../helpers/db.helper');

describe('Sites API Integration Tests', () => {
  let app;
  let adminUser;
  let testSite;

  beforeAll(async () => {
    app = require('../../src/app');
    await cleanupAllTestData();
  });

  beforeEach(async () => {
    adminUser = await createAuthenticatedUser(prisma, 'Administrator');
    testSite = await createTestSite();
  });

  afterEach(async () => {
    await cleanupAllTestData();
  });

  afterAll(async () => {
    await cleanupAllTestData();
  });

  describe('GET /api/v1/sites', () => {
    it('should return all sites for authenticated user', async () => {
      const response = await request(app)
        .get('/api/v1/sites')
        .set('Authorization', `Bearer ${adminUser.token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get('/api/v1/sites?page=1&limit=10')
        .set('Authorization', `Bearer ${adminUser.token}`);

      expect(response.status).toBe(200);
      expect(response.body.data.pagination).toBeDefined();
      expect(response.body.data.pagination.page).toBe(1);
      expect(response.body.data.pagination.limit).toBe(10);
    });

    it('should filter by status', async () => {
      const response = await request(app)
        .get('/api/v1/sites?status=Active')
        .set('Authorization', `Bearer ${adminUser.token}`);

      expect(response.status).toBe(200);
      response.body.data.forEach(site => {
        expect(site.status).toBe('Active');
      });
    });

    it('should reject unauthenticated request', async () => {
      const response = await request(app)
        .get('/api/v1/sites');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/sites/:id', () => {
    it('should return site by ID', async () => {
      const response = await request(app)
        .get(`/api/v1/sites/${testSite.id}`)
        .set('Authorization', `Bearer ${adminUser.token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(testSite.id);
      expect(response.body.data.site_code).toBe(testSite.site_code);
    });

    it('should return 404 for non-existent site', async () => {
      const response = await request(app)
        .get('/api/v1/sites/non-existent-id')
        .set('Authorization', `Bearer ${adminUser.token}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/sites', () => {
    it('should create new site with valid data', async () => {
      const newSite = {
        site_code: `TEST-${Date.now()}`,
        site_name: 'New Test Site',
        region: 'Jakarta',
        address: 'Test Address',
        latitude: -6.2088,
        longitude: 106.8456,
        site_type: 'Tower',
        status: 'Active'
      };

      const response = await request(app)
        .post('/api/v1/sites')
        .set('Authorization', `Bearer ${adminUser.token}`)
        .send(newSite);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.site_code).toBe(newSite.site_code);
      expect(response.body.data.site_name).toBe(newSite.site_name);
    });

    it('should reject duplicate site code', async () => {
      const duplicate = {
        site_code: testSite.site_code, // Duplicate
        site_name: 'Duplicate Site',
        region: 'Jakarta'
      };

      const response = await request(app)
        .post('/api/v1/sites')
        .set('Authorization', `Bearer ${adminUser.token}`)
        .send(duplicate);

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
    });

    it('should validate required fields', async () => {
      const invalidSite = {
        site_name: 'Invalid Site'
        // Missing required fields
      };

      const response = await request(app)
        .post('/api/v1/sites')
        .set('Authorization', `Bearer ${adminUser.token}`)
        .send(invalidSite);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/v1/sites/:id', () => {
    it('should update existing site', async () => {
      const updates = {
        site_name: 'Updated Site Name',
        status: 'Under Construction'
      };

      const response = await request(app)
        .put(`/api/v1/sites/${testSite.id}`)
        .set('Authorization', `Bearer ${adminUser.token}`)
        .send(updates);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.site_name).toBe(updates.site_name);
      expect(response.body.data.status).toBe(updates.status);
    });

    it('should reject update to duplicate site code', async () => {
      const otherSite = await createTestSite();

      const response = await request(app)
        .put(`/api/v1/sites/${testSite.id}`)
        .set('Authorization', `Bearer ${adminUser.token}`)
        .send({ site_code: otherSite.site_code });

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/v1/sites/:id', () => {
    it('should delete existing site', async () => {
      const response = await request(app)
        .delete(`/api/v1/sites/${testSite.id}`)
        .set('Authorization', `Bearer ${adminUser.token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should return 404 for non-existent site', async () => {
      const response = await request(app)
        .delete('/api/v1/sites/non-existent-id')
        .set('Authorization', `Bearer ${adminUser.token}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });
});
