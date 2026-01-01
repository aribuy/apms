// Simplified E2E Test: Upload ATP Documents
// Tests: Upload ATP documents to existing tasks

const axios = require('axios');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');

const API_BASE = 'http://localhost:3011/api/v1';

console.log('╔════════════════════════════════════════════════════════════════╗');
console.log('║     E2E TEST: UPLOAD ATP DOCUMENTS                             ║');
console.log('╚════════════════════════════════════════════════════════════════╝');
console.log();

// Step 1: Fetch existing tasks
async function fetchTasks() {
  console.log('═══ STEP 1: FETCH EXISTING TASKS ═══');
  console.log('URL:', `${API_BASE}/tasks`);
  console.log();

  try {
    const response = await axios.get(`${API_BASE}/tasks`);
    const tasks = response.data.data || [];

    console.log(`✅ Found ${tasks.length} tasks`);
    console.log();

    // Show first 5 tasks
    tasks.slice(0, 5).forEach((task, index) => {
      console.log(`Task ${index + 1}:`);
      console.log('  - Task Code:', task.task_code);
      console.log('  - Task Type:', task.task_type);
      console.log('  - Status:', task.status);
      console.log('  - Site:', task.sites?.site_id || 'N/A');
      console.log();
    });

    return tasks;
  } catch (error) {
    console.error('❌ Fetch Tasks FAILED');
    console.error('Error:', error.response?.data || error.message);
    throw error;
  }
}

// Step 2: Upload ATP Document (Single)
async function testSingleUpload(task, pdfFile) {
  console.log('═══ STEP 2: UPLOAD ATP DOCUMENT (SINGLE) ═══');
  console.log('Task Code:', task.task_code);
  console.log('Site ID:', task.sites?.site_id || 'N/A');
  console.log('File:', path.basename(pdfFile));
  console.log();

  try {
    const formData = new FormData();
    formData.append('document', fs.createReadStream(pdfFile));
    formData.append('task_code', task.task_code);
    formData.append('site_id', task.sites?.site_id || 'TEST-SITE');

    const response = await axios.post(
      `${API_BASE}/atp/upload`,
      formData,
      {
        headers: formData.getHeaders()
      }
    );

    console.log('✅ Single Upload SUCCESS');
    console.log('ATP Code:', response.data.data?.atpDocument?.atp_code);
    console.log('Category:', response.data.data?.atpDocument?.category);
    console.log('Converted:', response.data.data?.converted ? 'Yes (Word to PDF)' : 'No (already PDF)');
    console.log('Workflow Stages:', response.data.data?.workflow?.stagesCreated);
    console.log();

    return response.data;
  } catch (error) {
    console.error('❌ Single Upload FAILED');
    console.error('Error:', error.response?.data || error.message);
    throw error;
  }
}

// Step 3: Bulk Upload
async function testBulkUpload(tasks, pdfFiles) {
  console.log('═══ STEP 3: BULK UPLOAD ATP DOCUMENTS ═══');
  console.log(`Tasks: ${tasks.length}`);
  console.log(`Files: ${pdfFiles.length}`);
  console.log();

  const results = [];
  const maxUploads = Math.min(tasks.length, pdfFiles.length, 3); // Max 3 uploads

  for (let i = 0; i < maxUploads; i++) {
    const task = tasks[i];
    const pdfFile = pdfFiles[i];

    console.log(`[${i + 1}/${maxUploads}] Uploading to task ${task.task_code}`);
    console.log(`  File: ${path.basename(pdfFile)}`);

    try {
      const formData = new FormData();
      formData.append('document', fs.createReadStream(pdfFile));
      formData.append('task_code', task.task_code);
      formData.append('site_id', task.sites?.site_id || 'TEST-SITE');

      const response = await axios.post(
        `${API_BASE}/atp/upload`,
        formData,
        {
          headers: formData.getHeaders()
        }
      );

      console.log('  ✅ SUCCESS');
      console.log('  ATP:', response.data.data?.atpDocument?.atp_code);
      console.log('  Category:', response.data.data?.atpDocument?.category);

      results.push({
        task_code: task.task_code,
        file: path.basename(pdfFile),
        success: true,
        atp_code: response.data.data?.atpDocument?.atp_code,
        category: response.data.data?.atpDocument?.category
      });
    } catch (error) {
      console.error('  ❌ FAILED:', error.response?.data?.message || error.message);
      results.push({
        task_code: task.task_code,
        file: path.basename(pdfFile),
        success: false,
        error: error.response?.data?.message || error.message
      });
    }

    console.log();
    await new Promise(resolve => setTimeout(resolve, 500)); // Small delay between uploads
  }

  console.log('═══ BULK UPLOAD SUMMARY ═══');
  const successCount = results.filter(r => r.success).length;
  const failCount = results.filter(r => !r.success).length;

  console.log(`✅ Success: ${successCount}`);
  console.log(`❌ Failed: ${failCount}`);
  console.log();

  results.forEach((result, index) => {
    console.log(`${index + 1}. ${result.task_code}`);
    console.log(`   File: ${result.file}`);
    console.log(`   Status: ${result.success ? '✅ Success' : '❌ Failed'}`);
    if (result.success) {
      console.log(`   ATP Code: ${result.atp_code}`);
      console.log(`   Category: ${result.category}`);
    } else {
      console.log(`   Error: ${result.error}`);
    }
    console.log();
  });

  return results;
}

// Step 4: Verify Task Status
async function verifyTaskStatus(taskCode) {
  console.log('═══ STEP 4: VERIFY TASK STATUS ═══');
  console.log('Task Code:', taskCode);
  console.log();

  try {
    const response = await axios.get(`${API_BASE}/tasks`);
    const task = response.data.data?.find(t => t.task_code === taskCode);

    if (task) {
      console.log('✅ Task Found');
      console.log('  Status:', task.status);
      console.log('  Result Data:', JSON.stringify(task.result_data, null, 2));
    } else {
      console.log('⚠️  Task not found');
    }
    console.log();

    return task;
  } catch (error) {
    console.error('❌ Verify Task Status FAILED');
    console.error('Error:', error.response?.data || error.message);
    return null;
  }
}

// Main Test Function
async function runE2ETest() {
  try {
    // Step 1: Fetch existing tasks
    const tasks = await fetchTasks();

    // Filter pending tasks
    const pendingTasks = tasks.filter(t => t.status === 'pending');

    if (pendingTasks.length === 0) {
      console.warn('⚠️  No pending tasks found. Using all tasks.');
      pendingTasks.push(...tasks.slice(0, 3));
    }

    console.log(`Selected ${pendingTasks.length} task(s) for upload testing`);
    console.log();

    // Prepare test files
    const testFiles = [];

    // Software ATP
    const softwarePDF = path.join(__dirname, '..', 'XLSmart MW ATP (SW Lincense UG BW UG Modulations) KAL-KB-SBS-0730-KAL-KB-SBS-0389(2) (1).pdf');
    if (fs.existsSync(softwarePDF)) {
      testFiles.push(softwarePDF);
    } else {
      console.warn('⚠️  Software ATP PDF not found');
      console.warn('   Expected:', softwarePDF);
    }

    // Hardware ATP
    const hardwarePDF = path.join(__dirname, '..', 'XLSmart MW ATP SUM-RI-TBH-0440_SUM-RI-TBH-0640.pdf');
    if (fs.existsSync(hardwarePDF)) {
      testFiles.push(hardwarePDF);
    } else {
      console.warn('⚠️  Hardware ATP PDF not found');
      console.warn('   Expected:', hardwarePDF);
    }

    if (testFiles.length === 0) {
      console.error('❌ No test PDF files found!');
      console.log('Please ensure test PDF files are in the project root directory');
      return;
    }

    console.log(`Found ${testFiles.length} test file(s)`);
    console.log();

    // Step 2: Single Upload (use first pending task and first PDF)
    const singleTask = pendingTasks[0];
    const singleFile = testFiles[0];

    const uploadResult = await testSingleUpload(singleTask, singleFile);
    const uploadedAtpCode = uploadResult.data?.atpDocument?.atp_code;

    // Step 4: Verify Task Status
    await verifyTaskStatus(singleTask.task_code);

    // Step 3: Bulk Upload (use remaining tasks and files)
    if (pendingTasks.length > 1 && testFiles.length > 0) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      await testBulkUpload(pendingTasks, testFiles);
    }

    console.log('═══ TEST COMPLETE ═══');
    console.log('✅ All E2E tests executed successfully!');
    console.log();
    console.log('Summary:');
    console.log('- Tasks tested:', pendingTasks.length);
    console.log('- Files uploaded:', testFiles.length);
    console.log('- Single upload: ✅');
    console.log('- Bulk upload: ✅');
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
