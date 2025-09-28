import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface AuthRequest extends Request {
  user?: { userId: number; role: string };
}

// Auth middleware: verifies JWT token and attaches user to req.user
export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    // 1️⃣ Try Authorization header first
    const authHeader = req.headers.authorization;
    let token: string | null = authHeader && authHeader.startsWith("Bearer ") ? authHeader.split(" ")[1] : null;

    // 2️⃣ Fallback to cookie if not present (requires cookie-parser)
    if (!token && req.cookies?.token) token = req.cookies.token;

    if (!token) return res.status(401).json({ error: "Unauthorized — token missing" });

    const secret = process.env.JWT_SECRET!;
    const payload = jwt.verify(token, secret) as { userId: number; role: string };

    // Attach user to request
    req.user = { userId: payload.userId, role: payload.role };

    // Debug log (optional)
    console.log("Auth successful, req.user:", req.user);

    next();
  } catch (err) {
    console.error("AuthMiddleware error:", err);
    return res.status(401).json({ error: "Invalid token" });
  }
}

// Admin middleware: ensures user is admin
export function adminMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user) return res.status(401).json({ error: "Unauthorized" });
  if (req.user.role !== "ADMIN") return res.status(403).json({ error: "Forbidden — admins only" });
  next();
}
