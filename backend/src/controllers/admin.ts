// backend/controllers/admin.ts
import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../src/prisma';

interface AuthRequest extends Request {
  user?: { userId: number; role: string };
}

// GET /api/admin/users
export const getAllUsersForAdmin = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (req.user?.role !== 'ADMIN') return res.status(403).json({ error: 'Admin only' });

    const users = await prisma.user.findMany({
      select: { id: true, name: true, email: true, role: true, status: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });

    // Attach counts in parallel
    const enriched = await Promise.all(users.map(async (u) => {
      const createdCount = await prisma.todo.count({ where: { creatorId: u.id }});
      const assignedCount = await prisma.todoAssignee.count({ where: { userId: u.id }});
      return { ...u, createdCount, assignedCount };
    }));

    res.json(enriched);
  } catch (err) {
    next(err);
  }
};

// PATCH /api/admin/users/:id/status
export const setUserStatus = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (req.user?.role !== 'ADMIN') return res.status(403).json({ error: 'Admin only' });

    const userId = Number(req.params.id);
    const { status } = req.body; // 'ACTIVE' | 'DISABLED'
    if (!['ACTIVE', 'DISABLED'].includes(status)) return res.status(400).json({ error: 'Invalid status' });

    const updated = await prisma.user.update({ where: { id: userId }, data: { status } });
    res.json(updated);
  } catch (err) {
    next(err);
  }
};
