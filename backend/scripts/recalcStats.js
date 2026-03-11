const mysql = require('mysql2/promise');

(async () => {
  const conn = await mysql.createConnection({
    host: 'localhost', port: 3306, user: 'root', password: '2009', database: 'foodbridge'
  });
  try {
    // Recalculate donors: totalDonations = non-cancelled/expired, impactPoints = creation(50) + completion(20)
    await conn.execute(`
      UPDATE users u
      SET
        totalDonations = (
          SELECT COUNT(*) FROM donations d
          WHERE d.donorId = u.id AND d.status NOT IN ('cancelled','expired')
        ),
        impactPoints = (
          (SELECT COUNT(*) FROM donations d2 WHERE d2.donorId = u.id AND d2.status NOT IN ('cancelled','expired')) * 50
          + (SELECT COUNT(*) FROM donations d3 WHERE d3.donorId = u.id AND d3.status = 'completed') * 20
        )
      WHERE u.role = 'donor'
    `);

    // Recalculate NGOs: totalPickups = completed pickups, impactPoints = completion(30)
    await conn.execute(`
      UPDATE users u
      SET
        totalPickups = (
          SELECT COUNT(*) FROM donations d
          WHERE d.assignedToId = u.id AND d.status = 'completed'
        ),
        impactPoints = (
          (SELECT COUNT(*) FROM donations d2 WHERE d2.assignedToId = u.id AND d2.status = 'completed') * 30
        )
      WHERE u.role = 'ngo'
    `);

    const [rows] = await conn.execute(
      'SELECT id, name, role, totalDonations, totalPickups, impactPoints FROM users'
    );
    console.log('Updated user stats:');
    console.log(JSON.stringify(rows, null, 2));
    await conn.end();
    process.exit(0);
  } catch (e) {
    console.error('Error:', e.message); await conn.end();
    process.exit(1);
  }
})();
