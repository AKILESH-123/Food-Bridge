const http = require('http');
require('dotenv').config();

const { connectDB } = require('./config/db');
const { initSocket } = require('./utils/socket');
const app = require('./app');

// Load models & associations before syncing
require('./models/index');

const server = http.createServer(app);

// Initialize Socket.io
initSocket(server);

const PORT = process.env.PORT || 5000;
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use. Run: Get-Process -Name node | Stop-Process -Force`);
    process.exit(1);
  } else {
    throw err;
  }
});
connectDB()
  .then(() => {
    server.listen(PORT, () => {
      console.log(`\n🚀 FoodBridge Server running on port ${PORT}`);
      console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🌐 Client URL: ${process.env.CLIENT_URL || 'http://localhost:3000'}\n`);
    });
  })
  .catch((error) => {
    console.error(`❌ Startup error: ${error.message}`);
    process.exit(1);
  });

module.exports = server;
