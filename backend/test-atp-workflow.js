const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testATPWorkflow() {
  console.log('🧪 Testing ATP Workflow...');

  try {
    // 1. Test ATP Submission
    console.log('\n1️⃣ Testing ATP Submission...');
    
    const count = await prisma.atp_documents.count();
    const atpCode = `ATP-TEST-${String(count + 1).padStart(4, '0')}`;
    
    const atp = await prisma.atp_documents.create({
      data: {
        atp_code: atpCode,
        site_id: 'TEST-SITE-001',
        project_code: 'TEST-PROJECT',
        document_type: 'hardware',
        final_category: 'hardware',
        workflow_path: 'hardware',
        current_stage: 'STAGE_1_HW',
        current_status: 'pending_review'
      }
    });

    console.log(`✅ ATP Created: ${atp.atp_code} (ID: ${atp.id})`);

    // Create review stages
    const stages = [
      { stage_number: 1, stage_code: 'STAGE_1_HW', stage_name: 'FOP/RTS Field Review', assigned_role: 'FOP_RTS' },
      { stage_number: 2, stage_code: 'STAGE_2_HW', stage_name: 'Region Team Review', assigned_role: 'REGION_TEAM' },
      { stage_number: 3, stage_code: 'STAGE_3_HW', stage_name: 'RTH Final Approval', assigned_role: 'RTH' }
    ];

    const createdStages = [];
    for (const stage of stages) {
      const reviewStage = await prisma.atp_review_stages.create({
        data: {
          atp_id: atp.id,
          ...stage,
          review_status: stage.stage_number === 1 ? 'pending' : 'waiting',
          sla_deadline: new Date(Date.now() + 48 * 60 * 60 * 1000)
        }
      });
      createdStages.push(reviewStage);
    }

    console.log(`✅ Created ${createdStages.length} review stages`);

    // 2. Test Stage 1 Review (with punchlist)
    console.log('\n2️⃣ Testing Stage 1 Review (with punchlist)...');
    
    const stage1 = createdStages[0];
    
    // Update stage 1 to completed with punchlist
    await prisma.atp_review_stages.update({
      where: { id: stage1.id },
      data: {
        review_status: 'completed',
        decision: 'approve_with_punchlist',
        comments: 'Approved with minor issues to be fixed',
        review_completed_at: new Date(),
        reviewer_id: 'test-reviewer-1'
      }
    });

    // Create punchlist item
    const punchlistNumber = `PL-TEST-${String(await prisma.atp_punchlist_items.count() + 1).padStart(4, '0')}`;
    await prisma.atp_punchlist_items.create({
      data: {
        atp_id: atp.id,
        review_stage_id: stage1.id,
        punchlist_number: punchlistNumber,
        issue_description: 'Cable labeling incomplete',
        severity: 'minor',
        issue_category: 'Documentation'
      }
    });

    // Move to stage 2
    await prisma.atp_review_stages.update({
      where: { id: createdStages[1].id },
      data: { review_status: 'pending' }
    });

    await prisma.atp_documents.update({
      where: { id: atp.id },
      data: {
        current_stage: 'STAGE_2_HW',
        current_status: 'pending_review_with_punchlist'
      }
    });

    console.log(`✅ Stage 1 completed with punchlist: ${punchlistNumber}`);

    // 3. Test Stage 2 Review (approve)
    console.log('\n3️⃣ Testing Stage 2 Review (approve)...');
    
    const stage2 = createdStages[1];
    
    await prisma.atp_review_stages.update({
      where: { id: stage2.id },
      data: {
        review_status: 'completed',
        decision: 'approve',
        comments: 'Regional review passed',
        review_completed_at: new Date(),
        reviewer_id: 'test-reviewer-2'
      }
    });

    // Move to stage 3
    await prisma.atp_review_stages.update({
      where: { id: createdStages[2].id },
      data: { review_status: 'pending' }
    });

    await prisma.atp_documents.update({
      where: { id: atp.id },
      data: {
        current_stage: 'STAGE_3_HW',
        current_status: 'pending_review_with_punchlist'
      }
    });

    console.log(`✅ Stage 2 completed - moved to Stage 3`);

    // 4. Test Stage 3 Final Approval
    console.log('\n4️⃣ Testing Stage 3 Final Approval...');
    
    const stage3 = createdStages[2];
    
    await prisma.atp_review_stages.update({
      where: { id: stage3.id },
      data: {
        review_status: 'completed',
        decision: 'approve',
        comments: 'Final approval granted',
        review_completed_at: new Date(),
        reviewer_id: 'test-reviewer-3'
      }
    });

    // Final ATP approval
    await prisma.atp_documents.update({
      where: { id: atp.id },
      data: {
        current_status: 'approved',
        approval_date: new Date(),
        final_approver: 'test-reviewer-3',
        completion_percentage: 100
      }
    });

    console.log(`✅ ATP Final Approval completed!`);

    // 5. Display final status
    console.log('\n5️⃣ Final ATP Status:');
    
    const finalATP = await prisma.atp_documents.findUnique({
      where: { id: atp.id },
      include: {
        atp_review_stages: {
          orderBy: { stage_number: 'asc' }
        },
        atp_punchlist_items: true
      }
    });

    console.log(`📋 ATP Code: ${finalATP.atp_code}`);
    console.log(`📍 Site ID: ${finalATP.site_id}`);
    console.log(`📊 Status: ${finalATP.current_status}`);
    console.log(`📈 Progress: ${finalATP.completion_percentage}%`);
    console.log(`📅 Approved: ${finalATP.approval_date}`);
    
    console.log('\n📝 Review Stages:');
    finalATP.atp_review_stages.forEach(stage => {
      console.log(`  ${stage.stage_number}. ${stage.stage_name}: ${stage.review_status} (${stage.decision || 'pending'})`);
    });
    
    console.log('\n🔧 Punchlist Items:');
    finalATP.atp_punchlist_items.forEach(item => {
      console.log(`  - [${item.severity}] ${item.issue_description} (${item.status})`);
    });

    console.log('\n🎉 ATP Workflow Test Completed Successfully!');
    console.log('\n📊 Summary:');
    console.log(`   ✅ ATP submitted and processed through 3 stages`);
    console.log(`   ✅ Punchlist created and tracked`);
    console.log(`   ✅ Final approval achieved`);
    console.log(`   ✅ Status progression: pending_review → pending_review_with_punchlist → approved`);

  } catch (error) {
    console.error('❌ Error testing ATP workflow:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testATPWorkflow();