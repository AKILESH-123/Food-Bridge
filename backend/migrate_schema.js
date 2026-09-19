require('dotenv').config();
const { sequelize } = require('./config/db');
require('./models/index');

async function migrate() {
  await sequelize.authenticate();
  console.log('Connected to MySQL for migration check...');

  const userColsToAdd = [
    { name: 'verificationStatus', type: "ENUM('pending', 'verified', 'rejected') DEFAULT 'verified'" },
    { name: 'registrationNumber', type: "VARCHAR(100) NULL" },
    { name: 'registrationType', type: "VARCHAR(100) NULL" },
    { name: 'contactPerson', type: "VARCHAR(100) NULL" },
    { name: 'pincode', type: "VARCHAR(10) NULL" },
    { name: 'serviceArea', type: "VARCHAR(150) NULL" },
    { name: 'serviceRadius', type: "FLOAT DEFAULT 15.0" },
    { name: 'organizationDocument', type: "VARCHAR(255) NULL" },
    { name: 'idProof', type: "VARCHAR(255) NULL" },
    { name: 'verifiedBy', type: "INT NULL" },
    { name: 'verifiedAt', type: "DATETIME NULL" },
    { name: 'rejectionReason', type: "TEXT NULL" },
    { name: 'latitude', type: "FLOAT NULL" },
    { name: 'longitude', type: "FLOAT NULL" },
  ];

  const [existingUserCols] = await sequelize.query('DESCRIBE users;');
  const existingUserColNames = existingUserCols.map((c) => c.Field);

  for (const col of userColsToAdd) {
    if (!existingUserColNames.includes(col.name)) {
      console.log('Adding column to users:', col.name);
      await sequelize.query(`ALTER TABLE users ADD COLUMN ${col.name} ${col.type};`);
    }
  }

  // Create and seed ngo_registries table
  const NgoRegistry = require('./models/NgoRegistry');
  await NgoRegistry.sync();
  const seedData = require('./data/ngoRegistrySeed.json');
  for (const item of seedData) {
    const exists = await NgoRegistry.findOne({ where: { registrationNumber: item.registrationNumber } });
    if (!exists) {
      await NgoRegistry.create(item);
      console.log('Seeded NGO Registry item:', item.registrationNumber, item.ngoName);
    }
  }

  const donationColsToAdd = [
    { name: 'mealType', type: "ENUM('breakfast', 'lunch', 'dinner', 'snacks', 'other') DEFAULT 'other'" },
    { name: 'preparedAt', type: "DATETIME NULL" },
    { name: 'availableFrom', type: "DATETIME NULL" },
    { name: 'pickupDeadline', type: "DATETIME NULL" },
    { name: 'freshnessStatus', type: "ENUM('available', 'pickup_soon', 'urgent', 'expired') DEFAULT 'available'" },
    { name: 'latitude', type: "FLOAT NULL" },
    { name: 'longitude', type: "FLOAT NULL" },
    { name: 'isPriorityAlertSent', type: "TINYINT(1) DEFAULT 0" },
    { name: 'claimedAt', type: "DATETIME NULL" },
    { name: 'pickupConfirmedAt', type: "DATETIME NULL" },
    { name: 'pickedUpAt', type: "DATETIME NULL" },
    { name: 'deliveredAt', type: "DATETIME NULL" },
    { name: 'deliveryPhoto', type: "VARCHAR(255) NULL" },
    { name: 'deliveryRemarks', type: "TEXT NULL" },
    { name: 'mealsDistributed', type: "INT DEFAULT 0" },
    { name: 'storageMethod', type: "ENUM('refrigerated', 'covered', 'room_temperature') DEFAULT 'covered'" },
    { name: 'ingredients', type: "TEXT NULL" },
    { name: 'safeUseHours', type: "FLOAT NULL" },
    { name: 'safetyCheckFailed', type: "TINYINT(1) DEFAULT 0" },
    { name: 'rejectionReason', type: "TEXT NULL" },
    { name: 'failedChecklistItems', type: "TEXT NULL" },
    { name: 'rejectedAt', type: "DATETIME NULL" },
    { name: 'rejectedById', type: "INT NULL" },
  ];

  const [existingDonationCols] = await sequelize.query('DESCRIBE donations;');
  const existingDonationColNames = existingDonationCols.map((c) => c.Field);

  for (const col of donationColsToAdd) {
    if (!existingDonationColNames.includes(col.name)) {
      console.log('Adding column to donations:', col.name);
      await sequelize.query(`ALTER TABLE donations ADD COLUMN ${col.name} ${col.type};`);
    }
  }

  // Ensure donation status enum has all 6 stages plus 'rejected'
  try {
    await sequelize.query(`ALTER TABLE donations MODIFY COLUMN status ENUM('available', 'reserved', 'pickup_confirmed', 'picked_up', 'delivered', 'completed', 'expired', 'cancelled', 'requested', 'assigned', 'rejected') DEFAULT 'available';`);
  } catch (enumErr) {
    console.warn('Enum status alter error:', enumErr.message);
  }

  // Ensure notifications type column is flexible VARCHAR(100) instead of restricted ENUM
  try {
    await sequelize.query(`ALTER TABLE notifications MODIFY COLUMN type VARCHAR(100) NOT NULL;`);
  } catch (notifErr) {
    console.warn('Notification type alter error:', notifErr.message);
  }

  // NGO Requests
  const requestColsToAdd = [
    { name: 'urgency', type: "ENUM('low', 'normal', 'high', 'urgent') DEFAULT 'normal'" },
    { name: 'targetDate', type: "DATETIME NULL" },
    { name: 'targetBeneficiaries', type: "INT DEFAULT 0" },
    { name: 'deliveryAddress', type: "VARCHAR(255) NULL" },
  ];

  const [existingReqCols] = await sequelize.query('DESCRIBE ngo_requests;');
  const existingReqColNames = existingReqCols.map((c) => c.Field);

  for (const col of requestColsToAdd) {
    if (!existingReqColNames.includes(col.name)) {
      console.log('Adding column to ngo_requests:', col.name);
      await sequelize.query(`ALTER TABLE ngo_requests ADD COLUMN ${col.name} ${col.type};`);
    }
  }

  console.log('✅ Migration successfully executed!');
  process.exit(0);
}

migrate().catch((err) => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});
