#!/usr/bin/env node

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Database configuration
const pool = new Pool({
  user: 'endik',
  host: 'localhost',
  database: 'apms_local',
  password: '',
  port: 5432,
});

async function installMWTemplates() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Installing MW ATP Templates for XLSmart...');
    
    // Read the SQL file
    const sqlFile = path.join(__dirname, '../MW_ATP_TEMPLATE_IMPLEMENTATION.sql');
    const sql = fs.readFileSync(sqlFile, 'utf8');
    
    // Execute the SQL
    await client.query(sql);
    
    console.log('✅ MW ATP Templates installed successfully!');
    
    // Verify installation
    const result = await client.query(`
      SELECT template_code, template_name, category, version 
      FROM atp_document_templates 
      WHERE template_code LIKE 'MW_%'
      ORDER BY template_code
    `);
    
    console.log('\n📋 Installed MW Templates:');
    result.rows.forEach(template => {
      console.log(`  • ${template.template_code} - ${template.template_name} (${template.category} v${template.version})`);
    });
    
    // Check MW scopes
    const scopeResult = await client.query(`
      SELECT name, description 
      FROM atp_scopes 
      WHERE name LIKE '%MW%'
      ORDER BY name
    `);
    
    console.log('\n🎯 Available MW Scopes:');
    scopeResult.rows.forEach(scope => {
      console.log(`  • ${scope.name} - ${scope.description}`);
    });
    
    console.log('\n🎉 MW ATP System ready for XLSmart integration!');
    console.log('\nNext steps:');
    console.log('1. Start the backend server: npm start');
    console.log('2. Start the frontend: cd ../frontend && npm start');
    console.log('3. Login with MW vendor account to test MW ATP forms');
    
  } catch (error) {
    console.error('❌ Error installing MW templates:', error);
    throw error;
  } finally {
    client.release();
  }
}

async function main() {
  try {
    await installMWTemplates();
    process.exit(0);
  } catch (error) {
    console.error('Installation failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { installMWTemplates };