import express, { Request, Response, NextFunction } from "express";
const validator = require("express-validator");
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { prisma } from "../prisma";  

const { check, validationResult } = validator;
const router = express.Router();

const JWT_EXPIRY = "7d";
const SALT_ROUNDS = 10;

interface AuthRequest extends Request {
  cookies: { [key: string]: string };
}

router.post(
  "/register",
  [check("email").isEmail(), check("password").isLength({ min: 6 })],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

      const { email, password, name } = req.body;
      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) return res.status(400).json({ error: "Email already used" });

      const hashed = await bcrypt.hash(password, SALT_ROUNDS);
      const user = await prisma.user.create({ data: { email, password: hashed, name } });

      const token = jwt.sign({ userId: user.id, role: user.role }, process.env.JWT_SECRET!, {
        expiresIn: JWT_EXPIRY,
      });

      res.cookie("token", token, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      const safeUser = {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        avatar: user.profilePicture,
      };
      res.json({ user: safeUser });
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  "/login",
  [check("email").isEmail(), check("password").exists()],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

      const { email, password } = req.body;
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) return res.status(401).json({ error: "Invalid credentials" });

      const match = await bcrypt.compare(password, user.password);
      if (!match) return res.status(401).json({ error: "Invalid credentials" });

      const token = jwt.sign({ userId: user.id, role: user.role }, process.env.JWT_SECRET!, {
        expiresIn: JWT_EXPIRY,
      });

      res.cookie("token", token, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      const safeUser = {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        avatar: user.profilePicture,
      };
      res.json({ user: safeUser, token });
    } catch (err) {
      next(err);
    }
  }
);

router.post("/logout", (req: Request, res: Response) => {
  res.clearCookie("token");
  res.json({ ok: true });
});

router.get("/me", async (req: AuthRequest, res: Response) => {
  try {
    const token = req.cookies?.token;
    if (!token) return res.status(200).json({ user: null });

    const payload: any = jwt.verify(token, process.env.JWT_SECRET!);
    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user) return res.status(200).json({ user: null });

    const safeUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      avatar: user.profilePicture,
    };
    res.json({ user: safeUser });
  } catch (err) {
    res.status(200).json({ user: null });
  }
});

export default router;
