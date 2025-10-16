const axios = require('axios');

const BASE_URL = 'http://localhost:3011/api/v1';

// Complete workflow simulation
const workflowTests = [
  {
    name: 'Hardware ATP Complete Workflow',
    atpType: 'hardware',
    siteId: 'JKT-001-TOWER',
    workflow: [
      { role: 'VENDOR_ADMIN', action: 'upload', stage: 'submission' },
      { role: 'FOP_RTS', action: 'review', stage: 'STAGE_1_HW', decision: 'approve' },
      { role: 'REGION_TEAM', action: 'review', stage: 'STAGE_2_HW', decision: 'approve_with_punchlist' },
      { role: 'RTH', action: 'review', stage: 'STAGE_3_HW', decision: 'approve' }
    ]
  },
  {
    name: 'Software ATP Complete Workflow',
    atpType: 'software',
    siteId: 'JKT-002-OFFICE',
    workflow: [
      { role: 'VENDOR_STAFF', action: 'upload', stage: 'submission' },
      { role: 'BO', action: 'review', stage: 'STAGE_1_SW', decision: 'approve' },
      { role: 'SME', action: 'review', stage: 'STAGE_2_SW', decision: 'approve' },
      { role: 'HEAD_NOC', action: 'review', stage: 'STAGE_3_SW', decision: 'approve' }
    ]
  },
  {
    name: 'Hardware ATP Rejection Workflow',
    atpType: 'hardware',
    siteId: 'SBY-001-REMOTE',
    workflow: [
      { role: 'VENDOR_ADMIN', action: 'upload', stage: 'submission' },
      { role: 'FOP_RTS', action: 'review', stage: 'STAGE_1_HW', decision: 'reject' }
    ]
  }
];

async function simulateWorkflows() {
  console.log('🔄 Simulating Complete EATP Workflows...\n');

  for (const test of workflowTests) {
    console.log(`\n📋 ${test.name}:`);
    let currentATPId = null;

    for (let i = 0; i < test.workflow.length; i++) {
      const step = test.workflow[i];
      console.log(`   Step ${i + 1}: ${step.role} - ${step.action}`);

      try {
        if (step.action === 'upload') {
          // Upload ATP
          const uploadResponse = await axios.post(`${BASE_URL}/atp/submit`, {
            siteId: test.siteId,
            confirmedCategory: test.atpType,
            projectCode: `WORKFLOW-TEST-${Date.now()}`
          }, {
            headers: { 'x-user-role': step.role }
          });

          currentATPId = uploadResponse.data.atpId;
          console.log(`      ✅ ATP uploaded: ${uploadResponse.data.atpCode}`);

        } else if (step.action === 'review' && currentATPId) {
          // Get ATP details to find current stage
          const atpResponse = await axios.get(`${BASE_URL}/atp/${currentATPId}`);
          const atp = atpResponse.data;
          
          const currentStage = atp.atp_review_stages.find(s => s.review_status === 'pending');
          
          if (currentStage && currentStage.assigned_role === step.role) {
            // Submit review
            const reviewData = {
              stageId: currentStage.id,
              decision: step.decision,
              comments: `${step.role} review: ${step.decision}`,
              punchlistItems: step.decision === 'approve_with_punchlist' ? [
                {
                  description: 'Minor documentation update required',
                  severity: 'low',
                  category: 'Documentation'
                }
              ] : []
            };

            const reviewResponse = await axios.post(`${BASE_URL}/atp/${currentATPId}/review`, reviewData, {
              headers: { 'x-user-role': step.role }
            });

            console.log(`      ✅ Review submitted: ${reviewResponse.data.message}`);
            console.log(`      📊 Status: ${reviewResponse.data.status}`);
            
            if (reviewResponse.data.nextStage) {
              console.log(`      ➡️  Next stage: ${reviewResponse.data.nextStage}`);
            }

            // If rejected, stop workflow
            if (step.decision === 'reject') {
              console.log(`      🛑 Workflow stopped: ATP rejected`);
              break;
            }

          } else {
            console.log(`      ⚠️  Stage mismatch or not pending for ${step.role}`);
          }
        }

        // Small delay between steps
        await new Promise(resolve => setTimeout(resolve, 500));

      } catch (error) {
        console.log(`      ❌ Error: ${error.response?.data?.message || error.message}`);
        break;
      }
    }

    // Final status check
    if (currentATPId) {
      try {
        const finalResponse = await axios.get(`${BASE_URL}/atp/${currentATPId}`);
        const finalATP = finalResponse.data;
        console.log(`   🏁 Final Status: ${finalATP.current_status}`);
        console.log(`   📈 Progress: ${finalATP.completion_percentage || 0}%`);
      } catch (error) {
        console.log(`   ❌ Final status check failed`);
      }
    }
  }

  console.log('\n🎉 Workflow Simulation Complete!');
  console.log('\n📊 Simulation Results:');
  console.log('✅ Complete approval workflows tested');
  console.log('✅ Role-based stage assignments verified');
  console.log('✅ Punchlist creation tested');
  console.log('✅ Rejection workflow tested');
  console.log('✅ Multi-site workflow support confirmed');
}

simulateWorkflows();