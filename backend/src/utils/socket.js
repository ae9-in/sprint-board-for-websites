import { Server } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import Redis from 'ioredis';

let io = null;

export const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      credentials: true
    }
  });

  // Redis Adapter for scaling
  if (process.env.REDIS_URL) {
    const pubClient = new Redis(process.env.REDIS_URL, {
      keyPrefix: 'sprint:',
    });
    const subClient = pubClient.duplicate();

    io.adapter(createAdapter(pubClient, subClient));
    console.log('✓ Socket.io Redis adapter connected');
  }

  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    // Join organization-specific room for scoped updates
    socket.on('join-org', (orgId) => {
      socket.join(`org:${orgId}`);
      console.log(`Socket ${socket.id} joined org:${orgId}`);
    });

    // Join project-specific room
    socket.on('join-project', (projectId) => {
      socket.join(`project:${projectId}`);
      console.log(`Socket ${socket.id} joined project:${projectId}`);
    });

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized');
  }
  return io;
};

export const emitToOrg = (orgId, event, data) => {
  if (io) io.to(`org:${orgId}`).emit(event, data);
};

export const emitToProject = (projectId, event, data) => {
  if (io) io.to(`project:${projectId}`).emit(event, data);
};

export const emitToUser = (userId, event, data) => {
  // Assuming users join a room named after their ID
  if (io) io.to(`user:${userId}`).emit(event, data);
};
