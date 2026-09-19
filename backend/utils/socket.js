let io;

const { isAllowedOrigin } = require('../config/origins');

const initSocket = (server) => {
  const { Server } = require('socket.io');

  io = new Server(server, {
    cors: {
      origin(origin, callback) {
        return callback(null, isAllowedOrigin(origin));
      },
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  io.on('connection', (socket) => {
    console.log(`🔌 Client connected: ${socket.id}`);

    socket.on('join', (userId) => {
      if (!userId) return;
      socket.join(userId.toString());
      console.log(`👤 User ${userId} joined room`);
    });

    socket.on('disconnect', () => {
      console.log(`🔌 Client disconnected: ${socket.id}`);
    });
  });

  return io;
};

const getIO = () => {
  if (!io) throw new Error('Socket.io not initialized');
  return io;
};

const emitToUser = (userId, event, data) => {
  if (io) {
    io.to(userId.toString()).emit(event, data);
  }
};

const emitToAll = (event, data) => {
  if (io) {
    io.emit(event, data);
  }
};

const emitToRole = async (role, event, data) => {
  if (!io) return;
  try {
    const User = require('../models/User');
    const users = await User.findAll({ where: { role, isActive: true }, attributes: ['id'] });
    users.forEach((user) => {
      io.to(user.id.toString()).emit(event, data);
    });
  } catch (err) {
    console.error('emitToRole error:', err.message);
  }
};

const emitToVerifiedNGOs = async (event, data, donorCoords = null) => {
  if (!io) return;
  try {
    const User = require('../models/User');
    const { calculateDistance } = require('./distance');

    const ngos = await User.findAll({
      where: {
        role: 'ngo',
        isActive: true,
        verificationStatus: 'verified',
      },
      attributes: ['id', 'latitude', 'longitude', 'serviceRadius', 'organizationName'],
    });

    ngos.forEach((ngo) => {
      let distanceKm = null;
      if (donorCoords && donorCoords.lat && donorCoords.lng && ngo.latitude && ngo.longitude) {
        distanceKm = calculateDistance(donorCoords.lat, donorCoords.lng, ngo.latitude, ngo.longitude);
      }
      io.to(ngo.id.toString()).emit(event, { ...data, distanceKm });
    });
  } catch (err) {
    console.error('emitToVerifiedNGOs error:', err.message);
  }
};

module.exports = { initSocket, getIO, emitToUser, emitToAll, emitToRole, emitToVerifiedNGOs };
