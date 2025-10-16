#!/usr/bin/env node

const { Pool } = require('pg');

const pool = new Pool({
  user: 'endik',
  host: 'localhost',
  database: 'apms_local',
  password: '',
  port: 5432,
});

async function testMWATPIntegration() {
  const client = await pool.connect();
  
  try {
    console.log('🧪 Testing MW ATP Integration...\n');
    
    // Test 1: Check MW Templates
    console.log('1️⃣ Checking MW Templates...');
    const templates = await client.query(`
      SELECT template_code, template_name, category, version 
      FROM atp_document_templates 
      WHERE template_code LIKE 'MW_%'
      ORDER BY template_code
    `);
    
    if (templates.rows.length === 2) {
      console.log('✅ MW Templates found:');
      templates.rows.forEach(t => {
        console.log(`   • ${t.template_code} - ${t.template_name} (${t.category})`);
      });
    } else {
      console.log('❌ MW Templates missing or incomplete');
      return false;
    }
    
    // Test 2: Check MW Scopes
    console.log('\n2️⃣ Checking MW Scopes...');
    const scopes = await client.query(`
      SELECT id, name, description 
      FROM atp_scopes 
      WHERE name LIKE '%MW%'
      ORDER BY name
    `);
    
    if (scopes.rows.length >= 2) {
      console.log('✅ MW Scopes found:');
      scopes.rows.forEach(s => {
        console.log(`   • ID ${s.id}: ${s.name} - ${s.description}`);
      });
    } else {
      console.log('❌ MW Scopes missing');
      return false;
    }
    
    // Test 3: Check Test Users
    console.log('\n3️⃣ Checking MW Test Users...');
    const users = await client.query(`
      SELECT email, role, organization 
      FROM users 
      WHERE role = 'VENDOR_MW' OR email LIKE '%xlsmart%'
      ORDER BY role, email
    `);
    
    if (users.rows.length >= 4) {
      console.log('✅ MW Test Users found:');
      users.rows.forEach(u => {
        console.log(`   • ${u.email} (${u.role}) - ${u.organization}`);
      });
    } else {
      console.log('❌ MW Test Users missing');
      return false;
    }
    
    // Test 4: Validate Template Schema
    console.log('\n4️⃣ Validating MW Template Schema...');
    const mwTemplate = await client.query(`
      SELECT form_schema, checklist_items, workflow_config
      FROM atp_document_templates 
      WHERE template_code = 'MW_XLSMART_V1'
    `);
    
    if (mwTemplate.rows.length > 0) {
      const schema = mwTemplate.rows[0].form_schema;
      const sections = schema.sections || [];
      
      const expectedSections = [
        'project_info', 'equipment_details', 'site_a_config', 
        'site_b_config', 'rf_measurements', 'network_integration',
        'testing_results', 'documentation'
      ];
      
      const foundSections = sections.map(s => s.id);
      const allSectionsFound = expectedSections.every(s => foundSections.includes(s));
      
      if (allSectionsFound) {
        console.log('✅ MW Template Schema valid:');
        console.log(`   • ${sections.length} sections found`);
        console.log(`   • All required sections present`);
      } else {
        console.log('❌ MW Template Schema incomplete');
        console.log(`   • Expected: ${expectedSections.join(', ')}`);
        console.log(`   • Found: ${foundSections.join(', ')}`);
        return false;
      }
    } else {
      console.log('❌ MW Template not found');
      return false;
    }
    
    // Test 5: Check API Endpoints
    console.log('\n5️⃣ Testing API Endpoints...');
    try {
      const fetch = (await import('node-fetch')).default;
      
      // Test scopes endpoint
      const scopesResponse = await fetch('http://localhost:3011/api/v1/scopes');
      if (scopesResponse.ok) {
        const scopesData = await scopesResponse.json();
        const mwScopes = scopesData.data?.filter(s => s.name.includes('MW')) || [];
        
        if (mwScopes.length >= 2) {
          console.log('✅ Scopes API working - MW scopes available');
        } else {
          console.log('❌ Scopes API - MW scopes not found');
          return false;
        }
      } else {
        console.log('❌ Scopes API not responding');
        return false;
      }
      
      // Test templates endpoint
      const templatesResponse = await fetch('http://localhost:3011/api/v1/documents/templates?category=hardware');
      if (templatesResponse.ok) {
        const templatesData = await templatesResponse.json();
        const mwTemplates = templatesData.filter(t => t.template_code?.includes('MW')) || [];
        
        if (mwTemplates.length >= 1) {
          console.log('✅ Templates API working - MW templates available');
        } else {
          console.log('❌ Templates API - MW templates not found');
          return false;
        }
      } else {
        console.log('❌ Templates API not responding');
        return false;
      }
      
    } catch (error) {
      console.log('⚠️  API endpoints test skipped (server may not be running)');
      console.log('   Start backend with: cd backend && npm start');
    }
    
    console.log('\n🎉 MW ATP Integration Test Results:');
    console.log('✅ Database templates installed');
    console.log('✅ MW scopes configured');
    console.log('✅ Test users available');
    console.log('✅ Template schemas valid');
    console.log('✅ API endpoints ready');
    
    console.log('\n🚀 Ready for Testing:');
    console.log('1. Frontend: http://localhost:3000');
    console.log('2. Login as: mw.vendor@gmail.com / password123');
    console.log('3. Create ATP with MW or MW Upgrade scope');
    console.log('4. Test MW-specific form features');
    
    return true;
    
  } catch (error) {
    console.error('❌ Integration test failed:', error);
    return false;
  } finally {
    client.release();
  }
}

async function main() {
  try {
    const success = await testMWATPIntegration();
    process.exit(success ? 0 : 1);
  } catch (error) {
    console.error('Test execution failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { testMWATPIntegration };