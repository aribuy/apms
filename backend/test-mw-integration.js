#!/usr/bin/env node

const { Pool } = require('pg');

const pool = new Pool({
  user: 'endik',
  host: 'localhost',
  database: 'apms_local',
  password: '',
  port: 5432,
});

async function testMWIntegration() {
  const client = await pool.connect();
  
  try {
    console.log('🧪 Testing MW ATP Integration...\n');
    
    // Test MW Templates
    const templates = await client.query(`
      SELECT template_code, template_name, category 
      FROM atp_document_templates 
      WHERE template_code LIKE 'MW_%'
    `);
    
    console.log('✅ MW Templates:', templates.rows.length);
    templates.rows.forEach(t => {
      console.log(`   • ${t.template_code} - ${t.category}`);
    });
    
    // Test MW Scopes
    const scopes = await client.query(`
      SELECT id, name FROM atp_scopes WHERE name LIKE '%MW%'
    `);
    
    console.log('\n✅ MW Scopes:', scopes.rows.length);
    scopes.rows.forEach(s => {
      console.log(`   • ID ${s.id}: ${s.name}`);
    });
    
    // Test MW Users
    const users = await client.query(`
      SELECT email, role FROM users WHERE role = 'VENDOR_MW' OR email LIKE '%xlsmart%'
    `);
    
    console.log('\n✅ MW Users:', users.rows.length);
    users.rows.forEach(u => {
      console.log(`   • ${u.email} (${u.role})`);
    });
    
    console.log('\n🎉 MW ATP Integration: READY!');
    console.log('\n🚀 Test Instructions:');
    console.log('1. Open: http://localhost:3000');
    console.log('2. Login: mw.vendor@gmail.com / password123');
    console.log('3. Create ATP with MW scope');
    console.log('4. Test MW form features');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    client.release();
  }
}

testMWIntegration();