import { Server } from 'socket.io';
import { getToken } from 'next-auth/jwt';

let io;

export function initializeWebSocket(server) {
  io = new Server(server, {
    path: '/api/ws',
    cors: {
      origin: process.env.NEXTAUTH_URL,
      methods: ['GET', 'POST'],
    },
  });

  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = await getToken({ 
        req: socket.handshake, 
        secret: process.env.NEXTAUTH_SECRET 
      });

      if (!token) {
        return next(new Error('Authentication error'));
      }

      socket.user = token;
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    // Join user's personal room
    socket.join(`user:${socket.user.id}`);

    socket.on('join:appointment', (appointmentId) => {
      socket.join(`appointment:${appointmentId}`);
    });

    socket.on('leave:appointment', (appointmentId) => {
      socket.leave(`appointment:${appointmentId}`);
    });

    socket.on('disconnect', () => {
      // Handle cleanup
    });
  });

  return io;
}

export function getIO() {
  if (!io) {
    throw new Error('Socket.io not initialized');
  }
  return io;
} 