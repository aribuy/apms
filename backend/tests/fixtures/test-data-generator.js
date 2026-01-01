/**
 * Test Data Generator
 * Generates unique test data with cleanup tags for enterprise-grade testing
 *
 * Pattern: AUTO-YYYYMMDD-RANDOM
 * Ensures:
 * - No duplicate test data conflicts
 * - Easy identification of test data
 * - Simple cleanup mechanisms
 */

/**
 * Generate unique test site ID
 * Pattern: AUTO-YYYYMMDD-XXXXXX (6 random chars)
 *
 * @returns {string} Unique site ID
 */
function generateTestSiteId() {
  const date = new Date().toISOString().split('T')[0].replace(/-/g, '');
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `AUTO-${date}-${random}`;
}

/**
 * Generate unique cleanup tag
 * Pattern: TEST-XXXXXXXXXXXX
 *
 * @returns {string} Unique cleanup tag
 */
function generateCleanupTag() {
  return `TEST-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
}

/**
 * Generate valid test site data
 *
 * @param {Object} overrides - Override default values
 * @returns {Object} Test site data
 */
function generateTestSiteData(overrides = {}) {
  const testId = generateTestSiteId();
  const cleanupTag = generateCleanupTag();

  const defaults = {
    customerSiteId: testId,
    customerSiteName: `E2E Test Site ${testId}`,
    neTowerId: `NE-TWR-${testId}`,
    neTowerName: `NE Tower ${testId}`,
    feTowerId: `FE-TWR-${testId}`,
    feTowerName: `FE Tower ${testId}`,
    neLatitude: -7.2575,
    neLongitude: 112.7521,
    feLatitude: -7.2675,
    feLongitude: 112.7621,
    region: 'East Java',
    coverageArea: 'Urban',
    activityFlow: 'MW Upgrade',
    sowCategory: 'Deployment',
    projectCode: `PRJ-${testId}`,
    frequencyBand: '18GHz',
    linkCapacity: '512Mbps',
    antennaSize: '0.6m',
    equipmentType: 'AVIAT',
    atpRequirements: {
      software: true,
      hardware: true
    },
    metadata: {
      isTestData: true,
      cleanupTag: cleanupTag,
      createdAt: new Date().toISOString()
    }
  };

  return { ...defaults, ...overrides };
}

/**
 * Generate test user data
 *
 * @param {string} role - User role
 * @returns {Object} Test user data
 */
function generateTestUser(role = 'regular_user') {
  const timestamp = Date.now();
  return {
    email: `test.${role}.${timestamp}@apms-test.com`,
    username: `test_${role}_${timestamp}`,
    name: `Test ${role.replace('_', ' ')}`,
    role: role,
    status: 'ACTIVE',
    metadata: {
      isTestData: true,
      createdAt: new Date().toISOString()
    }
  };
}

/**
 * Generate idempotency key
 *
 * @param {string} operation - Operation type (e.g., 'register', 'upload')
 * @returns {string} Idempotency key
 */
function generateIdempotencyKey(operation = 'test') {
  return `test-${operation}-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
}

/**
 * Generate batch test sites
 *
 * @param {number} count - Number of sites to generate
 * @returns {Array} Array of test site data
 */
function generateBatchSiteData(count = 5) {
  const sites = [];
  for (let i = 0; i < count; i++) {
    sites.push(generateTestSiteData());
  }
  return sites;
}

/**
 * Cleanup test data by tag
 *
 * @param {Object} prisma - Prisma client
 * @param {string} cleanupTag - Cleanup tag
 * @returns {Promise<Object>} Cleanup results
 */
async function cleanupTestData(prisma, cleanupTag) {
  const results = {
    sites: 0,
    tasks: 0,
    documents: 0
  };

  try {
    // Delete tasks associated with test sites
    const tasks = await prisma.task.deleteMany({
      where: {
        taskCode: { contains: 'AUTO-' }
      }
    });
    results.tasks = tasks.count;

    // Delete test sites
    const sites = await prisma.site.deleteMany({
      where: {
        siteId: { startsWith: 'AUTO-' }
      }
    });
    results.sites = sites.count;

    // Delete test documents (if exists)
    try {
      const documents = await prisma.documents.deleteMany({
        where: {
          OR: [
            { documentNumber: { startsWith: 'AUTO-' } },
            { title: { contains: 'E2E Test Site' } }
          ]
        }
      });
      results.documents = documents.count;
    } catch (err) {
      // Document table might not exist
      console.log('Document cleanup skipped (table may not exist)');
    }

    console.log(`[TestData] Cleaned up: ${results.sites} sites, ${results.tasks} tasks, ${results.documents} documents`);
  } catch (error) {
    console.error('[TestData] Cleanup error:', error);
  }

  return results;
}

/**
 * Validate test data was created correctly
 *
 * @param {Object} response - API response
 * @param {string} testId - Test site ID
 * @returns {boolean} Validation result
 */
function validateTestData(response, testId) {
  if (!response.data) {
    console.error('[TestData] No data in response');
    return false;
  }

  if (!response.data.site) {
    console.error('[TestData] No site in response data');
    return false;
  }

  if (!response.data.atpTasks) {
    console.error('[TestData] No atpTasks in response data');
    return false;
  }

  return true;
}

module.exports = {
  generateTestSiteId,
  generateCleanupTag,
  generateTestSiteData,
  generateTestUser,
  generateIdempotencyKey,
  generateBatchSiteData,
  cleanupTestData,
  validateTestData
};
