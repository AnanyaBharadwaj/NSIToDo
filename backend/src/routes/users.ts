import express from "express";
import multer from "multer";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { authMiddleware, AuthRequest } from "../middlewares/auth";
import { PrismaClient } from "@prisma/client";

const router = express.Router();
const prisma = new PrismaClient();

// Multer storage for avatar uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, "../../uploads/avatars")),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, uuidv4() + ext);
  },
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } }); // 5MB

// Upload avatar
router.post(
  "/me/avatar",
  authMiddleware,
  upload.single("avatar"),
  async (req: AuthRequest, res, next) => {
    try {
      if (!req.file || !req.user) return res.status(400).json({ error: "No file uploaded" });
      const urlPath = `/api/uploads/avatars/${req.file.filename}`;
      await prisma.user.update({
        where: { id: req.user.userId },
        data: { profilePicture: urlPath },
      });
      res.json({ ok: true, avatar: urlPath });
    } catch (err) {
      next(err);
    }
  }
);

// ✅ New route: Get all users (for assignees dropdown)
router.get("/", authMiddleware, async (_req: AuthRequest, res, next) => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, name: true, email: true, role: true, profilePicture: true },
      where: { status: "ACTIVE" }, // only active users
    });
    res.json(users);
  } catch (err) {
    next(err);
  }
});

export default router;
