const { PrismaClient } = require('@prisma/client');

async function testSites() {
  const prisma = new PrismaClient();
  
  try {
    console.log('Testing Prisma connection...');
    
    // Test connection
    await prisma.$connect();
    console.log('✅ Connected to database');
    
    // Check if sites table exists and has data
    const sites = await prisma.sites.findMany();
    console.log('Sites found:', sites.length);
    console.log('Sites data:', sites);
    
    // Try to create a test site
    const testSite = await prisma.sites.create({
      data: {
        site_id: 'TEST-001',
        site_name: 'Test Site',
        site_type: 'MW',
        region: 'Test Region',
        city: 'Test City',
        status: 'ACTIVE'
      }
    });
    console.log('✅ Test site created:', testSite.site_id);
    
    // Fetch again
    const allSites = await prisma.sites.findMany();
    console.log('Total sites after test:', allSites.length);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testSites();