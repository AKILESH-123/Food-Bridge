const mysql = require('mysql2/promise');
const readline = require('readline');

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

rl.question('⚠️  This will DELETE ALL DATA from the database. Type "yes" to confirm: ', async (answer) => {
  rl.close();
  if (answer.trim().toLowerCase() !== 'yes') {
    console.log('Aborted.');
    process.exit(0);
  }

  const conn = await mysql.createConnection({
    host: 'localhost', port: 3306, user: 'root', password: '2009', database: 'foodbridge'
  });

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
