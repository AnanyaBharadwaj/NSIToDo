

import { Server as IOServer } from 'socket.io';
import http from 'http';
import jwt from 'jsonwebtoken';

let io: IOServer | null = null;



export const initSocket = (server: http.Server) => {
  io = new IOServer(server, {
    cors: { origin: process.env.FRONTEND_ORIGIN || '*' },
  });

  // Middleware: decode JWT if provided
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(); 
    try {
      const payload = jwt.verify(
        token,
        process.env.JWT_SECRET as string
      ) as any;
      socket.data.userId = payload.userId;
      return next();
    } catch {
      return next(); 
    }
  });

  io.on('connection', (socket) => {
    const uid = socket.data.userId;
    if (uid) {
      
      socket.join(`user_${uid}`);
    }

    socket.on('disconnect', () => {
      
    });
  });

  return io;
};


export const getIO = (): IOServer => {
  if (!io) throw new Error('Socket.io not initialized');
  return io;
};

