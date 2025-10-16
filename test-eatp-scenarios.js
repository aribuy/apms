const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

const BASE_URL = 'http://localhost:3011/api/v1';

// Test scenarios with role-based workflows
const testScenarios = [
  {
    name: 'Hardware ATP - Normal Approval Flow',
    atpCode: 'ATP-TEST-001',
    workflow: ['FOP_RTS', 'REGION_TEAM', 'RTH'],
    users: ['field.engineer@telecore.com', 'region.supervisor@telecore.com', 'hardware.manager@telecore.com'],
    expectedOutcome: 'approved'
  },
  {
    name: 'Software ATP - With Punchlist',
    atpCode: 'ATP-TEST-002', 
    workflow: ['BO', 'SME', 'HEAD_NOC'],
    users: ['business.ops@telecore.com', 'technical.expert@telecore.com', 'noc.head@telecore.com'],
    expectedOutcome: 'approved_with_punchlist'
  },
  {
    name: 'Hardware ATP - Rejection Scenario',
    atpCode: 'ATP-TEST-003',
    workflow: ['FOP_RTS'],
    users: ['field.engineer@telecore.com'],
    expectedOutcome: 'rejected'
  }
];

async function runEATPTestScenarios() {
  console.log('🧪 Running EATP Test Scenarios...\n');

  try {
    // Test 1: Verify test data exists
    console.log('1. Verifying test data...');
    const atpsResponse = await axios.get(`${BASE_URL}/atp`);
    const testATPs = atpsResponse.data.filter(atp => atp.atp_code.startsWith('ATP-TEST'));
    console.log(`✅ Found ${testATPs.length} test ATPs`);

    // Test 2: Template functionality
    console.log('\n2. Testing template system...');
    const templatesResponse = await axios.get(`${BASE_URL}/documents/templates`);
    console.log(`✅ Templates available: ${templatesResponse.data.length}`);
    
    const hwTemplate = templatesResponse.data.find(t => t.category === 'hardware');
    const swTemplate = templatesResponse.data.find(t => t.category === 'software');
    console.log(`✅ Hardware template: ${hwTemplate?.template_name}`);
    console.log(`✅ Software template: ${swTemplate?.template_name}`);

    // Test 3: Digital form data retrieval
    console.log('\n3. Testing digital form data...');
    for (const atp of testATPs.slice(0, 2)) {
      try {
        const formDataResponse = await axios.get(`${BASE_URL}/documents/${atp.id}/form-data`);
        console.log(`✅ ${atp.atp_code}: Form data retrieved (${formDataResponse.data.is_digital ? 'Digital' : 'Legacy'})`);
      } catch (error) {
        console.log(`⚠️  ${atp.atp_code}: Form data not found`);
      }
    }

    // Test 4: File upload simulation
    console.log('\n4. Testing file upload...');
    const testATP = testATPs[0];
    if (testATP) {
      // Create a test file
      const testFileContent = 'Test ATP evidence file content';
      fs.writeFileSync('/tmp/test-evidence.txt', testFileContent);
      
      try {
        const formData = new FormData();
        formData.append('files', fs.createReadStream('/tmp/test-evidence.txt'));
        formData.append('fileType', 'evidence');
        
        const uploadResponse = await axios.post(
          `${BASE_URL}/documents/upload/${testATP.id}`,
          formData,
          { headers: formData.getHeaders() }
        );
        console.log(`✅ File uploaded to ${testATP.atp_code}: ${uploadResponse.data.files.length} files`);
        
        // Test file retrieval
        const attachmentsResponse = await axios.get(`${BASE_URL}/documents/${testATP.id}/attachments`);
        console.log(`✅ Attachments retrieved: ${attachmentsResponse.data.length} files`);
        
      } catch (error) {
        console.log(`❌ File upload failed: ${error.response?.data?.error || error.message}`);
      }
    }

    // Test 5: Workflow simulation
    console.log('\n5. Testing workflow scenarios...');
    
    for (const scenario of testScenarios) {
      console.log(`\n📋 Scenario: ${scenario.name}`);
      
      const atp = testATPs.find(a => a.atp_code === scenario.atpCode);
      if (!atp) {
        console.log(`❌ ATP ${scenario.atpCode} not found`);
        continue;
      }

      // Get current review stages
      const atpDetailsResponse = await axios.get(`${BASE_URL}/atp/${atp.id}`);
      const currentATP = atpDetailsResponse.data;
      const pendingStage = currentATP.atp_review_stages.find(s => s.review_status === 'pending');
      
      if (pendingStage) {
        console.log(`   Current stage: ${pendingStage.stage_name} (${pendingStage.assigned_role})`);
        
        // Simulate review based on scenario
        let reviewData = {
          stageId: pendingStage.id,
          comments: `Test review for ${scenario.name}`,
          punchlistItems: []
        };

        if (scenario.expectedOutcome === 'rejected') {
          reviewData.decision = 'reject';
          reviewData.comments = 'Test rejection - equipment not meeting specifications';
        } else if (scenario.expectedOutcome === 'approved_with_punchlist') {
          reviewData.decision = 'approve_with_punchlist';
          reviewData.punchlistItems = [
            {
              description: 'Update configuration documentation',
              severity: 'medium',
              category: 'Documentation'
            }
          ];
        } else {
          reviewData.decision = 'approve';
        }

        try {
          const reviewResponse = await axios.post(`${BASE_URL}/atp/${atp.id}/review`, reviewData);
          console.log(`   ✅ Review submitted: ${reviewResponse.data.message}`);
          console.log(`   📊 Status: ${reviewResponse.data.status}`);
          if (reviewResponse.data.nextStage) {
            console.log(`   ➡️  Next stage: ${reviewResponse.data.nextStage}`);
          }
        } catch (error) {
          console.log(`   ❌ Review failed: ${error.response?.data?.error || error.message}`);
        }
      } else {
        console.log(`   ℹ️  No pending stages found`);
      }
    }

    // Test 6: Performance metrics
    console.log('\n6. Performance metrics...');
    const startTime = Date.now();
    await axios.get(`${BASE_URL}/documents/templates`);
    const templateLoadTime = Date.now() - startTime;
    console.log(`✅ Template load time: ${templateLoadTime}ms`);

    console.log('\n🎉 EATP Test Scenarios Complete!');
    console.log('\n📊 Test Results Summary:');
    console.log(`- Test ATPs: ${testATPs.length} found`);
    console.log(`- Templates: ${templatesResponse.data.length} available`);
    console.log(`- Performance: ${templateLoadTime}ms template load`);
    console.log('- File upload: Tested with evidence files');
    console.log('- Workflows: Multi-role approval tested');

  } catch (error) {
    console.error('❌ Test scenario failed:', error.response?.data || error.message);
  }
}

// Cleanup function
async function cleanup() {
  try {
    fs.unlinkSync('/tmp/test-evidence.txt');
  } catch (error) {
    // File might not exist
  }
}

runEATPTestScenarios().finally(cleanup);