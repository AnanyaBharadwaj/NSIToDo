import path from "path";
import express from "express";
import { authMiddleware } from "../middlewares/auth";

const router = express.Router();

router.get("/avatars/:filename", authMiddleware, (req, res) => {
  const file = path.join(__dirname, "../../uploads/avatars", req.params.filename);
  res.sendFile(file, (err) => {
    if (err) res.status(404).end();
  });
});

export default router;
