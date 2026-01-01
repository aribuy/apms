# 🎯 CRITICAL RULES CHECKLIST - APMS Testing

**Purpose**: Enterprise-grade testing requirements
**Focus**: Business-critical rules that MUST be tested
**Status**: Mandatory for production readiness

---

## 📋 CRITICAL RULES OVERVIEW

### Priority Levels

**P0 - BLOCKER** (MUST pass, blocks deployment)
- Auto-ATP creation contract tests
- Idempotency (double submit prevention)
- RBAC 3-layer validation
- Audit logging completeness

**P1 - CRITICAL** (Must pass, degrades functionality)
- Approval chain state machine
- Test data cleanup
- Out-of-order approval prevention

**P2 - IMPORTANT** (Should pass, affects quality)
- Evidence pack generation
- Flaky test prevention
- Performance budgets

---

## 🔴 RULE 1: CONTRACT TESTS - Auto-ATP Creation

### Critical Contract: Site Registration → Auto ATP

**API Contract**:
```javascript
POST /api/v1/site-registration/register

REQUEST:
{
  customerSiteId: string,
  customerSiteName: string,
  neTowerId: string,
  neTowerName: string,
  feTowerId: string,
  feTowerName: string,
  neLatitude: number,
  neLongitude: number,
  feLatitude: number,
  feLongitude: number,
  region: string,
  atpRequirements: {
    software: boolean,
    hardware: boolean
  }
}

RESPONSE (200 OK):
{
  success: true,
  data: {
    site: {
      id: string,                    // ✅ REQUIRED
      customer_site_id: string,      // ✅ REQUIRED
      status: string,                 // ✅ REQUIRED
      created_at: string
    },
    atpTasks: [                      // ✅ REQUIRED (array, can be empty)
    {
      id: string,                    // ✅ REQUIRED
      atp_request_id: string,        // ✅ REQUIRED
      task_code: string,             // ✅ REQUIRED
      task_type: string,             // ✅ REQUIRED (ATP_SOFTWARE | ATP_HARDWARE)
      atp_status: string,            // ✅ REQUIRED (pending)
      site_registration_id: string,  // ✅ REQUIRED (foreign key)
      assignedTo: string,
      dueDate: string
    }
  ],
  assignedController: string
  }
}
```

### Contract Tests

```javascript
// backend/tests/contracts/site-registration-contract.test.js

describe('Contract Tests: Site Registration → Auto ATP', () => {

  describe('POST /api/v1/site-registration/register - Contract', () => {

    test('must return site object with required fields', async () => {
      const res = await request(app)
        .post('/api/v1/site-registration/register')
        .send(validSiteData);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // Verify site object structure
      expect(res.body.data.site).toBeDefined();
      expect(res.body.data.site.id).toBeDefined();
      expect(res.body.data.site.id).toMatch(/^[a-z0-9-]+$/); // UUID format
      expect(res.body.data.site.customer_site_id).toBe(validSiteData.customerSiteId);
      expect(res.body.data.site.status).toBe('active');
      expect(res.body.data.site.created_at).toBeDefined();
    });

    test('must create atpTasks array with all required fields', async () => {
      const res = await request(app)
        .post('/api/v1/site-registration/register')
        .send({
          ...validSiteData,
          atpRequirements: { software: true, hardware: true }
        });

      expect(res.body.data.atpTasks).toBeDefined();
      expect(Array.isArray(res.body.data.atpTasks)).toBe(true);
      expect(res.body.data.atpTasks.length).toBe(2);

      // Verify Software ATP structure
      const swTask = res.body.data.atpTasks.find(t => t.task_type === 'ATP_SOFTWARE');
      expect(swTask).toBeDefined();
      expect(swTask.id).toBeDefined();
      expect(swTask.atp_request_id).toBeDefined();
      expect(swTask.task_code).toMatch(/^ATP-SW-/);
      expect(swTask.atp_status).toBe('pending');
      expect(swTask.site_registration_id).toBe(res.body.data.site.id);
      expect(swTask.assignedTo).toBeDefined();
      expect(swTask.dueDate).toBeDefined();

      // Verify Hardware ATP structure
      const hwTask = res.body.data.atpTasks.find(t => t.task_type === 'ATP_HARDWARE');
      expect(hwTask).toBeDefined();
      expect(hwTask.id).toBeDefined();
      expect(hwTask.atp_request_id).toBeDefined();
      expect(hwTask.task_code).toMatch(/^ATP-HW-/);
      expect(hwTask.atp_status).toBe('pending');
      expect(hwTask.site_registration_id).toBe(res.body.data.site.id);
    });

    test('must create NO tasks when ATP not required', async () => {
      const res = await request(app)
        .post('/api/v1/site-registration/register')
        .send({
          ...validSiteData,
          atpRequirements: { software: false, hardware: false }
        });

      expect(res.body.data.atpTasks).toBeDefined();
      expect(res.body.data.atpTasks.length).toBe(0);
    });

    test('must reject when required fields missing', async () => {
      const res = await request(app)
        .post('/api/v1/site-registration/register')
        .send({
          // Missing customerSiteId
          customerSiteName: 'Test'
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });
  });

  describe('GET /atp/:id - Contract Verification', () => {

    test('must return ATP with site_registration relation', async () => {
      // First, register a site
      const registerRes = await request(app)
        .post('/api/v1/site-registration/register')
        .send(validSiteData);

      const siteId = registerRes.body.data.site.id;
      const atpTask = registerRes.body.data.atpTasks[0];

      // Query ATP by ID
      const res = await request(app)
        .get(`/api/v1/atp/${atpTask.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toBeDefined();
      expect(res.body.data.id).toBe(atpTask.id);
      expect(res.body.data.site_registration_id).toBe(siteId); // ✅ RELATION VERIFIED
      expect(res.body.data.task_code).toBe(atpTask.task_code);
      expect(res.body.data.atp_status).toBe(atpTask.atp_status);
    });

    test('must return 404 for non-existent ATP', async () => {
      const res = await request(app)
        .get('/api/v1/atp/nonexistent-id')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(404);
    });
  });

  describe('Critical Scenario: Site Created but ATP Missing', () => {

    test('ensures ATP tasks are ALWAYS created when required', async () => {
      const siteId = `TEST-MISSING-ATP-${Date.now()}`;

      const res = await request(app)
        .post('/api/v1/site-registration/register')
        .send({
          customerSiteId: siteId,
          customerSiteName: 'ATP Missing Test',
          neTowerId: 'NE-001',
          neTowerName: 'NE',
          feTowerId: 'FE-001',
          feTowerName: 'FE',
          neLatitude: -7.2575,
          neLongitude: 112.7521,
          feLatitude: -7.2675,
          feLongitude: 112.7621,
          region: 'East Java',
          atpRequirements: { software: true, hardware: true }
        });

      // CRITICAL CHECK: ATP tasks MUST exist
      expect(res.body.data.atpTasks).toBeDefined();
      expect(res.body.data.atpTasks.length).toBeGreaterThanOrEqual(1);

      // Verify in database
      const dbCheck = await prisma.tasks.findMany({
        where: {
          sites: { customer_site_id: siteId }
        }
      });

      expect(dbCheck.length).toBeGreaterThanOrEqual(1);
    });

    test('detects orphaned sites (site exists but no ATP)', async () => {
      // This test should FAIL if bug exists
      // Run as separate scheduled check

      const orphanedSites = await prisma.site_registrations.findMany({
        where: {
          status: 'active',
          atpRequirements: {
            OR: [
              { software: true },
              { hardware: true }
            ]
          }
        },
        include: {
          tasks: true
        }
      });

      const orphaned = orphanedSites.filter(site => {
        const hasRequiredTasks = site.tasks?.length > 0;
        const needsTasks = site.atpRequirements?.software || site.atpRequirements?.hardware;
        return needsTasks && !hasRequiredTasks;
      });

      if (orphaned.length > 0) {
        console.error('CRITICAL BUG: Sites without ATP tasks found:', orphaned);
      }

      expect(orphaned.length).toBe(0);
    });
  });

  describe('Critical Scenario: ATP Exists but Site Missing', () => {

    test('detects orphaned ATPs (ATP exists but site missing)', async () => {
      const orphanedATP = await prisma.tasks.findMany({
        where: {
          task_type: {
            in: ['ATP_SOFTWARE', 'ATP_HARDWARE']
          },
          OR: [
            { sites: null },
            { sites: { is: null } }
          ]
        },
        include: {
          sites: true
        }
      });

      const trulyOrphaned = orphanedATP.filter(task => !task.sites);

      if (trulyOrphaned.length > 0) {
        console.error('CRITICAL BUG: ATP tasks without sites found:', trulyOrphaned);
      }

      expect(trulyOrphaned.length).toBe(0);
    });
  });
});
```

---

## 🔴 RULE 2: IDEMPOTENCY - Double Submit Prevention

### Implementation

```javascript
// backend/src/middleware/idempotency.js

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Store processed requests for 2 minutes
const processedRequests = new Map();
const REQUEST_TTL = 120000; // 2 minutes

// Cleanup old entries
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of processedRequests.entries()) {
    if (now - value.timestamp > REQUEST_TTL) {
      processedRequests.delete(key);
    }
  }
}, 60000); // Cleanup every minute

/**
 * Idempotency middleware
 * Prevents duplicate processing of identical requests
 */
const idempotencyCheck = (req, res, next) => {
  const idempotencyKey = req.headers['idempotency-key'] ||
                           req.headers['x-request-id'] ||
                           req.body.client_request_id;

  if (!idempotencyKey) {
    return next(); // No idempotency key, proceed normally
  }

  // Check if request already processed
  const cached = processedRequests.get(idempotencyKey);

  if (cached) {
    console.log('Idempotency: Duplicate request detected, returning cached response');
    return res.json(cached.response);
  }

  // Store request before processing
  res.on('finish', () => {
    // Only cache successful responses
    if (res.statusCode >= 200 && res.statusCode < 300) {
      processedRequests.set(idempotencyKey, {
        response: res.body,
        timestamp: Date.now()
      });
    }
  });

  next();
};

module.exports = idempotencyCheck;
```

### Contract Test

```javascript
// backend/tests/contracts/idempotency-contract.test.js

describe('Contract Tests: Idempotency', () => {

  describe('POST /api/v1/site-registration/register - Idempotency', () => {

    test('prevents duplicate site registration with same idempotency key', async () => {
      const siteData = {
        customerSiteId: `TEST-IDEMPOTENT-${Date.now()}`,
        customerSiteName: 'Idempotency Test',
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

      const idempotencyKey = `test-key-${Date.now()}`;

      // First request
      const res1 = await request(app)
        .post('/api/v1/site-registration/register')
        .set('Idempotency-Key', idempotencyKey)
        .send(siteData);

      expect(res1.status).toBe(200);
      expect(res1.body.success).toBe(true);
      const siteId1 = res1.body.data.site.id;
      const atpTaskIds1 = res1.body.data.atpTasks.map(t => t.id);

      // Second request with SAME key (within 2 seconds)
      const res2 = await request(app)
        .post('/api/v1/site-registration/register')
        .set('Idempotency-Key', idempotencyKey)
        .send(siteData);

      expect(res2.status).toBe(200);
      expect(res2.body.success).toBe(true);

      // CRITICAL: Must return SAME site and ATP IDs (not create duplicates)
      const siteId2 = res2.body.data.site.id;
      const atpTaskIds2 = res2.body.data.atpTasks.map(t => t.id);

      expect(siteId2).toBe(siteId1); // Same site ID
      expect(atpTaskIds2).toEqual(atpTaskIds1); // Same ATP task IDs

      // Verify only 1 site and 2 ATP tasks in database
      const sites = await prisma.site_registrations.findMany({
        where: { customer_site_id: siteData.customerSiteId }
      });
      expect(sites.length).toBe(1); // NOT 2!

      const tasks = await prisma.tasks.findMany({
        where: {
          sites: { customer_site_id: siteData.customerSiteId }
        }
      });
      expect(tasks.length).toBe(2); // NOT 4!
    });

    test('allows different requests with different idempotency keys', async () => {
      const siteData = {
        customerSiteId: `TEST-IDEMPOTENT-DIFF-${Date.now()}`,
        customerSiteName: 'Idempotency Test 2',
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

      const key1 = `test-key-1-${Date.now()}`;
      const key2 = `test-key-2-${Date.now()}`;

      // First request with key1
      const res1 = await request(app)
        .post('/api/v1/site-registration/register')
        .set('Idempotency-Key', key1)
        .send(siteData);

      // Second request with key2 (different, should create NEW site)
      const res2 = await request(app)
        .post('/api/v1/site-registration/register')
        .set('Idempotency-Key', key2)
        .send(siteData);

      expect(res2.status).toBe(400); // Should fail due to duplicate site ID
      expect(res2.body.error).toContain('Site ID already exists');
    });

    test('handles rapid double submit (within 2 seconds)', async () => {
      const siteData = {
        customerSiteId: `TEST-RAPID-${Date.now()}`,
        customerSiteName: 'Rapid Submit Test',
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

      const idempotencyKey = `test-rapid-${Date.now()}`;

      // Send two requests simultaneously (simulating double submit)
      const [res1, res2] = await Promise.all([
        request(app)
          .post('/api/v1/site-registration/register')
          .set('Idempotency-Key', idempotencyKey)
          .send(siteData),
        request(app)
          .post('/api/v1/site-registration/register')
          .set('Idempotency-Key', idempotencyKey)
          .send(siteData)
      ]);

      // Both should succeed, but return SAME data
      expect([res1.status, res2.status]).toEqual([200, 200]);
      expect(res1.body.data.site.id).toBe(res2.body.data.site.id);

      // Verify only 1 site created
      const sites = await prisma.site_registrations.findMany({
        where: { customer_site_id: siteData.customerSiteId }
      });
      expect(sites.length).toBe(1);
    });
  });

  describe('Idempotency Key Generation', () => {

    test('accepts idempotency-key header', async () => {
      const res = await request(app)
        .post('/api/v1/site-registration/register')
        .set('Idempotency-Key', `test-${Date.now()}`)
        .send(validSiteData);

      expect(res.status).toBe(200);
    });

    test('accepts x-request-id header as fallback', async () => {
      const res = await request(app)
        .post('/api/v1/site-registration/register')
        .set('X-Request-Id', `test-${Date.now()}`)
        .send(validSiteData);

      expect(res.status).toBe(200);
    });

    test('accepts client_request_id in body as fallback', async () => {
      const res = await request(app)
        .post('/api/v1/site-registration/register')
        .send({
          ...validSiteData,
          client_request_id: `test-${Date.now()}`
        });

      expect(res.status).toBe(200);
    });
  });
});
```

---

## 🔴 RULE 3: TEST DATA STRATEGY - Unique + Cleanup

### Test Data Pattern

```javascript
// backend/tests/fixtures/test-data-generator.js

/**
 * Generate unique test data
 * Pattern: AUTO-YYYYMMDD-RANDOM
 */
function generateTestSiteId() {
  const date = new Date().toISOString().split('T')[0].replace(/-/g, '');
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `AUTO-${date}-${random}`;
}

/**
 * Generate test data with cleanup tags
 */
function generateTestData() {
  const testId = generateTestSiteId();
  const cleanupTag = `TEST-${Date.now()}`;

  return {
    customerSiteId: testId,
    customerSiteName: `E2E Test Site ${testId}`,
    neTowerId: `NE-${testId}`,
    neTowerName: `NE Tower ${testId}`,
    feTowerId: `FE-${testId}`,
    feTowerName: `FE Tower ${testId}`,
    neLatitude: -7.2575,
    neLongitude: 112.7521,
    feLatitude: -7.2675,
    feLongitude: 112.7621,
    region: 'East Java',
    atpRequirements: { software: true, hardware: true },
    metadata: {
      isTestData: true,
      cleanupTag: cleanupTag,
      createdAt: new Date().toISOString()
    }
  };
}

/**
 * Cleanup test data via API
 */
async function cleanupTestData(cleanupTag) {
  // Option 1: Call admin cleanup API
  await request(app)
    .delete('/api/v1/admin/test-data/cleanup')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ cleanupTag });

  // Option 2: Direct database cleanup
  await prisma.site_registrations.deleteMany({
    where: {
      metadata: {
        path: ['cleanupTag'],
        equals: cleanupTag
      }
    }
  });

  await prisma.tasks.deleteMany({
    where: {
      task_code: {
        startsWith: 'AUTO-'
      }
    }
  });
}

module.exports = { generateTestSiteId, generateTestData, cleanupTestData };
```

### Test Suite with Cleanup

```javascript
// backend/tests/integration/site-registration-with-cleanup.test.js

const { generateTestData, cleanupTestData } = require('../fixtures/test-data-generator');

describe('Site Registration with Test Data Cleanup', () => {
  let testDataSet = [];
  const cleanupTag = `TEST-${Date.now()}`;

  // Generate unique test data
  beforeEach(() => {
    for (let i = 0; i < 5; i++) {
      testDataSet.push(generateTestData());
    }
  });

  // Cleanup after all tests
  afterAll(async () => {
    await cleanupTestData(cleanupTag);
  });

  test('each test uses unique site ID', async () => {
    const siteIds = testDataSet.map(data => data.customerSiteId);
    const uniqueIds = new Set(siteIds);

    expect(uniqueIds.size).toBe(siteIds.length);
  });

  test('duplicate site test uses existing site', async () => {
    // Create first site
    await request(app)
      .post('/api/v1/site-registration/register')
      .send(testDataSet[0]);

    // Attempt to create duplicate (should fail)
    const res = await request(app)
      .post('/api/v1/site-registration/register')
      .send(testDataSet[0]);

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('Site ID already exists');
  });

  test('cleanup removes all test data', async () => {
    // Create test sites
    for (const data of testDataSet) {
      await request(app)
        .post('/api/v1/site-registration/register')
        .send(data);
    }

    // Cleanup
    await cleanupTestData(cleanupTag);

    // Verify cleanup
    const remaining = await prisma.site_registrations.findMany({
      where: {
        metadata: {
          path: ['cleanupTag'],
          equals: cleanupTag
        }
      }
    });

    expect(remaining.length).toBe(0);
  });
});
```

---

## 🔴 RULE 4: RBAC - 3 LAYER VALIDATION

### Architecture

```
┌─────────────────────────────────────────────────────────┐
│                  RBAC PROTECTION LAYERS                  │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Layer 1: UI Visibility (Client-Side)                   │
│  - Menu items hidden/disabled based on role            │
│  - Buttons not rendered if no permission                │
│  - Routes blocked in router guard                       │
│                                                         │
│  Layer 2: Route Guard (Server-Side Router)              │
│  - Middleware checks before rendering page             │
│  - Direct URL access blocked                           │
│  - Redirect to 403 if unauthorized                     │
│                                                         │
│  Layer 3: API Authorization (Server-Side Endpoint)      │
│  - Middleware verifies permissions before action        │
│  - Returns 403 if unauthorized                         │
│  - Enforced at controller/service level                  │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Contract Tests

```javascript
// backend/tests/contracts/rbac-3layer.test.js

describe('RBAC: 3-Layer Validation', () => {

  const endpoints = {
    adminOnly: [
      { method: 'GET', path: '/api/v1/admin/users' },
      { method: 'DELETE', path: '/api/v1/admin/test-data/cleanup' }
    ],
    approverOnly: [
      { method: 'GET', path: '/api/v1/approvals/pending' },
      { method: 'POST', path: '/api/v1/site-registration/:id/approve' },
      { method: 'POST', path: '/api/v1/site-registration/:id/reject' }
    ],
    requesterOnly: [
      { method: 'POST', path: '/api/v1/site-registration/register' },
      { method: 'POST', path: '/api/v1/atp/upload' }
    ]
  };

  describe('Layer 1: UI Visibility', () => {

    test('admin users see admin menu items', async () => {
      // This would be a UI test (TagUI)
      // Verifying menu items are rendered

      // API equivalent: Check user permissions endpoint
      const res = await request(app)
        .get('/api/v1/user/permissions')
        .set('Authorization', `Bearer ${tokens.admin}`);

      expect(res.status).toBe(200);
      expect(res.body.data.permissions).toContain('admin:access');
    });

    test('regular users DO NOT see admin menu items', async () => {
      const res = await request(app)
        .get('/api/v1/user/permissions')
        .set('Authorization', `Bearer ${tokens.regular_user}`);

      expect(res.status).toBe(200);
      expect(res.body.data.permissions).not.toContain('admin:access');
    });
  });

  describe('Layer 2: Route Guard (Direct URL Access)', () => {

    test('blocks direct URL access to admin pages for regular user', async () => {
      // Simulate direct navigation to admin page
      const res = await request(app)
        .get('/admin/users')
        .set('Authorization', `Bearer ${tokens.regular_user}`);

      expect(res.status).toBe(403);
      expect(res.body.error).toContain('Unauthorized');
    });

    test('blocks direct URL access to approvals for regular user', async () => {
      const res = await request(app)
        .get('/approvals/pending')
        .set('Authorization', `Bearer ${tokens.regular_user}`);

      expect(res.status).toBe(403);
    });

    test('allows direct URL access for authorized users', async () => {
      const res = await request(app)
        .get('/approvals/pending')
        .set('Authorization', `Bearer ${tokens.l1_approver}`);

      expect(res.status).toBe(200);
    });
  });

  describe('Layer 3: API Authorization (Critical)', () => {

    test('Layer 3: POST /api/v1/site-registration/:id/approve', async () => {
      const siteId = 'TEST-SITE-001';

      // Regular user tries to approve (should FAIL at Layer 3)
      const res = await request(app)
        .post(`/api/v1/site-registration/${siteId}/approve`)
        .set('Authorization', `Bearer ${tokens.regular_user}`)
        .send({ comment: 'Trying to approve' });

      // CRITICAL: Must return 403 at API level
      expect(res.status).toBe(403);
      expect(res.body.error).toBeDefined();

      // Verify approval was NOT created in database
      const approval = await prisma.approvals.findFirst({
        where: {
          site_registration_id: siteId,
          commenter_id: tokens.regular_user_id
        }
      });

      expect(approval).toBeNull();
    });

    test('Layer 3: L1 approver CAN approve', async () => {
      const siteId = 'TEST-SITE-002';

      const res = await request(app)
        .post(`/api/v1/site-registration/${siteId}/approve`)
        .set('Authorization', `Bearer ${tokens.l1_approver}`)
        .send({ comment: 'L1 Approved' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // Verify approval was created in database
      const approval = await prisma.approvals.findFirst({
        where: {
          site_registration_id: siteId,
          commenter_id: tokens.l1_approver_id
        }
      });

      expect(approval).toBeDefined();
    });

    test('UI-only RBAC is illusion - must enforce at API level', async () => {
      // This test ensures that even if UI is bypassed, API blocks unauthorized access

      const endpoints = [
        '/api/v1/admin/users',
        '/api/v1/approvals/pending',
        '/api/v1/site-registration/TEST-001/approve'
      ];

      for (const endpoint of endpoints) {
        const res = await request(app)
          .post(endpoint)
          .set('Authorization', `Bearer ${tokens.regular_user}`);

        // CRITICAL: All must return 403
        expect([403, 401]).toContain(res.status);
      }
    });
  });

  describe('Negative Test: RBAC Bypass Attempts', () => {

    test('cannot access admin endpoints without admin role', async () => {
      const adminEndpoints = [
        'GET /api/v1/admin/users',
        'POST /api/v1/admin/users',
        'DELETE /api/v1/admin/users/123'
      ];

      for (const endpoint of adminEndpoints) {
        const [method, path] = endpoint.split(' ');

        const res = await request(app)
          [method.toLowerCase()](path)
          .set('Authorization', `Bearer ${tokens.regular_user}`);

        expect(res.status).toBe(403);
      }
    });

    test('cannot modify other users\' tasks', async () => {
      const taskId = 'some-task-id';

      const res = await request(app)
        .put(`/api/v1/tasks/${taskId}`)
        .set('Authorization', `Bearer ${tokens.regular_user}`)
        .send({ status: 'completed' });

      expect(res.status).toBe(403);
    });

    test('cannot view audit logs without admin role', async () => {
      const res = await request(app)
        .get('/api/v1/audit-logs')
        .set('Authorization', `Bearer ${tokens.regular_user}`);

      expect(res.status).toBe(403);
    });
  });
});
```

### TagUI Test for Layer 1 (UI Visibility)

```tagui
// ui-tests/workflows/rbac-ui-visibility.tagua

echo "=== RBAC Layer 1: UI Visibility Tests ==="

// Test as Regular User
site https://apms.datacodesolution.com
type username // regular_user@test.com
type password // Test@1234
click "Login"
wait 5s

// Check that admin menus are NOT visible
if "Admin" or "admin" exists
    echo "❌ FAIL: Admin menu visible to regular user (UI RBAC breach!)"
    snap("page")
else
    echo "✅ PASS: Admin menu hidden from regular user"
end

// Check that approver menu is NOT visible
if "My Approvals" or "Approvals" exists
    echo "❌ FAIL: Approver menu visible to regular user (UI RBAC breach!)"
    snap("page")
else
    echo "✅ PASS: Approver menu hidden from regular user"
end

// Check that user CAN see their own menus
if "Task Management" exists
    echo "✅ PASS: Task Management menu visible"
else
    echo "❌ FAIL: Required menu missing"
end

// Logout
click "Logout"
wait 3s

// Test as Approver
type username // l1_approver@test.com
type password // Test@1234
click "Login"
wait 5s

// Check that approver CAN see approvals menu
if "My Approvals" exists
    echo "✅ PASS: Approver menu visible to approver"
else
    echo "❌ FAIL: Approver menu missing for approver"
end

echo "=== Layer 1 Tests Complete ==="
```

---

## 🔴 RULE 5: APPROVAL CHAIN STATE MACHINE

### State Transitions

```
┌──────────────────────────────────────────────────────┐
│              APPROVAL WORKFLOW STATES                 │
└──────────────────────────────────────────────────────┘

PENDING → L1_PENDING → L2_PENDING → COMPLETED
   ↓           ↓           ↓
   ↓       (can reject at any point)
   ↓           ↓           ↓
REJECTED ← REJECTED ← REJECTED
```

### Contract Tests

```javascript
// backend/tests/contracts/approval-state-machine.test.js

describe('Contract Tests: Approval State Machine', () => {

  describe('State Transitions', () => {

    test('prevents out-of-order approval (L2 before L1)', async () => {
      const siteId = `TEST-OUTOFORDER-${Date.now()}`;

      // Register site
      await request(app)
        .post('/api/v1/site-registration/register')
        .set('Authorization', `Bearer ${tokens.requester}`)
        .send({
          customerSiteId: siteId,
          customerSiteName: 'Out of Order Test',
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

      // Try to approve with L2 BEFORE L1 (should fail)
      const res = await request(app)
        .post(`/api/v1/site-registration/${siteId}/approve`)
        .set('Authorization', `Bearer ${tokens.l2_approver}`)
        .send({ comment: 'Trying L2 before L1' });

      // CRITICAL: Must reject out-of-order approval
      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Cannot approve: L1 approval required first');

      // Verify site still in PENDING or L1_PENDING state
      const site = await prisma.site_registrations.findFirst({
        where: { customer_site_id: siteId }
      });

      expect(site.status).not.toBe('approved');
      expect(site.approval_level).not.toBe(2);
    });

    test('prevents replay approval (duplicate approval)', async () => {
      const siteId = `TEST-REPLAY-${Date.now()}`;

      // Register and L1 approve
      await request(app)
        .post('/api/v1/site-registration/register')
        .set('Authorization', `Bearer ${tokens.requester}`)
        .send({
          customerSiteId: siteId,
          customerSiteName: 'Replay Test',
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

      // L1 Approve
      const res1 = await request(app)
        .post(`/api/v1/site-registration/${siteId}/approve`)
        .set('Authorization', `Bearer ${tokens.l1_approver}`)
        .send({ comment: 'L1 Approved' });

      expect(res1.status).toBe(200);

      // Try to approve AGAIN with same L1 approver (replay)
      const res2 = await request(app)
        .post(`/api/v1/site-registration/${siteId}/approve`)
        .set('Authorization', `Bearer ${tokens.l1_approver}`)
        .send({ comment: 'Trying to approve again' });

      // CRITICAL: Must reject duplicate approval
      expect(res2.status).toBe(400);
      expect(res2.body.error).toContain('Already approved');

      // Verify only ONE approval record exists
      const approvals = await prisma.approvals.findMany({
        where: {
          site_registration_id: siteId,
          approver_id: tokens.l1_approver_id
        }
      });

      expect(approvals.length).toBe(1); // NOT 2!
    });

    test('enforces correct state progression', async () => {
      const siteId = `TEST-STATE-${Date.now()}`;

      // Register
      await request(app)
        .post('/api/v1/site-registration/register')
        .set('Authorization', `Bearer ${tokens.requester}`)
        .send({
          customerSiteId: siteId,
          customerSiteName: 'State Test',
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

      // Check initial state
      let site = await prisma.site_registrations.findFirst({
        where: { customer_site_id: siteId }
      });

      expect(site.status).toBe('pending');
      expect(site.approval_level).toBe(0);

      // L1 Approve
      await request(app)
        .post(`/api/v1/site-registration/${siteId}/approve`)
        .set('Authorization', `Bearer ${tokens.l1_approver}`)
        .send({ comment: 'L1 Approved' });

      site = await prisma.site_registrations.findFirst({
        where: { customer_site_id: siteId }
      });

      expect(site.status).toBe('l1_approved');
      expect(site.approval_level).toBe(1);

      // L2 Approve
      await request(app)
        .post(`/api/v1/site-registration/${siteId}/approve`)
        .set('Authorization', `Bearer ${tokens.l2_approver}`)
        .send({ comment: 'Final approval' });

      site = await prisma.site_registrations.findFirst({
        where: { customer_site_id: siteId }
      });

      expect(site.status).toBe('approved');
      expect(site.approval_level).toBe(2);
    });
  });

  describe('State Consistency', () => {

    test('returns consistent state after approval', async () => {
      const siteId = `TEST-CONSISTENCY-${Date.now()}`;

      await request(app)
        .post('/api/v1/site-registration/register')
        .set('Authorization', `Bearer ${tokens.requester}`)
        .send({
          customerSiteId: siteId,
          customerSiteName: 'Consistency Test',
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

      // Approve
      const res = await request(app)
        .post(`/api/v1/site-registration/${siteId}/approve`)
        .set('Authorization', `Bearer ${tokens.l1_approver}`)
        .send({ comment: 'L1 Approved' });

      // CRITICAL: Response must contain consistent state
      expect(res.body.data).toMatchObject({
        id: expect.any(String),
        customer_site_id: siteId,
        status: expect.stringMatching(/l1_approved|approved/),
        approval_level: expect.any(Number),
        current_approver: expect.any(String)
      });
    });

    test('maintains task queue after approval', async () => {
      const siteId = `TEST-TASKQUEUE-${Date.now()}`;

      await request(app)
        .post('/api/v1/site-registration/register')
        .set('Authorization', `Bearer ${tokens.requester}`)
        .send({
          customerSiteId: siteId,
          customerSiteName: 'Task Queue Test',
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

      const tasksBefore = await prisma.tasks.findMany({
        where: {
          sites: { customer_site_id: siteId }
        }
      });

      const taskIdsBefore = tasksBefore.map(t => t.id);

      // Approve
      await request(app)
        .post(`/api/v1/site-registration/${siteId}/approve`)
        .set('Authorization', `Bearer ${tokens.l1_approver}`)
        .send({ comment: 'L1 Approved' });

      // CRITICAL: Tasks should still exist (not deleted)
      const tasksAfter = await prisma.tasks.findMany({
        where: {
          id: { in: taskIdsBefore }
        }
      });

      expect(tasksAfter.length).toBe(tasksBefore.length);

      // Task statuses should be updated correctly
      tasksAfter.forEach(task => {
        expect(task.status).toMatch(/in_review|pending/);
      });
    });
  });

  describe('Audit Logging', () => {

    test('creates audit log for site registration', async () => {
      const siteId = `TEST-AUDIT-${Date.now()}`;

      await request(app)
        .post('/api/v1/site-registration/register')
        .set('Authorization', `Bearer ${tokens.requester}`)
        .send({
          customerSiteId: siteId,
          customerSiteName: 'Audit Test',
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

      // CRITICAL: Audit log MUST exist
      const auditLogs = await prisma.audit_logs.findMany({
        where: {
          entity_type: 'site_registration',
          entity_id: siteId,
          action: 'create'
        }
      });

      expect(auditLogs.length).toBeGreaterThan(0);

      const log = auditLogs[0];
      expect(log.user_id).toBeDefined();
      expect(log.action).toBe('create');
      expect(log.timestamp).toBeDefined();
      expect(log.old_value).toBeNull(); // Create action
      expect(log.new_value).toContain(siteId);
    });

    test('creates audit log for approval', async () => {
      const siteId = `TEST-AUDIT-APPROVE-${Date.now()}`;

      // Register
      await request(app)
        .post('/api/v1/site-registration/register')
        .set('Authorization', `Bearer ${tokens.requester}`)
        .send({
          customerSiteId: siteId,
          customerSiteName: 'Audit Approve Test',
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

      // Approve
      const res = await request(app)
        .post(`/api/v1/site-registration/${siteId}/approve`)
        .set('Authorization', `Bearer ${tokens.l1_approver}`)
        .send({ comment: 'L1 Approved' });

      // CRITICAL: Audit log MUST exist
      const auditLogs = await prisma.audit_logs.findMany({
        where: {
          entity_type: 'site_registration',
          entity_id: siteId,
          action: 'approve'
        }
      });

      expect(auditLogs.length).toBeGreaterThan(0);

      const log = auditLogs[0];
      expect(log.user_id).toBe(tokens.l1_approver_id);
      expect(log.action).toBe('approve');
      expect(log.changes).toContain('comment');
    });

    test('creates audit log for rejection', async () => {
      const siteId = `TEST-AUDIT-REJECT-${Date.now()}`;

      // Register
      await request(app)
        .post('/api/v1/site-registration/register')
        .set('Authorization', `Bearer ${tokens.requester}`)
        .send({
          customerSiteId: siteId,
          customerSiteName: 'Audit Reject Test',
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

      // Reject
      const res = await request(app)
        .post(`/api/v1/site-registration/${siteId}/reject`)
        .set('Authorization', `Bearer ${tokens.l1_approver}`)
        .send({ comment: 'Incomplete documentation' });

      // CRITICAL: Audit log MUST exist
      const auditLogs = await prisma.audit_logs.findMany({
        where: {
          entity_type: 'site_registration',
          entity_id: siteId,
          action: 'reject'
        }
      });

      expect(auditLogs.length).toBeGreaterThan(0);
    });
  });
});
```

---

## 🔴 RULE 6: REPORTING & EVIDENCE PACK

### Test Report Configuration

```javascript
// backend/jest.config.js

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'src/**/*.{js,ts}',
    '!src/migrations/**',
    '!src/tests/**'
  ],
  coverageReporters: [
    'text',
    'lcov',
    'html',
    'json-summary',
    'jest-junit'
  ],
  reporters: [
    'default',
    [
      'jest-junit',
      {
        outputDirectory: 'test-results',
        outputName: 'junit.xml'
      }
    ]
  ],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js']
};
```

### GitHub Actions Workflow

```yaml
# .github/workflows/test-report.yml

name: Test & Report

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v2

      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'

      - name: Install dependencies
        run: |
          cd backend
          npm ci

      - name: Run API tests
        run: |
          cd backend
          npm test -- --coverage --json

      - name: Generate coverage report
        run: |
          cd backend
          npm test -- --coverage --coverageReporters=json-summary

      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v2
        with:
          files: ./backend/coverage/*.json

      - name: Upload test results
        uses: actions/upload-artifact@v2
        if: always()
        with:
          name: test-results
          path: |
            backend/test-results/
            backend/coverage/

      - name: Publish test report
        if: always()
        uses: mikepenz/action-junit-report@v3
        with:
          check_name: API Tests Report
          report_paths: '**/test-results/*.xml'

      - name: Comment PR with results
        if: github.event_name == 'pull_request'
        uses: actions/github-script@v6
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
          script: |
            const fs = require('fs');
            const report = fs.readFileSync('backend/coverage/coverage-summary.json', 'utf8');
            const { total, covered, percentage } = JSON.parse(report);

            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.name,
              body: `## Test Results 📊

              **Coverage**: ${percentage}%
              - Total: ${total}
              - Covered: ${covered}

              ${percentage >= 80 ? '✅' : '❌'} Coverage ${percentage >= 80 ? 'meets' : 'below'} 80% threshold`
              `
            });
```

### TagUI Evidence Pack

```tagui
// ui-tests/config/evidence-pack.tagua

// Configuration for evidence pack generation
evidence_dir = "evidence/" + timestamp()
evidence_index = 1

function capture_evidence(test_name, status)
    screenshot_path = evidence_dir + test_name + "_" + evidence_index + ".png"
    snap(screenshot_path)
    echo "Evidence " + evidence_index + ": " + screenshot_path
    evidence_index = evidence_index + 1
end

// Test with evidence capture
echo "=== Capturing Evidence ==="

capture_evidence("01_login", "start")
// ... perform test
capture_evidence("01_login", "pass")

capture_evidence("02_register_site", "start")
// ... perform test
capture_evidence("02_register_site", "pass")

// Save evidence manifest
save_assertion(evidence_dir + "manifest.txt")
```

---

## 🔴 RULE 7: CRITICAL RULES CHECKLIST (No Coverage Numbers Games)

### Business Rules - MUST TEST ALL

```markdown
## Critical Rules Checklist

### P0 - BLOCKER (Blocks Production)

- [ ] **Auto-ATP Creation**
  - [ ] Contract test: Response contains site object with all required fields
  - [ ] Contract test: ATP tasks array always returned when required
  - [ ] Contract test: ATP has atp_request_id
  - [ ] Contract test: ATP has site_registration_id (foreign key)
  - [ ] Negative test: Detects "site created but ATP missing"
  - [ ] Negative test: Detects "ATP exists but site missing"

- [ ] **Idempotency**
  - [ ] Prevents duplicate site registration with same key
  - [ ] Returns same site ID on double submit
  - [ ] Returns same ATP task IDs on double submit
  - [ ] Only 1 site created even with rapid double submit
  - [ ] Test: Double submit within 2 seconds → 1 result

- [ ] **RBAC - Layer 3 (API Authorization)** ← CRITICAL
  - [ ] Regular user cannot approve (403 at API level)
  - [ ] Only approvers can call approve endpoint
  - [ ] Admin endpoints blocked for regular users (403)
  - [ ] Direct URL access blocked (403)
  - [ ] UI-only RBAC is NOT enough (must enforce at API)

- [ ] **Approval State Machine**
  - [ ] Out-of-order approval rejected (L2 before L1)
  - [ ] Replay approval rejected (duplicate approval)
  - [ ] State progression correct (pending → l1 → l2 → approved)
  - [ ] State consistent in response
  - [ ] Task queue maintained after approval

- [ ] **Audit Logging**
  - [ ] Audit log created for site registration
  - [ ] Audit log created for approval
  - [ ] Audit log created for rejection
  - [ ] Audit log contains user_id
  - [ ] Audit log contains timestamp
  - [ ] Audit log contains action/changes

### P1 - CRITICAL

- [ ] **Test Data Cleanup**
  - [ ] Site ID uses unique pattern (AUTO-YYYYMMDD-RANDOM)
  - [ ] All test data tagged for cleanup
  - [ ] Cleanup function works correctly
  - [ ] No test data pollution between runs
  - [ ] Duplicate site test uses existing data

- [ ] **Word to PDF Conversion**
  - [ ] Word documents accepted
  - [ ] Conversion successful
  - [ ] Original Word file deleted
  - [ ] Only PDF remains
  - [ ] Error handling works

- [ ] **Auto-Categorization**
  - [ ] Software ATP detected correctly
  - [ ] Hardware ATP detected correctly
  - [ ] Task type fallback works
  [ ] Confidence score calculated

- [ ] **Performance**
  - [ ] API response time < 2s (P95)
  - [ ] UI page load < 5s (P95)
  - [ ] Database queries optimized
  - [ ] No N+1 queries

### P2 - IMPORTANT

- [ ] **Evidence Pack**
  - [ ] JUnit XML generated
  - [ ] Coverage report generated
  - [ ] Screenshots captured per step
  [ ] HTML log generated
  - [ ] Artifacts saved 7-30 days

- [ ] **Flaky Test Prevention**
  - [ ] Test isolation (no dependencies)
  - [ ] Proper cleanup
  - [ ] No hardcoded waits
  - [ ] Retry logic for network calls
  - [ ] Flaky test rate < 5%
```

---

## 📊 SUMMARY

### What's Enhanced

1. ✅ **Contract Tests Added** - API contracts strictly defined and tested
2. ✅ **Idempotency Implemented** - Double submit prevention with tests
3. ✅ **Test Data Strategy** - Unique patterns + cleanup
4. ✅ **3-Layer RBAC** - UI + Route + API all tested
5. ✅ **State Machine Tests** - Approval chain validation
6. ✅ **Evidence Pack** - Automated reporting
7. ✅ **Critical Rules Focus** - Business rules over coverage numbers

### Files Created

1. [backend/tests/contracts/site-registration-contract.test.js](backend/tests/contracts/site-registration-contract.test.js)
2. [backend/tests/contracts/idempotency-contract.test.js](backend/tests/contracts/idempotency-contract.test.js)
3. [backend/tests/contracts/rbac-3layer.test.js](backend/tests/contracts/rbac-3layer.test.js)
4. [backend/tests/contracts/approval-state-machine.test.js](backend/tests/contracts/approval-state-machine.test.js)
5. [backend/src/middleware/idempotency.js](backend/src/middleware/idempotency.js)
6. [backend/tests/fixtures/test-data-generator.js](backend/tests/fixtures/test-data-generator.js)

---

**Status**: ✅ Enterprise-grade automation strategy complete!

Apakah enhancement ini sudah sesuai dengan standar enterprise yang Anda harapkan? 🚀
