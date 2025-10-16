const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedRBACUsersOnly() {
  console.log('🌱 Seeding RBAC Users Only...\n');

  try {
    // Create Test Users with RBAC Roles
    const testUsers = [
      // Vendor Administration (Upload Only)
      { id: 'vendor-admin-001', email: 'vendor.admin@amps.com', username: 'vendor_admin', role: 'VENDOR_ADMIN', name: 'Admin Vendor' },
      { id: 'vendor-staff-001', email: 'vendor.staff@amps.com', username: 'vendor_staff', role: 'VENDOR_STAFF', name: 'Staff Vendor' },
      
      // Hardware Approval Workflow (Review Only)
      { id: 'fop-rts-001', email: 'field.engineer@amps.com', username: 'field_engineer', role: 'FOP_RTS', name: 'Ahmad Field' },
      { id: 'region-team-001', email: 'region.supervisor@amps.com', username: 'region_supervisor', role: 'REGION_TEAM', name: 'Siti Regional' },
      { id: 'rth-001', email: 'hardware.manager@amps.com', username: 'hardware_manager', role: 'RTH', name: 'Budi RTH' },
      
      // Software Approval Workflow (Review Only)
      { id: 'bo-001', email: 'business.ops@amps.com', username: 'business_ops', role: 'BO', name: 'Dewi BO' },
      { id: 'sme-001', email: 'technical.expert@amps.com', username: 'technical_expert', role: 'SME', name: 'Andi SME' },
      { id: 'noc-head-001', email: 'noc.head@amps.com', username: 'noc_head', role: 'HEAD_NOC', name: 'Rini NOC' }
    ];

    for (const user of testUsers) {
      await prisma.users.upsert({
        where: { email: user.email },
        update: { role: user.role },
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
      console.log(`✅ Created user: ${user.name} (${user.role})`);
    }

    console.log('\n🎉 RBAC Users Created Successfully!');
    console.log('\n📊 User Summary:');
    console.log('- 2 Vendor Users (Upload permissions)');
    console.log('- 3 Hardware Reviewers (FOP_RTS, REGION_TEAM, RTH)');
    console.log('- 3 Software Reviewers (BO, SME, HEAD_NOC)');

  } catch (error) {
    console.error('❌ RBAC user seeding failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedRBACUsersOnly();