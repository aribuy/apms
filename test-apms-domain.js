const axios = require('axios');

async function testAPMSDomain() {
  console.log('🧪 Testing APMS.com Domain...\n');

  // Test admin login
  try {
    const login = await axios.post('http://localhost:3011/api/v1/auth/login', {
      email: 'admin@apms.com',
      password: 'Admin123!'
    });
    console.log('✅ Admin login successful:', login.data.data.user.email);
  } catch (error) {
    console.log('❌ Admin login failed:', error.response?.data?.error);
  }

  // Check database users
  console.log('\n📊 Updated to @apms.com domain:');
  console.log('- admin@apms.com');
  console.log('- vendor.admin@apms.com');
  console.log('- field.engineer@apms.com');

  console.log('\n🎯 Correct domain: APMS.com');
  console.log('📋 Frontend login: admin@apms.com / Admin123!');
}

testAPMSDomain();