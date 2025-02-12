import { Server } from 'socket.io';
import { getToken } from 'next-auth/jwt';
import { createAuditLog } from './audit';
import { rateLimit } from '../utils/rateLimit';

let io;

const messageRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30 // limit each user to 30 messages per minute
});

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
        return next(new Error('Authentication required'));
      }

      socket.user = token;
      next();
    } catch (error) {
      next(new Error('Authentication failed'));
    }
  });

  io.on('connection', (socket) => {
    // Join user's personal room
    socket.join(`user:${socket.user.id}`);

    // Handle chat messages
    socket.on('message', async (data) => {
      try {
        await messageRateLimit({ headers: { 'x-forwarded-for': socket.handshake.address } });
        
        // Emit message to recipient
        io.to(`user:${data.recipientId}`).emit('message', {
          ...data,
          senderId: socket.user.id
        });

        // Audit log
        await createAuditLog({
          userId: socket.user.id,
          action: 'send_message',
          entityType: 'message',
          details: {
            recipientId: data.recipientId,
            type: data.type
          }
        });
      } catch (error) {
        socket.emit('error', { message: 'Message rate limit exceeded' });
      }
    });

    // Handle video call signaling
    socket.on('call:signal', (data) => {
      io.to(`user:${data.recipientId}`).emit('call:signal', {
        ...data,
        senderId: socket.user.id
      });
    });

    socket.on('disconnect', () => {
      // Cleanup and logging
      createAuditLog({
        userId: socket.user.id,
        action: 'websocket_disconnect',
        entityType: 'session'
      });
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