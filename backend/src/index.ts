const express = require("express");
const dotenv = require("dotenv");
dotenv.config();

// Type-only import for TS
import type { Request, Response } from "express";

const app = express();

// Health endpoint
app.get("/health", (_req: Request, res: Response) => {
  res.json({ ok: true, time: new Date().toISOString() });
});

const port = process.env.PORT || 4000;
app.listen(port, () => console.log(`Server running on port ${port}`));
