let io;

const initSocket = (server) => {
  const { Server } = require('socket.io');

  io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
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
    const users = await User.find({ role, isActive: true }, '_id');
    users.forEach((user) => {
      io.to(user._id.toString()).emit(event, data);
    });
  } catch (err) {
    console.error('emitToRole error:', err.message);
  }
};

module.exports = { initSocket, getIO, emitToUser, emitToAll, emitToRole };
