const { PrismaClient } = require('@prisma/client');
const atpWorkflowEngine = require('./src/utils/atpWorkflowEngine');

const prisma = new PrismaClient();

async function testWorkflowEngine() {
  console.log('🧪 Testing ATP Workflow Engine...\n');

  try {
    // Test 1: Create a test ATP document
    console.log('1. Creating test ATP document...');
    const atp = await prisma.atp_documents.create({
      data: {
        atp_code: 'ATP-TEST-001',
        site_id: 'TEST-SITE-001',
        document_type: 'software',
        workflow_path: 'software',
        current_stage: 'DOC_UPLOAD',
        current_status: 'pending_doc_control'
      }
    });
    console.log(`✅ Created ATP: ${atp.atp_code} (ID: ${atp.id})`);

    // Test 2: Initialize workflow
    console.log('\n2. Initializing workflow...');
    const initResult = await atpWorkflowEngine.initializeWorkflow(atp.id, 'software');
    console.log(`✅ Workflow initialized: ${initResult.message}`);

    // Test 3: Get workflow status
    console.log('\n3. Getting workflow status...');
    const statusResult = await atpWorkflowEngine.getWorkflowStatus(atp.id);
    if (statusResult.success) {
      console.log(`✅ Current stage: ${statusResult.data.current_stage}`);
      console.log(`✅ Progress: ${statusResult.data.progress.percentage}%`);
      console.log(`✅ Stages: ${statusResult.data.stages.length}`);
    }

    // Test 4: Get pending reviews for BO role
    console.log('\n4. Getting pending reviews for BO role...');
    const pendingReviews = await atpWorkflowEngine.getPendingReviews('BO');
    console.log(`✅ Found ${pendingReviews.length} pending reviews for BO`);

    // Test 5: Process first stage review (approve)
    console.log('\n5. Processing first stage review...');
    const stages = await prisma.atp_review_stages.findMany({
      where: { atp_id: atp.id, review_status: 'pending' },
      orderBy: { stage_number: 'asc' }
    });
    
    if (stages.length > 0) {
      const reviewResult = await atpWorkflowEngine.processReviewDecision(
        atp.id,
        stages[0].id,
        'approve',
        'Test approval - all items passed',
        []
      );
      console.log(`✅ Review processed: ${reviewResult.message}`);
      console.log(`✅ Next stage: ${reviewResult.nextStage}`);
    }

    // Test 6: Process second stage with punchlist
    console.log('\n6. Processing second stage with punchlist...');
    const pendingStages = await prisma.atp_review_stages.findMany({
      where: { atp_id: atp.id, review_status: 'pending' },
      orderBy: { stage_number: 'asc' }
    });
    
    if (pendingStages.length > 0) {
      const punchlistItems = [
        {
          description: 'Configuration sync interval needs adjustment from 60s to 30s',
          severity: 'major',
          category: 'Configuration'
        },
        {
          description: 'Missing version information in document header',
          severity: 'minor',
          category: 'Documentation'
        }
      ];

      const reviewResult = await atpWorkflowEngine.processReviewDecision(
        atp.id,
        pendingStages[0].id,
        'approve_with_punchlist',
        'Approved with minor issues to be rectified',
        punchlistItems
      );
      console.log(`✅ Review with punchlist processed: ${reviewResult.message}`);
      console.log(`✅ Punchlist items created: ${reviewResult.punchlistCreated}`);
    }

    // Test 7: Get review statistics
    console.log('\n7. Getting review statistics...');
    const stats = await atpWorkflowEngine.getReviewStats('SME');
    console.log(`✅ SME Stats - Pending: ${stats.pending}, Reviewed Today: ${stats.reviewedToday}`);

    // Test 8: Check SLA violations
    console.log('\n8. Checking SLA violations...');
    const slaResult = await atpWorkflowEngine.checkSLAViolations();
    console.log(`✅ SLA Check - Overdue items: ${slaResult.overdueCount}`);

    // Test 9: Complete punchlist rectification
    console.log('\n9. Testing punchlist rectification...');
    const punchlistItems = await prisma.atp_punchlist_items.findMany({
      where: { atp_id: atp.id }
    });
    
    if (punchlistItems.length > 0) {
      const rectificationResult = await atpWorkflowEngine.completePunchlistRectification(
        punchlistItems[0].id,
        {
          notes: 'Configuration updated successfully. Sync interval changed from 60s to 30s. System tested and verified.',
          beforeEvidence: ['before_config.jpg'],
          afterEvidence: ['after_config.jpg', 'test_results.jpg']
        }
      );
      console.log(`✅ Punchlist rectification: ${rectificationResult.message}`);
    }

    // Test 10: Final workflow status
    console.log('\n10. Final workflow status...');
    const finalStatus = await atpWorkflowEngine.getWorkflowStatus(atp.id);
    if (finalStatus.success) {
      console.log(`✅ Final status: ${finalStatus.data.current_status}`);
      console.log(`✅ Final progress: ${finalStatus.data.progress.percentage}%`);
      console.log(`✅ Punchlist items: ${finalStatus.data.punchlist.total} total, ${finalStatus.data.punchlist.active} active`);
    }

    console.log('\n🎉 All workflow engine tests completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testWorkflowEngine();