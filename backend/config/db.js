const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD || '',
  {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 3306,
    dialect: 'mysql',
    logging: false,
    dialectOptions: {
      connectTimeout: parseInt(process.env.DB_CONNECT_TIMEOUT_MS || '10000', 10),
    },
    pool: {
      max: 10,
      min: 0,
      acquire: 15000,
      idle: 10000,
    },
  }
);

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ MySQL Connected successfully');

    const shouldSyncSchema = process.env.DB_SYNC === 'true' || process.env.NODE_ENV !== 'production';
    if (shouldSyncSchema) {
      await sequelize.sync({ alter: true });
      console.log('✅ Database tables synced');
    }
  } catch (error) {
    console.error(`❌ MySQL connection error: ${error.message}`);
    throw error;
  }
};

module.exports = { sequelize, connectDB };
