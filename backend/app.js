const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const { isAllowedOrigin } = require('./config/origins');

const app = express();
const frontendBuildPath = path.resolve(__dirname, '../frontend/build');
const shouldServeFrontend =
  process.env.SERVE_FRONTEND !== 'false' && fs.existsSync(path.join(frontendBuildPath, 'index.html'));

app.use(
  cors({
    origin(origin, callback) {
      return callback(null, isAllowedOrigin(origin));
    },
    credentials: true,
  })
);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/donations', require('./routes/donations'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/users', require('./routes/users'));
app.use('/api/stats', require('./routes/stats'));

if (shouldServeFrontend) {
  app.use(express.static(frontendBuildPath));
}

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: '🌱 FoodBridge API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
});

if (shouldServeFrontend) {
  app.get(/^(?!\/api\/).*/, (req, res) => {
    res.sendFile(path.join(frontendBuildPath, 'index.html'));
  });
}

// Global error handler
app.use((err, req, res, next) => {
  console.error('❌ Server error:', err.stack);
  res.status(500).json({ success: false, message: err.message || 'Internal Server Error' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

module.exports = app;