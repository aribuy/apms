// Site Factory - Generate test sites
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/**
 * Create test site
 */
const createTestSite = async (overrides = {}) => {
  const timestamp = Date.now();
  const data = {
    site_code: `TEST-${timestamp}`,
    site_name: `Test Site ${timestamp}`,
    region: 'Jakarta',
    address: `Jl. Test No. ${timestamp}`,
    latitude: -6.2088,
    longitude: 106.8456,
    site_type: 'Tower',
    status: 'Active',
    created_by: 'test-user',
    ...overrides
  };

  return await prisma.sites.create({ data });
};

/**
 * Create test sites in bulk
 */
const createTestSites = async (count = 5, overrides = {}) => {
  const sites = [];
  for (let i = 0; i < count; i++) {
    const site = await createTestSite({
      ...overrides,
      site_code: `TEST-${Date.now()}-${i}`,
      site_name: `Test Site ${Date.now()}-${i}`
    });
    sites.push(site);
  }
  return sites;
};

/**
 * Clean test sites
 */
const cleanupTestSites = async () => {
  await prisma.sites.deleteMany({
    where: {
      site_code: {
        startsWith: 'TEST-'
      }
    }
  });
};

module.exports = {
  createTestSite,
  createTestSites,
  cleanupTestSites
};
