import { Request, Response, NextFunction } from 'express';
import { prisma } from '../prisma';
import fs from 'fs';
import path from 'path';

// Extend request to include user from auth middleware
interface AuthRequest extends Request {
  user?: { userId: number; role: string };
}

/**
 * CREATE Todo
 */
export const createTodo = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { title, description, dueDate } = req.body;
    const userId = req.user?.userId;

    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    if (!title || typeof title !== 'string') return res.status(400).json({ error: 'Title is required' });

    const created = await prisma.$transaction(async (tx) => {
      // 1) Create the todo
      const todo = await tx.todo.create({
        data: {
          title,
          description: description || null,
          dueDate: dueDate ? new Date(dueDate) : null,
          creatorId: userId,
        },
      });

      // 2) Parse assignees from FormData
      let assigneeArray: number[] = [];
      if (req.body.assignees) {
        if (typeof req.body.assignees === 'string') {
          try {
            // Parse JSON string from frontend
            assigneeArray = JSON.parse(req.body.assignees).map((id: any) => Number(id));
          } catch (e) {
            assigneeArray = [];
          }
        } else if (Array.isArray(req.body.assignees)) {
          assigneeArray = req.body.assignees.map((id: any) => Number(id));
        }
      }

      // 3) Insert assignees into TodoAssignee table
      if (assigneeArray.length > 0) {
        const assigneeData = assigneeArray.map((uid) => ({
          todoId: todo.id,
          userId: uid,
        }));
        await tx.todoAssignee.createMany({ data: assigneeData, skipDuplicates: true });
      }

      // 4) Handle uploaded files
      if (req.files && Array.isArray(req.files)) {
        const fileRecords = (req.files as Express.Multer.File[]).map((file) => ({
          filename: file.originalname,
          path: file.path,
          mimeType: file.mimetype,
          size: file.size,
          todoId: todo.id,
          uploaderId: userId,
        }));
        await tx.file.createMany({ data: fileRecords });
      }

      // 5) Return full todo with relations
      return await tx.todo.findUnique({
        where: { id: todo.id },
        include: {
          files: true,
          creator: { select: { id: true, name: true, email: true } },
          assignee: { include: { user: true } },
        },
      });
    });

    return res.status(201).json(created);
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/todos/my
 */
export const getMyTodos = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const myTodos = await prisma.todo.findMany({
      where: { creatorId: userId },
      include: {
        creator: { select: { id: true, name: true, email: true } },
        assignee: { include: { user: { select: { id: true, name: true, email: true } } } },
        files: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(myTodos);
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/todos/assigned
 */
export const getAssignedTodos = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const assignedTodos = await prisma.todo.findMany({
      where: { assignee: { some: { userId } } },
      include: {
        creator: { select: { id: true, name: true, email: true } },
        assignee: { include: { user: { select: { id: true, name: true, email: true } } } },
        files: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(assignedTodos);
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/todos/:id
 */
export const getTodoById = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);
    const userId = req.user?.userId;
    const role = req.user?.role;

    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    if (Number.isNaN(id)) return res.status(400).json({ error: 'Invalid id' });

    const todo = await prisma.todo.findUnique({
      where: { id },
      include: {
        creator: { select: { id: true, name: true, email: true } },
        assignee: { include: { user: { select: { id: true, name: true, email: true } } } },
        files: true,
      },
    });

    if (!todo) return res.status(404).json({ error: 'Todo not found' });

    const isCreator = todo.creatorId === userId;
    const isAssignee = todo.assignee.some((a) => a.userId === userId);
    const isAdmin = role === 'ADMIN';

    if (!isCreator && !isAssignee && !isAdmin) return res.status(403).json({ error: 'Forbidden' });

    res.json(todo);
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/todos/files/:id/download
 */
export const downloadFile = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const fileId = Number(req.params.id);
    const userId = req.user?.userId;
    const role = req.user?.role;

    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    if (Number.isNaN(fileId)) return res.status(400).json({ error: 'Invalid file id' });

    const file = await prisma.file.findUnique({
      where: { id: fileId },
      include: { todo: { include: { assignee: true, creator: true } } },
    });

    if (!file) return res.status(404).json({ error: 'File not found' });

    const todo = file.todo;
    const isUploader = file.uploaderId === userId;
    const isCreator = todo && todo.creatorId === userId;
    const isAssignee = todo && todo.assignee.some(a => a.userId === userId);
    const isAdmin = role === 'ADMIN';

    if (!isUploader && !isCreator && !isAssignee && !isAdmin) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const filePath = file.path;
    if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'File not found on disk' });

    const filename = file.filename || path.basename(filePath);
    return res.download(filePath, filename);
  } catch (err) {
    next(err);
  }
};
