const express = require("express");
const cookieParser = require("cookie-parser");
const morgan = require("morgan");
const cors = require("cors");
const dotenv = require("dotenv");
dotenv.config();

// Routes
const authRoutes = require("./routes/auth").default;
const userRoutes = require("./routes/users").default;
const uploadRoutes = require("./routes/uploads").default;
const todosRoutes = require("./routes/todos").default;
const filesRoutes = require("./routes/files").default;
const adminRoutes = require("./routes/admin").default;
const notificationsRoutes = require("./routes/notifications").default;

// Middlewares
const { errorHandler } = require("./middlewares/errorHandler");
const { logger } = require("./logger");

// Socket
const { initSocket } = require("./socket");

import type { NextFunction, Request, Response } from "express";
import http from "http";

const app = express();

// Built-in middlewares
app.use(express.json());
app.use(cookieParser());
app.use(morgan("dev"));

// CORS (allow credentials for cookies)
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  })
);

// Disable caching for all responses
app.use((req: Request, res: Response, next: NextFunction) => {
  res.set("Cache-Control", "no-store");
  next();
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
// Serve files in 'uploads/avatars' folder
app.use('/api/uploads/avatars', express.static('uploads/avatars'));

app.use("/api/todos", todosRoutes);
app.use("/api/files", filesRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/notifications", notificationsRoutes);

// Health endpoint
app.get("/health", (_req: Request, res: Response) => {
  res.json({ ok: true, time: new Date().toISOString() });
});

// Error handler 
app.use(errorHandler);

// Create HTTP server and initialize Socket.IO
const port = process.env.PORT || 4000;
const server = http.createServer(app);
const io = initSocket(server);

server.listen(port, () => {
  logger.info(`Server running on port ${port}`);
});
