const { Client } = require('pg');
const passwords = ['', 'postgres', 'password', 'admin', 'Postgres', 'Password', 'root', '123456', 'postgresql'];

async function testPassword(password) {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    database: 'farm_management',
    user: 'postgres',
    password: password,
  });
  
  try {
    await client.connect();
    console.log(`‚úÖ SUCCESS with password: "${password}"`);
    await client.end();
    return true;
  } catch (err) {
    console.log(`‚ùå FAILED with password: "${password}"`);
    return false;
  }
}

async function testAll() {
  console.log('Testing PostgreSQL passwords...\n');
  for (const password of passwords) {
    const success = await testPassword(password);
    if (success) {
      console.log(`\nÌæâ Use this password in your .env file: "${password}"`);
      
      // Update the .env file with the correct password
      const fs = require('fs');
      let envContent = fs.readFileSync('.env', 'utf8');
      envContent = envContent.replace(/DB_PASSWORD=.*/, `DB_PASSWORD=${password}`);
      fs.writeFileSync('.env', envContent);
      console.log('‚úÖ .env file updated with correct password!');
      
      process.exit(0);
    }
  }
  console.log('\nÌ¥ê None of the common passwords worked. You need to reset your PostgreSQL password.');
  process.exit(1);
}

testAll();
