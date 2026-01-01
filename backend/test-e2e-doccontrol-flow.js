// E2E Test: Doc Control Complete Workflow
// Tests: Site Registration → Auto-create Tasks → Upload ATP (single & bulk)

const axios = require('axios');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');

const API_BASE = 'http://localhost:3011/api/v1';

// Test Configuration
const TEST_SITE = {
  customerSiteId: `TEST-SITE-${Date.now()}`,
  customerSiteName: 'Test Site for E2E Flow',
  neTowerId: 'NE-TWR-001',
  neTowerName: 'NE Tower Test',
  feTowerId: 'FE-TWR-001',
  feTowerName: 'FE Tower Test',
  neLatitude: -7.2575,
  neLongitude: 112.7521,
  feLatitude: -7.2675,
  feLongitude: 112.7621,
  region: 'East Java',
  coverageArea: 'Urban',
  activityFlow: 'New Installation',
  sowCategory: 'Deployment',
  projectCode: 'PRJ-TEST-001',
  frequencyBand: '18GHz',
  linkCapacity: '512Mbps',
  antennaSize: '0.6m',
  equipmentType: 'AVIAT',
  atpRequirements: {
    software: true,
    hardware: true
  }
};

console.log('╔════════════════════════════════════════════════════════════════╗');
console.log('║     E2E TEST: DOC CONTROL COMPLETE WORKFLOW                    ║');
console.log('╚════════════════════════════════════════════════════════════════╝');
console.log();

// Step 1: Register Site
async function testSiteRegistration() {
  console.log('═══ STEP 1: SITE REGISTRATION ═══');
  console.log('URL:', `${API_BASE}/site-registration/register`);
  console.log('Data:', JSON.stringify(TEST_SITE, null, 2));
  console.log();

  try {
    const response = await axios.post(`${API_BASE}/site-registration/register`, TEST_SITE);

    console.log('✅ Site Registration SUCCESS');
    console.log('Response:', JSON.stringify(response.data, null, 2));
    console.log();

    return response.data;
  } catch (error) {
    console.error('❌ Site Registration FAILED');
    console.error('Error:', error.response?.data || error.message);
    throw error;
  }
}

// Step 2: Verify Auto-created Tasks
async function verifyAutoCreatedTasks(siteId) {
  console.log('═══ STEP 2: VERIFY AUTO-CREATED TASKS ═══');
  console.log('Fetching tasks for site:', siteId);
  console.log();

  try {
    const response = await axios.get(`${API_BASE}/tasks`);

    // Filter tasks for this site
    const siteTasks = response.data.data?.filter(task =>
      task.sites?.site_id === TEST_SITE.customer_site_id
    ) || [];

    console.log(`✅ Found ${siteTasks.length} tasks for site ${TEST_SITE.customer_site_id}`);
    console.log();

    siteTasks.forEach((task, index) => {
      console.log(`Task ${index + 1}:`);
      console.log('  - Task Code:', task.task_code);
      console.log('  - Task Type:', task.task_type);
      console.log('  - Status:', task.status);
      console.log('  - Assigned To:', task.assignedTo);
      console.log();
    });

    return siteTasks;
  } catch (error) {
    console.error('❌ Fetch Tasks FAILED');
    console.error('Error:', error.response?.data || error.message);
    throw error;
  }
}

// Step 3: Upload ATP Document (Single)
async function testSingleUpload(task, pdfFile) {
  console.log('═══ STEP 3: UPLOAD ATP DOCUMENT (SINGLE) ═══');
  console.log('Task Code:', task.task_code);
  console.log('Site ID:', TEST_SITE.customer_site_id);
  console.log('File:', pdfFile);
  console.log();

  try {
    const formData = new FormData();
    formData.append('document', fs.createReadStream(pdfFile));
    formData.append('task_code', task.task_code);
    formData.append('site_id', TEST_SITE.customer_site_id);

    const response = await axios.post(
      `${API_BASE}/atp/upload`,
      formData,
      {
        headers: formData.getHeaders()
      }
    );

    console.log('✅ Single Upload SUCCESS');
    console.log('Response:', JSON.stringify(response.data, null, 2));
    console.log();

    return response.data;
  } catch (error) {
    console.error('❌ Single Upload FAILED');
    console.error('Error:', error.response?.data || error.message);
    throw error;
  }
}

// Step 4: Bulk Upload
async function testBulkUpload(tasks, pdfFiles) {
  console.log('═══ STEP 4: BULK UPLOAD ATP DOCUMENTS ═══');
  console.log(`Uploading ${pdfFiles.length} documents to ${tasks.length} tasks`);
  console.log();

  const results = [];

  for (let i = 0; i < Math.min(tasks.length, pdfFiles.length); i++) {
    const task = tasks[i];
    const pdfFile = pdfFiles[i];

    console.log(`Uploading document ${i + 1}/${Math.min(tasks.length, pdfFiles.length)}`);
    console.log('  Task:', task.task_code);
    console.log('  File:', path.basename(pdfFile));

    try {
      const formData = new FormData();
      formData.append('document', fs.createReadStream(pdfFile));
      formData.append('task_code', task.task_code);
      formData.append('site_id', TEST_SITE.customer_site_id);

      const response = await axios.post(
        `${API_BASE}/atp/upload`,
        formData,
        {
          headers: formData.getHeaders()
        }
      );

      console.log('  ✅ SUCCESS');
      results.push({
        task_code: task.task_code,
        file: path.basename(pdfFile),
        success: true,
        data: response.data
      });
    } catch (error) {
      console.error('  ❌ FAILED:', error.response?.data?.message || error.message);
      results.push({
        task_code: task.task_code,
        file: path.basename(pdfFile),
        success: false,
        error: error.response?.data || error.message
      });
    }

    console.log();
  }

  console.log('═══ BULK UPLOAD SUMMARY ═══');
  const successCount = results.filter(r => r.success).length;
  const failCount = results.filter(r => !r.success).length;

  console.log(`✅ Success: ${successCount}`);
  console.log(`❌ Failed: ${failCount}`);
  console.log();

  return results;
}

// Step 5: Verify Workflow Stages
async function verifyWorkflowStages(atpId) {
  console.log('═══ STEP 5: VERIFY WORKFLOW STAGES ═══');
  console.log('ATP ID:', atpId);
  console.log();

  try {
    const response = await axios.get(`${API_BASE}/atp/review-stages/${atpId}`);

    const stages = response.data.data || [];
    console.log(`✅ Found ${stages.length} workflow stages`);
    console.log();

    stages.forEach((stage, index) => {
      console.log(`Stage ${index + 1}:`);
      console.log('  - Stage Name:', stage.stage_name);
      console.log('  - Stage Number:', stage.stage_number);
      console.log('  - Status:', stage.review_status);
      console.log('  - SLA Deadline:', stage.sla_deadline);
      console.log('  - Reviewer:', stage.reviewer);
      console.log();
    });

    return stages;
  } catch (error) {
    console.error('❌ Fetch Workflow Stages FAILED');
    console.error('Error:', error.response?.data || error.message);
    return [];
  }
}

// Main Test Function
async function runE2ETest() {
  try {
    // Step 1: Register Site
    const siteRegResult = await testSiteRegistration();
    const siteId = siteRegResult.data?.site?.id;

    // Wait a bit for tasks to be created
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Step 2: Verify Auto-created Tasks
    const tasks = await verifyAutoCreatedTasks(siteId);

    if (tasks.length === 0) {
      console.warn('⚠️  No tasks were auto-created. Stopping test.');
      return;
    }

    // Step 3: Single Upload (use Software ATP task)
    const softwareTask = tasks.find(t => t.task_type === 'ATP_SOFTWARE') || tasks[0];
    const softwarePDF = path.join(__dirname, '..', 'XLSmart MW ATP (SW Lincense UG BW UG Modulations) KAL-KB-SBS-0730-KAL-KB-SBS-0389(2) (1).pdf');

    if (fs.existsSync(softwarePDF)) {
      const uploadResult = await testSingleUpload(softwareTask, softwarePDF);
      const atpId = uploadResult.data?.atpDocument?.id;

      // Step 5: Verify Workflow Stages (for single upload)
      if (atpId) {
        await verifyWorkflowStages(atpId);
      }
    } else {
      console.warn('⚠️  Software ATP PDF not found, skipping single upload test');
      console.warn('   Expected path:', softwarePDF);
    }

    // Step 4: Bulk Upload (use remaining tasks)
    await new Promise(resolve => setTimeout(resolve, 1000));

    const hardwarePDF = path.join(__dirname, '..', 'XLSmart MW ATP SUM-RI-TBH-0440_SUM-RI-TBH-0640.pdf');
    const testFiles = [];

    if (fs.existsSync(softwarePDF)) testFiles.push(softwarePDF);
    if (fs.existsSync(hardwarePDF)) testFiles.push(hardwarePDF);

    if (testFiles.length > 0 && tasks.length > 0) {
      await testBulkUpload(tasks, testFiles);
    } else {
      console.warn('⚠️  No test PDF files found for bulk upload');
    }

    console.log('═══ TEST COMPLETE ═══');
    console.log('✅ All E2E tests executed successfully!');
    console.log();
    console.log('Test Site ID:', TEST_SITE.customer_site_id);
    console.log('Tasks Created:', tasks.length);
    console.log();

  } catch (error) {
    console.error('═══ TEST FAILED ═══');
    console.error('Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

// Run the test
console.log('Starting E2E test...');
console.log();
runE2ETest();
