const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedEATPTestData() {
  console.log('🌱 Seeding EATP Test Data...\n');

  try {
    // 1. Create Test Users with Roles
    const testUsers = [
      { id: 'user-fop-001', email: 'field.engineer@telecore.com', username: 'field_engineer', role: 'FOP_RTS', name: 'Ahmad Fieldman' },
      { id: 'user-region-001', email: 'region.supervisor@telecore.com', username: 'region_supervisor', role: 'REGION_TEAM', name: 'Siti Regional' },
      { id: 'user-rth-001', email: 'hardware.manager@telecore.com', username: 'hardware_manager', role: 'RTH', name: 'Budi Hardware' },
      { id: 'user-bo-001', email: 'business.ops@telecore.com', username: 'business_ops', role: 'BO', name: 'Dewi Business' },
      { id: 'user-sme-001', email: 'technical.expert@telecore.com', username: 'technical_expert', role: 'SME', name: 'Andi Technical' },
      { id: 'user-noc-001', email: 'noc.head@telecore.com', username: 'noc_head', role: 'HEAD_NOC', name: 'Rini NOC Head' }
    ];

    for (const user of testUsers) {
      await prisma.users.upsert({
        where: { email: user.email },
        update: {},
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
    console.log('✅ Test users created');

    // 2. Create Test Sites
    const testSites = [
      {
        site_id: 'JKT-001-TOWER',
        site_name: 'Jakarta Tower Site 001',
        site_type: 'TOWER',
        region: 'Jakarta',
        province: 'DKI Jakarta',
        city: 'Jakarta Pusat',
        latitude: -6.2088,
        longitude: 106.8456,
        status: 'ACTIVE'
      },
      {
        site_id: 'JKT-002-OFFICE',
        site_name: 'Jakarta Office Site 002',
        site_type: 'OFFICE',
        region: 'Jakarta',
        province: 'DKI Jakarta', 
        city: 'Jakarta Selatan',
        latitude: -6.2297,
        longitude: 106.8253,
        status: 'ACTIVE'
      },
      {
        site_id: 'JKT-003-HYBRID',
        site_name: 'Jakarta Hybrid Site 003',
        site_type: 'HYBRID',
        region: 'Jakarta',
        province: 'DKI Jakarta',
        city: 'Jakarta Barat',
        latitude: -6.1944,
        longitude: 106.8229,
        status: 'ACTIVE'
      },
      {
        site_id: 'SBY-001-REMOTE',
        site_name: 'Surabaya Remote Site 001',
        site_type: 'REMOTE',
        region: 'Surabaya',
        province: 'Jawa Timur',
        city: 'Surabaya',
        latitude: -7.2575,
        longitude: 112.7521,
        status: 'ACTIVE'
      },
      {
        site_id: 'SBY-002-DATACENTER',
        site_name: 'Surabaya Data Center 002',
        site_type: 'DATACENTER',
        region: 'Surabaya',
        province: 'Jawa Timur',
        city: 'Surabaya',
        latitude: -7.2492,
        longitude: 112.7508,
        status: 'ACTIVE'
      }
    ];

    for (const site of testSites) {
      await prisma.sites.upsert({
        where: { site_id: site.site_id },
        update: {},
        create: {
          id: `site-${site.site_id.toLowerCase()}`,
          ...site,
          created_at: new Date(),
          updated_at: new Date()
        }
      });
    }
    console.log('✅ Test sites created');

    // 3. Create Test ATP Documents with Different Scenarios
    const testATPs = [
      {
        site_id: 'JKT-001-TOWER',
        category: 'hardware',
        scenario: 'normal_approval',
        template: 'HW_BASIC_V1',
        form_data: {
          site_info: {
            site_id: 'JKT-001-TOWER',
            site_name: 'Jakarta Tower Site 001',
            coordinates: { lat: -6.2088, lng: 106.8456 }
          },
          equipment: {
            equipment_type: 'Radio',
            vendor: 'Huawei',
            model: 'RTN-950A'
          }
        }
      },
      {
        site_id: 'JKT-002-OFFICE',
        category: 'software',
        scenario: 'with_punchlist',
        template: 'SW_BASIC_V1',
        form_data: {
          software_info: {
            software_version: 'v2.1.5',
            release_notes: 'Network management system upgrade',
            installation_method: 'Remote'
          },
          configuration: {
            parameters: 'SNMP enabled, monitoring configured'
          }
        }
      },
      {
        site_id: 'JKT-003-HYBRID',
        category: 'hardware',
        scenario: 'rejection',
        template: 'HW_BASIC_V1',
        form_data: {
          site_info: {
            site_id: 'JKT-003-HYBRID',
            site_name: 'Jakarta Hybrid Site 003',
            coordinates: { lat: -6.1944, lng: 106.8229 }
          },
          equipment: {
            equipment_type: 'Antenna',
            vendor: 'CommScope',
            model: 'SBNHH-1D65C'
          }
        }
      },
      {
        site_id: 'SBY-001-REMOTE',
        category: 'hardware',
        scenario: 'quick_approval',
        template: 'HW_BASIC_V1',
        form_data: {
          site_info: {
            site_id: 'SBY-001-REMOTE',
            site_name: 'Surabaya Remote Site 001',
            coordinates: { lat: -7.2575, lng: 112.7521 }
          },
          equipment: {
            equipment_type: 'Power',
            vendor: 'Rectifier',
            model: 'R48-3000'
          }
        }
      },
      {
        site_id: 'SBY-002-DATACENTER',
        category: 'software',
        scenario: 'multi_attachment',
        template: 'SW_BASIC_V1',
        form_data: {
          software_info: {
            software_version: 'v3.0.1',
            release_notes: 'Data center management system',
            installation_method: 'On-site'
          },
          configuration: {
            parameters: 'High availability cluster configuration'
          }
        }
      }
    ];

    for (let i = 0; i < testATPs.length; i++) {
      const atp = testATPs[i];
      const atpCode = `ATP-TEST-${String(i + 1).padStart(3, '0')}`;
      
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
          is_digital: true,
          template_id: atp.template,
          form_data: atp.form_data,
          submitted_by: 'system-test',
          submission_date: new Date(),
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

    console.log('\n🎉 EATP Test Data Seeding Complete!');
    console.log('\n📋 Test Summary:');
    console.log('- 6 Test Users (FOP_RTS, REGION_TEAM, RTH, BO, SME, HEAD_NOC)');
    console.log('- 5 Test Sites (Jakarta: 3, Surabaya: 2)');
    console.log('- 5 Test ATPs (3 Hardware, 2 Software)');
    console.log('- 5 Different Test Scenarios');

  } catch (error) {
    console.error('❌ Seeding failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedEATPTestData();