
// backend/src/socket.ts
import { Server as IOServer } from 'socket.io';
import http from 'http';
import jwt from 'jsonwebtoken';

let io: IOServer | null = null;

/**
 * Initialize Socket.IO with JWT authentication
 */
export const initSocket = (server: http.Server) => {
  io = new IOServer(server, {
    cors: { origin: process.env.FRONTEND_ORIGIN || '*' },
  });

  // Middleware: decode JWT if provided
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(); // allow unauthenticated sockets (optional)
    try {
      const payload = jwt.verify(
        token,
        process.env.JWT_SECRET as string
      ) as any;
      socket.data.userId = payload.userId;
      return next();
    } catch {
      return next(); // or: next(new Error("Unauthorized"))
    }
  });

  io.on('connection', (socket) => {
    const uid = socket.data.userId;
    if (uid) {
      // join a private room for this user
      socket.join(`user_${uid}`);
    }

    socket.on('disconnect', () => {
      // optional cleanup
    });
  });

  return io;
};

/**
 * Safe accessor for Socket.IO instance
 */
export const getIO = (): IOServer => {
  if (!io) throw new Error('Socket.io not initialized');
  return io;
};

