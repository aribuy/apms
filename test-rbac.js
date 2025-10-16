const axios = require('axios');

const BASE_URL = 'http://localhost:3011/api/v1';

const testRoles = [
  { role: 'VENDOR_ADMIN', name: 'Vendor Admin' },
  { role: 'FOP_RTS', name: 'Field Engineer' },
  { role: 'RTH', name: 'Hardware Manager' },
  { role: 'BO', name: 'Business Operations' },
  { role: 'HEAD_NOC', name: 'NOC Head' }
];

async function testRBACPermissions() {
  console.log('🔐 Testing ATP Role-Based Access Control...\n');

  for (const testRole of testRoles) {
    console.log(`\n👤 Testing ${testRole.name} (${testRole.role}):`);
    
    // Test ATP submission (should only work for VENDOR roles)
    try {
      const submitResponse = await axios.post(`${BASE_URL}/atp/submit`, {
        siteId: 'TEST-001',
        confirmedCategory: 'hardware',
        projectCode: 'TEST'
      }, {
        headers: { 'x-user-role': testRole.role }
      });
      console.log('  ✅ ATP Submit: ALLOWED');
    } catch (error) {
      if (error.response?.status === 403) {
        console.log('  ❌ ATP Submit: DENIED (Expected for non-vendor roles)');
      } else {
        console.log('  ⚠️  ATP Submit: ERROR -', error.response?.data?.message || error.message);
      }
    }

    // Test file upload (should only work for VENDOR roles)
    try {
      const uploadResponse = await axios.post(`${BASE_URL}/documents/upload/test-id`, {}, {
        headers: { 'x-user-role': testRole.role }
      });
      console.log('  ✅ File Upload: ALLOWED');
    } catch (error) {
      if (error.response?.status === 403) {
        console.log('  ❌ File Upload: DENIED (Expected for non-vendor roles)');
      } else {
        console.log('  ⚠️  File Upload: ERROR -', error.response?.data?.message || error.message);
      }
    }

    // Test ATP review (should only work for review roles)
    try {
      const reviewResponse = await axios.post(`${BASE_URL}/atp/test-id/review`, {
        stageId: 'test-stage',
        decision: 'approve',
        comments: 'Test review'
      }, {
        headers: { 'x-user-role': testRole.role }
      });
      console.log('  ✅ ATP Review: ALLOWED');
    } catch (error) {
      if (error.response?.status === 403) {
        console.log('  ❌ ATP Review: DENIED (Expected for vendor roles)');
      } else {
        console.log('  ⚠️  ATP Review: ERROR -', error.response?.data?.message || error.message);
      }
    }
  }

  console.log('\n📊 RBAC Test Summary:');
  console.log('- VENDOR_ADMIN: Should have upload access only');
  console.log('- FOP_RTS/RTH: Should have review access only');
  console.log('- BO/HEAD_NOC: Should have review access only');
  console.log('\n🎯 Expected Behavior:');
  console.log('✅ Upload permissions: VENDOR roles only');
  console.log('✅ Review permissions: Approval workflow roles only');
  console.log('❌ Cross-role access: Properly denied');
}

testRBACPermissions();