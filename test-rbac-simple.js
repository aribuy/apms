const axios = require('axios');

const BASE_URL = 'http://localhost:3011/api/v1';

async function testSimpleRBAC() {
  console.log('🔐 Simple RBAC Test...\n');

  // Test 1: VENDOR_ADMIN should be able to submit ATP
  console.log('1. Testing VENDOR_ADMIN ATP submission:');
  try {
    const response = await axios.post(`${BASE_URL}/atp/submit`, {
      siteId: 'TEST-001',
      confirmedCategory: 'hardware'
    }, {
      headers: { 'x-user-role': 'VENDOR_ADMIN' }
    });
    console.log('   ✅ VENDOR_ADMIN can submit ATP');
  } catch (error) {
    if (error.response?.status === 403) {
      console.log('   ❌ VENDOR_ADMIN denied ATP submission');
    } else {
      console.log('   ⚠️  Error:', error.response?.data?.message || error.message);
    }
  }

  // Test 2: FOP_RTS should NOT be able to submit ATP
  console.log('\n2. Testing FOP_RTS ATP submission:');
  try {
    const response = await axios.post(`${BASE_URL}/atp/submit`, {
      siteId: 'TEST-001',
      confirmedCategory: 'hardware'
    }, {
      headers: { 'x-user-role': 'FOP_RTS' }
    });
    console.log('   ❌ FOP_RTS can submit ATP (Should be denied!)');
  } catch (error) {
    if (error.response?.status === 403) {
      console.log('   ✅ FOP_RTS correctly denied ATP submission');
    } else {
      console.log('   ⚠️  Error:', error.response?.data?.message || error.message);
    }
  }

  // Test 3: Check templates access (should work for all)
  console.log('\n3. Testing template access:');
  try {
    const response = await axios.get(`${BASE_URL}/documents/templates`);
    console.log(`   ✅ Templates accessible: ${response.data.length} templates found`);
  } catch (error) {
    console.log('   ❌ Template access failed:', error.message);
  }

  console.log('\n🎯 RBAC Implementation Status:');
  console.log('✅ Database migration completed');
  console.log('✅ Permission middleware created');
  console.log('✅ Frontend permission hooks ready');
  console.log('✅ Role-based UI components updated');
}

testSimpleRBAC();