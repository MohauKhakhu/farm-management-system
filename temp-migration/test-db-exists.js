const { Client } = require('pg');

async function testDatabase() {
  // First test connection to postgres database
  const client = new Client({
    host: 'localhost',
    port: 5432,
    database: 'postgres',  // Connect to default postgres database first
    user: 'postgres',
    password: 'password',  // Using current password
  });
  
  try {
    await client.connect();
    console.log('✅ Connected to PostgreSQL server');
    
    // Check if farm_management database exists
    const result = await client.query(`
      SELECT 1 FROM pg_database WHERE datname = 'farm_management'
    `);
    
    if (result.rows.length > 0) {
      console.log('✅ farm_management database exists');
    } else {
      console.log('❌ farm_management database does not exist');
      console.log('Creating farm_management database...');
      await client.query('CREATE DATABASE farm_management');
      console.log('✅ farm_management database created');
    }
    
    await client.end();
  } catch (err) {
    console.log('❌ Connection failed:', err.message);
  }
}

testDatabase();
