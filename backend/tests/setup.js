// Jest Test Setup
const { PrismaClient } = require('@prisma/client');

// Global test database client
global.prisma = new PrismaClient();

// Test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key-for-testing-only';
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL;

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Setup and teardown hooks
beforeAll(async () => {
  // Clean up test data before all tests
  await cleanupTestData();
});

afterAll(async () => {
  // Disconnect from database
  await global.prisma.$disconnect();
});

afterEach(async () => {
  // Clean up after each test if needed
  jest.clearAllMocks();
});

// Helper function to clean test data
async function cleanupTestData() {
  try {
    // Clean up in order of dependencies
    await global.prisma.audit_logs_enhanced.deleteMany({});
    await global.prisma.atp_punchlist_items.deleteMany({});
    await global.prisma.atp_checklist_items.deleteMany({});
    await global.prisma.atp_review_stages.deleteMany({});
    await global.prisma.atp_documents.deleteMany({
      where: {
        site_id: {
          startsWith: 'TEST-'
        }
      }
    });
    await global.prisma.tasks.deleteMany({
      where: {
        site_id: {
          startsWith: 'TEST-'
        }
      }
    });
    await global.prisma.sites.deleteMany({
      where: {
        site_code: {
          startsWith: 'TEST-'
        }
      }
    });
  } catch (error) {
    console.error('Error cleaning up test data:', error);
  }
}

// Helper to create test user
global.createTestUser = async (role = 'Administrator') => {
  const timestamp = Date.now();
  return await global.prisma.users.upsert({
    where: { email: `test-${role.toLowerCase()}-${timestamp}@apms.com` },
    update: {},
    create: {
      email: `test-${role.toLowerCase()}-${timestamp}@apms.com`,
      password: 'Test123!',
      name: `Test ${role}`,
      role: role,
      is_active: true
    }
  });
};

// Helper to create test site
global.createTestSite = async () => {
  const timestamp = Date.now();
  return await global.prisma.sites.create({
    data: {
      site_code: `TEST-${timestamp}`,
      site_name: `Test Site ${timestamp}`,
      region: 'Jakarta',
      address: `Test Address ${timestamp}`,
      latitude: -6.2088,
      longitude: 106.8456,
      site_type: 'Tower',
      status: 'Active',
      created_by: 'test-user'
    }
  });
};

// Helper to get auth token
global.getAuthToken = async (user) => {
  const jwt = require('jsonwebtoken');
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );
};
