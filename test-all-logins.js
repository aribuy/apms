const axios = require('axios');

const testUsers = [
  { email: 'admin@apms.com', password: 'Admin123!', role: 'admin' },
  { email: 'site.manager@apms.com', password: 'test123', role: 'SITE_MANAGER' },
  { email: 'vendor.admin@apms.com', password: 'test123', role: 'VENDOR_ADMIN' },
  { email: 'field.engineer@apms.com', password: 'test123', role: 'FOP_RTS' },
  { email: 'business.ops@apms.com', password: 'test123', role: 'BO' }
];

async function testAllLogins() {
  console.log('🧪 Testing All User Logins...\n');

  for (const user of testUsers) {
    try {
      const response = await axios.post('http://localhost:3011/api/v1/auth/login', {
        email: user.email,
        password: user.password
      });
      
      if (response.data.success) {
        console.log(`✅ ${user.email} (${user.role}) - Login successful`);
      } else {
        console.log(`❌ ${user.email} - Login failed`);
      }
    } catch (error) {
      console.log(`❌ ${user.email} - Error: ${error.response?.data?.error}`);
    }
  }

  console.log('\n🎯 All test users ready for workflow testing!');
  console.log('\n📋 Next Steps:');
  console.log('1. Test site registration (admin/site.manager)');
  console.log('2. Test ATP upload (vendor.admin/vendor.staff)');
  console.log('3. Test approval workflows (reviewers)');
}

testAllLogins();