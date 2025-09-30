
import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../src/prisma';
import fs from 'fs';
import path from 'path';

interface AuthRequest extends Request {
  user?: { userId: number; role: string };
}

// GET /api/files
export const getFiles = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    const role = req.user?.role;

    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    let files;
    if (role === 'ADMIN') {
      files = await prisma.file.findMany({
        include: { todo: { select: { id: true, title: true, creatorId: true } }, uploader: { select: { id: true, name: true, email: true } } },
        orderBy: { createdAt: 'desc' },
      });
    } else {
      files = await prisma.file.findMany({
        where: {
          OR: [
            { uploaderId: userId },
            { todo: { creatorId: userId } },
            { todo: { assignee: { some: { userId } } } },
          ],
        },
        include: { todo: { select: { id: true, title: true, creatorId: true } }, uploader: { select: { id: true, name: true, email: true } } },
        orderBy: { createdAt: 'desc' },
      });
    }

    res.json(files);
  } catch (err) {
    next(err);
  }
};

