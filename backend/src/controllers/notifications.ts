
import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../src/prisma';

interface AuthRequest extends Request {
  user?: { userId: number; role: string };
}

export const getNotifications = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const notes = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    res.json(notes);
  } catch (err) {
    next(err);
  }
};

export const markNotificationRead = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    const id = Number(req.params.id);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const note = await prisma.notification.findUnique({ where: { id }});
    if (!note || note.userId !== userId) return res.status(404).json({ error: 'Not found' });

    const updated = await prisma.notification.update({ where: { id }, data: { read: true } });
    res.json(updated);
  } catch (err) {
    next(err);
  }
};
