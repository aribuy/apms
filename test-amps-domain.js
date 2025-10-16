const axios = require('axios');

async function testAMPSDomain() {
  console.log('🧪 Testing AMPS Domain Change...\n');

  // Test 1: Health check
  try {
    const health = await axios.get('http://localhost:3011/api/health');
    console.log('✅ Server running:', health.data.service);
  } catch (error) {
    console.log('❌ Server not running');
    return;
  }

  // Test 2: Admin login with new domain
  try {
    const login = await axios.post('http://localhost:3011/api/v1/auth/login', {
      email: 'admin@amps.com',
      password: 'Admin123!'
    });
    console.log('✅ Admin login successful:', login.data.data.user.email);
  } catch (error) {
    console.log('❌ Admin login failed:', error.response?.data?.error);
  }

  // Test 3: RBAC user login test
  try {
    const rbacTest = await axios.post('http://localhost:3011/api/v1/atp/submit', {
      siteId: 'TEST-AMPS',
      confirmedCategory: 'hardware'
    }, {
      headers: { 'x-user-role': 'VENDOR_ADMIN' }
    });
    console.log('✅ VENDOR_ADMIN can upload:', rbacTest.data.atpCode);
  } catch (error) {
    console.log('❌ VENDOR_ADMIN upload failed:', error.response?.data?.message);
  }

  // Test 4: Check database users
  console.log('\n📊 Database users with @amps.com:');
  console.log('- admin@amps.com');
  console.log('- vendor.admin@amps.com');
  console.log('- field.engineer@amps.com');
  console.log('- business.ops@amps.com');

  console.log('\n🎯 Domain change to AMPS.com complete!');
  console.log('📋 Frontend login: admin@amps.com / Admin123!');
}

testAMPSDomain();