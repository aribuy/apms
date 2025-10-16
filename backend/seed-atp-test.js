const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedATPTestData() {
  console.log('🌱 Seeding ATP test data...');

  try {
    // Create test ATP documents
    const testATPs = [
      {
        atp_code: 'ATP-2025-0001',
        site_id: 'KAL-KB-SBS-0730',
        project_code: 'XLSMART-2025',
        document_type: 'hardware',
        final_category: 'hardware',
        workflow_path: 'hardware',
        current_stage: 'STAGE_1_HW',
        current_status: 'pending_review'
      },
      {
        atp_code: 'ATP-2025-0002',
        site_id: 'SUM-MD-TNG-0245',
        project_code: 'XLSMART-2025',
        document_type: 'software',
        final_category: 'software',
        workflow_path: 'software',
        current_stage: 'STAGE_1_SW',
        current_status: 'pending_review'
      },
      {
        atp_code: 'ATP-2025-0003',
        site_id: 'JAV-JK-PLT-0156',
        project_code: 'XLSMART-2025',
        document_type: 'hardware',
        final_category: 'hardware',
        workflow_path: 'hardware',
        current_stage: 'STAGE_2_HW',
        current_status: 'pending_review'
      }
    ];

    for (const atpData of testATPs) {
      // Check if ATP already exists
      const existing = await prisma.atp_documents.findUnique({
        where: { atp_code: atpData.atp_code }
      });
      
      if (existing) {
        console.log(`⚠️  ATP ${atpData.atp_code} already exists, skipping...`);
        continue;
      }
      
      // Create ATP document
      const atp = await prisma.atp_documents.create({
        data: atpData
      });

      console.log(`✅ Created ATP: ${atp.atp_code}`);

      // Create review stages based on workflow
      const stages = atpData.workflow_path === 'software' 
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
        const reviewStatus = stage.stage_code === atpData.current_stage ? 'pending' : 
                           stage.stage_number < stages.find(s => s.stage_code === atpData.current_stage).stage_number ? 'completed' : 'waiting';
        
        await prisma.atp_review_stages.create({
          data: {
            atp_id: atp.id,
            ...stage,
            review_status: reviewStatus,
            sla_deadline: new Date(Date.now() + 48 * 60 * 60 * 1000), // 48 hours from now
            decision: reviewStatus === 'completed' ? 'approve' : null,
            review_completed_at: reviewStatus === 'completed' ? new Date() : null
          }
        });
      }

      console.log(`✅ Created review stages for ${atp.atp_code}`);
    }

    // Create some sample punchlist items
    const atps = await prisma.atp_documents.findMany();
    
    if (atps.length > 0) {
      const samplePunchlist = await prisma.atp_punchlist_items.create({
        data: {
          atp_id: atps[0].id,
          punchlist_number: 'PL-2025-0001',
          issue_description: 'Cable waterproofing incomplete on coax connector',
          severity: 'major',
          issue_category: 'Cable Installation',
          status: 'identified'
        }
      });

      console.log(`✅ Created sample punchlist: ${samplePunchlist.punchlist_number}`);
    }

    console.log('🎉 ATP test data seeded successfully!');
    
  } catch (error) {
    console.error('❌ Error seeding ATP test data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seed function
seedATPTestData();