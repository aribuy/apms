const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedCompleteTestUsers() {
  console.log('🌱 Creating Complete Test Users for Full Workflow...\n');

  try {
    const testUsers = [
      // Admin & Site Management
      { id: 'admin-001', email: 'admin@apms.com', username: 'admin', role: 'admin', name: 'System Admin' },
      { id: 'site-manager-001', email: 'site.manager@apms.com', username: 'site_manager', role: 'SITE_MANAGER', name: 'Site Manager' },
      
      // Vendor Administration (Upload ATP)
      { id: 'vendor-admin-001', email: 'vendor.admin@apms.com', username: 'vendor_admin', role: 'VENDOR_ADMIN', name: 'Vendor Admin' },
      { id: 'vendor-staff-001', email: 'vendor.staff@apms.com', username: 'vendor_staff', role: 'VENDOR_STAFF', name: 'Vendor Staff' },
      
      // MW Vendor (Upload MW ATP)
      { id: 'mw-vendor-001', email: 'mw.vendor@gmail.com', username: 'mw_vendor', role: 'VENDOR_MW', name: 'MW Vendor Engineer' },
      
      // Hardware ATP Approval Flow
      { id: 'fop-rts-001', email: 'field.engineer@apms.com', username: 'field_engineer', role: 'FOP_RTS', name: 'Ahmad Field Engineer' },
      { id: 'region-team-001', email: 'region.supervisor@apms.com', username: 'region_supervisor', role: 'REGION_TEAM', name: 'Siti Regional Supervisor' },
      { id: 'rth-001', email: 'hardware.manager@apms.com', username: 'hardware_manager', role: 'RTH', name: 'Budi Hardware Manager' },
      
      // Software ATP Approval Flow
      { id: 'bo-001', email: 'business.ops@apms.com', username: 'business_ops', role: 'BO', name: 'Dewi Business Operations' },
      { id: 'sme-001', email: 'technical.expert@apms.com', username: 'technical_expert', role: 'SME', name: 'Andi Technical Expert' },
      { id: 'noc-head-001', email: 'noc.head@apms.com', username: 'noc_head', role: 'HEAD_NOC', name: 'Rini NOC Head' }
    ];

    for (const user of testUsers) {
      await prisma.users.upsert({
        where: { email: user.email },
        update: { role: user.role, name: user.name },
        create: {
          id: user.id,
          email: user.email,
          username: user.username,
          role: user.role,
          name: user.name,
          password_hash: 'test123',
          isActive: true,
          status: 'ACTIVE',
          created_at: new Date(),
          updated_at: new Date()
        }
      });
      console.log(`✅ ${user.name} (${user.role}) - ${user.email}`);
    }

    console.log('\n🎉 Complete Test Users Created!');
    console.log('\n📋 Test Workflow Users:');
    console.log('1. Site Registration: admin@apms.com, site.manager@apms.com');
    console.log('2. ATP Upload: vendor.admin@apms.com, vendor.staff@apms.com');
    console.log('3. Hardware Review: field.engineer@apms.com → region.supervisor@apms.com → hardware.manager@apms.com');
    console.log('4. Software Review: business.ops@apms.com → technical.expert@apms.com → noc.head@apms.com');

  } catch (error) {
    console.error('❌ User creation failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedCompleteTestUsers();