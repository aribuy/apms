const axios = require('axios');

const BASE_URL = 'http://localhost:3011/api/v1';

async function quickTest() {
  console.log('🚀 Quick EATP RBAC Test\n');

  // Test 1: VENDOR_ADMIN can upload
  console.log('1. Testing VENDOR_ADMIN upload:');
  try {
    const response = await axios.post(`${BASE_URL}/atp/submit`, {
      siteId: 'TEST-001',
      confirmedCategory: 'hardware'
    }, {
      headers: { 'x-user-role': 'VENDOR_ADMIN' }
    });
    console.log('   ✅ VENDOR_ADMIN can upload ATP');
    console.log(`   📄 ATP Created: ${response.data.atpCode}`);
  } catch (error) {
    console.log('   ❌ VENDOR_ADMIN upload failed:', error.response?.data?.message);
  }

  // Test 2: FOP_RTS cannot upload
  console.log('\n2. Testing FOP_RTS upload (should fail):');
  try {
    await axios.post(`${BASE_URL}/atp/submit`, {
      siteId: 'TEST-002',
      confirmedCategory: 'hardware'
    }, {
      headers: { 'x-user-role': 'FOP_RTS' }
    });
    console.log('   ❌ FOP_RTS can upload (BUG!)');
  } catch (error) {
    if (error.response?.status === 403) {
      console.log('   ✅ FOP_RTS correctly denied upload');
    } else {
      console.log('   ⚠️  Unexpected error:', error.response?.data?.message);
    }
  }

  // Test 3: Check templates
  console.log('\n3. Testing template access:');
  try {
    const response = await axios.get(`${BASE_URL}/documents/templates`);
    console.log(`   ✅ Templates: ${response.data.length} available`);
  } catch (error) {
    console.log('   ❌ Template access failed');
  }

  console.log('\n🎯 Quick Test Complete!');
}

quickTest();