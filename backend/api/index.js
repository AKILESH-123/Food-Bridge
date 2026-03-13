require('dotenv').config();

let connectDB;
let app;
let appInitialized = false;

let dbReadyPromise;

function resolveClientOrigin(req) {
  const configuredOrigin = process.env.CLIENT_URL?.trim();
  return configuredOrigin || req.headers.origin || '*';
}

function ensureAppInitialized() {
  if (appInitialized) {
    return;
  }

  require('mysql2');
  require('mysql2/promise');

  ({ connectDB } = require('../config/db'));
  app = require('../app');

  // Load models and associations once at startup
  require('../models/index');

  appInitialized = true;
}

function ensureDbConnection() {
  if (!dbReadyPromise) {
    const dbInitTimeoutMs = parseInt(process.env.DB_INIT_TIMEOUT_MS || '4000', 10);

    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Database initialization timed out after ${dbInitTimeoutMs}ms`));
      }, dbInitTimeoutMs);
    });

    dbReadyPromise = Promise.race([connectDB(), timeoutPromise]).catch((error) => {
      dbReadyPromise = null;
      throw error;
    });
  }
  return dbReadyPromise;
}

module.exports = async (req, res) => {
  try {
    ensureAppInitialized();

    if (req.url?.startsWith('/api/health')) {
      return app(req, res);
    }

    await ensureDbConnection();
    return app(req, res);
  } catch (error) {
    const corsOrigin = resolveClientOrigin(req);
    res.setHeader('Access-Control-Allow-Origin', corsOrigin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Vary', 'Origin');

    return res.status(500).json({
      success: false,
      message: 'Database initialization failed',
      details: error.message,
    });
  }
};