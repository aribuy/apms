const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedEATPRBACTest() {
  console.log('🌱 Seeding EATP RBAC Test Data...\n');

  try {
    // 1. Create Test Users with RBAC Roles
    const testUsers = [
      // Vendor Administration (Upload Only)
      { id: 'vendor-admin-001', email: 'vendor.admin@telecore.com', username: 'vendor_admin', role: 'VENDOR_ADMIN', name: 'Admin Vendor' },
      { id: 'vendor-staff-001', email: 'vendor.staff@telecore.com', username: 'vendor_staff', role: 'VENDOR_STAFF', name: 'Staff Vendor' },
      
      // Hardware Approval Workflow (Review Only)
      { id: 'fop-rts-001', email: 'field.engineer@telecore.com', username: 'field_engineer', role: 'FOP_RTS', name: 'Ahmad Field' },
      { id: 'region-team-001', email: 'region.supervisor@telecore.com', username: 'region_supervisor', role: 'REGION_TEAM', name: 'Siti Regional' },
      { id: 'rth-001', email: 'hardware.manager@telecore.com', username: 'hardware_manager', role: 'RTH', name: 'Budi RTH' },
      
      // Software Approval Workflow (Review Only)
      { id: 'bo-001', email: 'business.ops@telecore.com', username: 'business_ops', role: 'BO', name: 'Dewi BO' },
      { id: 'sme-001', email: 'technical.expert@telecore.com', username: 'technical_expert', role: 'SME', name: 'Andi SME' },
      { id: 'noc-head-001', email: 'noc.head@telecore.com', username: 'noc_head', role: 'HEAD_NOC', name: 'Rini NOC' }
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
    }
    console.log('✅ RBAC Test users created');

    // 2. Create Multi-Region Test Sites
    const testSites = [
      // Jakarta Region
      { site_id: 'JKT-001-TOWER', site_name: 'Jakarta Tower Site 001', region: 'Jakarta', site_type: 'TOWER' },
      { site_id: 'JKT-002-OFFICE', site_name: 'Jakarta Office Site 002', region: 'Jakarta', site_type: 'OFFICE' },
      { site_id: 'JKT-003-HYBRID', site_name: 'Jakarta Hybrid Site 003', region: 'Jakarta', site_type: 'HYBRID' },
      
      // Surabaya Region  
      { site_id: 'SBY-001-REMOTE', site_name: 'Surabaya Remote Site 001', region: 'Surabaya', site_type: 'REMOTE' },
      { site_id: 'SBY-002-DATACENTER', site_name: 'Surabaya Data Center 002', region: 'Surabaya', site_type: 'DATACENTER' },
      
      // Bandung Region
      { site_id: 'BDG-001-TOWER', site_name: 'Bandung Tower Site 001', region: 'Bandung', site_type: 'TOWER' },
      { site_id: 'BDG-002-OFFICE', site_name: 'Bandung Office Site 002', region: 'Bandung', site_type: 'OFFICE' }
    ];

    for (const site of testSites) {
      await prisma.sites.upsert({
        where: { site_id: site.site_id },
        update: {},
        create: {
          id: `site-${site.site_id.toLowerCase()}`,
          site_id: site.site_id,
          site_name: site.site_name,
          site_type: site.site_type,
          region: site.region,
          province: site.region === 'Jakarta' ? 'DKI Jakarta' : 
                   site.region === 'Surabaya' ? 'Jawa Timur' : 'Jawa Barat',
          city: site.region,
          status: 'ACTIVE',
          created_at: new Date(),
          updated_at: new Date()
        }
      });
    }
    console.log('✅ Multi-region test sites created');

    // 3. Create Test ATP Documents by Vendor Admin
    const testATPs = [
      // Hardware ATPs
      { site_id: 'JKT-001-TOWER', category: 'hardware', uploaded_by: 'VENDOR_ADMIN', scenario: 'normal_flow' },
      { site_id: 'SBY-001-REMOTE', category: 'hardware', uploaded_by: 'VENDOR_STAFF', scenario: 'with_punchlist' },
      { site_id: 'BDG-001-TOWER', category: 'hardware', uploaded_by: 'VENDOR_ADMIN', scenario: 'rejection' },
      
      // Software ATPs
      { site_id: 'JKT-002-OFFICE', category: 'software', uploaded_by: 'VENDOR_ADMIN', scenario: 'normal_flow' },
      { site_id: 'SBY-002-DATACENTER', category: 'software', uploaded_by: 'VENDOR_STAFF', scenario: 'with_punchlist' },
      { site_id: 'BDG-002-OFFICE', category: 'software', uploaded_by: 'VENDOR_ADMIN', scenario: 'multi_reviewer' }
    ];

    for (let i = 0; i < testATPs.length; i++) {
      const atp = testATPs[i];
      const atpCode = `ATP-RBAC-${String(i + 1).padStart(3, '0')}`;
      
      const createdATP = await prisma.atp_documents.create({
        data: {
          atp_code: atpCode,
          site_id: atp.site_id,
          project_code: `PRJ-${atp.site_id}`,
          document_type: atp.category,
          final_category: atp.category,
          workflow_path: atp.category,
          current_stage: atp.category === 'software' ? 'STAGE_1_SW' : 'STAGE_1_HW',
          current_status: 'pending_review',
          uploaded_by_role: atp.uploaded_by,
          can_be_reviewed_by: atp.category === 'software' ? 
            ['BO', 'SME', 'HEAD_NOC'] : ['FOP_RTS', 'REGION_TEAM', 'RTH'],
          is_digital: true,
          template_id: atp.category === 'software' ? 'SW_BASIC_V1' : 'HW_BASIC_V1',
          form_data: {
            site_info: {
              site_id: atp.site_id,
              scenario: atp.scenario
            }
          },
          submitted_by: 'vendor-system',
          created_at: new Date(),
          updated_at: new Date()
        }
      });

      // Create review stages
      const stages = atp.category === 'software' 
        ? [
            { stage_number: 1, stage_code: 'STAGE_1_SW', stage_name: 'Business Operations Review', assigned_role: 'BO' },
            { stage_number: 2, stage_code: 'STAGE_2_SW', stage_name: 'SME Technical Review', assigned_role: 'SME' },
            { stage_number: 3, stage_code: 'STAGE_3_SW', stage_name: 'Head NOC Final Review', assigned_role: 'HEAD_NOC' }
          ]
        : [
            { stage_number: 1, stage_code: 'STAGE_1_HW', stage_name: 'FOP/RTS Field Review', assigned_role: 'FOP_RTS' },
            { stage_number: 2, stage_code: 'STAGE_2_HW', stage_name: 'Region Team Review', assigned_role: 'REGION_TEAM' },
            { stage_number: 3, stage_code: 'STAGE_3_HW', stage_name: 'RTH Final Approval', assigned_role: 'RTH' }
          ];

      for (const stage of stages) {
        await prisma.atp_review_stages.create({
          data: {
            atp_id: createdATP.id,
            ...stage,
            review_status: stage.stage_number === 1 ? 'pending' : 'waiting',
            sla_deadline: new Date(Date.now() + 48 * 60 * 60 * 1000)
          }
        });
      }

      console.log(`✅ ATP ${atpCode} created for ${atp.site_id} (${atp.scenario})`);
    }

    console.log('\n🎉 EATP RBAC Test Data Complete!');
    console.log('\n📊 Test Summary:');
    console.log('- 8 RBAC Test Users (2 Vendor + 6 Reviewers)');
    console.log('- 7 Multi-Region Sites (Jakarta, Surabaya, Bandung)');
    console.log('- 6 Test ATPs (3 Hardware + 3 Software)');
    console.log('- Role-based workflow assignments');

  } catch (error) {
    console.error('❌ RBAC Test seeding failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedEATPRBACTest();