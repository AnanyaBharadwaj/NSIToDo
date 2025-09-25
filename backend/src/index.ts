const express = require("express");
const cookieParser = require("cookie-parser");
const morgan = require("morgan");
const cors = require("cors");
const dotenv = require("dotenv");
dotenv.config();

// Routes (use require for CommonJS style)
const authRoutes = require("./routes/auth").default;
const userRoutes = require("./routes/users").default;
const uploadRoutes = require("./routes/uploads").default;
const todosRoutes = require("./routes/todos").default; 

// Middlewares
const { errorHandler } = require("./middlewares/errorHandler");
const { logger } = require("./logger");

import type { Request, Response } from "express";

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

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/uploads", uploadRoutes);
app.use("/api/todos", todosRoutes); // 

// Health endpoint
app.get("/health", (_req: Request, res: Response) => {
  res.json({ ok: true, time: new Date().toISOString() });
});

// Error handler (must be last)
app.use(errorHandler);

const port = process.env.PORT || 4000;
app.listen(port, () => logger.info(`Server running on port ${port}`));
