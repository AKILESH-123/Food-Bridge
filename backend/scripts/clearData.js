const mysql = require('mysql2/promise');
const readline = require('readline');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

function getDbConfig() {
  return {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME,
  };
}

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

rl.question('⚠️  This will DELETE ALL DATA from the database. Type "yes" to confirm: ', async (answer) => {
  rl.close();
  if (answer.trim().toLowerCase() !== 'yes') {
    console.log('Aborted.');
    process.exit(0);
  }
  const conn = await mysql.createConnection(getDbConfig());

  try {
    await conn.execute('SET FOREIGN_KEY_CHECKS = 0');
    await conn.execute('TRUNCATE TABLE notifications');
    await conn.execute('TRUNCATE TABLE pickups');
    await conn.execute('TRUNCATE TABLE donations');
    await conn.execute('TRUNCATE TABLE users');
    await conn.execute('SET FOREIGN_KEY_CHECKS = 1');

    console.log('✅ All data cleared: notifications, pickups, donations, users');
    await conn.end();
    process.exit(0);
  } catch (e) {
    console.error('❌ Error:', e.message);
    await conn.end();
    process.exit(1);
  }
});
