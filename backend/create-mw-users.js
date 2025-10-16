const { Pool } = require('pg');
const bcrypt = require('bcrypt');

const pool = new Pool({
  user: 'endik',
  host: 'localhost', 
  database: 'apms_local',
  password: '',
  port: 5432,
});

async function createMWUsers() {
  const client = await pool.connect();
  
  try {
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    // MW Vendor
    await client.query(`
      INSERT INTO users (email, password, role, organization, is_active) 
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (email) DO UPDATE SET 
        role = EXCLUDED.role,
        organization = EXCLUDED.organization
    `, ['mw.vendor@gmail.com', hashedPassword, 'VENDOR_MW', 'MW Vendor Corp', true]);
    
    console.log('✅ MW Vendor user created: mw.vendor@gmail.com');
    
    // Verify
    const result = await client.query('SELECT email, role FROM users WHERE email = $1', ['mw.vendor@gmail.com']);
    console.log('✅ Verified:', result.rows[0]);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    client.release();
    pool.end();
  }
}

createMWUsers();