const { PrismaClient } = require('@prisma/client');

async function testConnection() {
  const prisma = new PrismaClient();
  
  try {
    console.log('Testing database connection...');
    
    // Test basic connection
    await prisma.$connect();
    console.log('✅ Database connected successfully');
    
    // Get current counts
    const userCount = await prisma.user.count();
    const siteCount = await prisma.site.count();
    const docCount = await prisma.document.count();
    
    console.log(`Current data: ${userCount} users, ${siteCount} sites, ${docCount} documents`);
    
    // Add sample data if empty
    if (userCount === 0) {
      await prisma.user.create({
        data: {
          email: 'admin@telecore.com',
          username: 'admin',
          password: 'temp_password',
          firstName: 'System',
          lastName: 'Administrator',
          role: 'admin'
        }
      });
      console.log('✅ Sample admin user created');
    }
    
    if (siteCount === 0) {
      // Create sample sites
      const sites = await prisma.site.createMany({
        data: [
          { siteId: 'JKT0001', siteName: 'Jakarta Central Office', region: 'DKI Jakarta', city: 'Jakarta', status: 'ACTIVE' },
          { siteId: 'JKT0002', siteName: 'Jakarta North Tower', region: 'DKI Jakarta', city: 'Jakarta', status: 'ACTIVE' },
          { siteId: 'BDG0001', siteName: 'Bandung Main Site', region: 'West Java', city: 'Bandung', status: 'CONSTRUCTION' },
          { siteId: 'SBY0001', siteName: 'Surabaya Hub', region: 'East Java', city: 'Surabaya', status: 'PLANNING' }
        ]
      });
      console.log(`✅ Created ${sites.count} sample sites`);
    }
    
    // Add some activity logs
    await prisma.activityLog.create({
      data: {
        action: 'Database initialized',
        userName: 'System',
        details: 'Initial database setup completed'
      }
    });
    
    // Final counts
    const finalUserCount = await prisma.user.count();
    const finalSiteCount = await prisma.site.count();
    console.log(`Final counts: ${finalUserCount} users, ${finalSiteCount} sites`);
    
  } catch (error) {
    console.error('❌ Database error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();
