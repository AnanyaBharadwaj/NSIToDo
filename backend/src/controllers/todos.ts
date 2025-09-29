// backend/src/controllers/todos.ts
import { Request, Response, NextFunction } from 'express';
import { prisma } from '../prisma';
import fs from 'fs';
import path from 'path';
import { getIO } from '../socket'; // Use getIO instead of io

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
      const todo = await tx.todo.create({
        data: {
          title,
          description: description || null,
          dueDate: dueDate ? new Date(dueDate) : null,
          creatorId: userId,
        },
      });

      // Parse assignees
      let assigneeArray: number[] = [];
      if (req.body.assignees) {
        if (typeof req.body.assignees === 'string') {
          try {
            assigneeArray = JSON.parse(req.body.assignees).map((id: any) => Number(id));
          } catch (e) { assigneeArray = []; }
        } else if (Array.isArray(req.body.assignees)) {
          assigneeArray = req.body.assignees.map((id: any) => Number(id));
        }
      }

      if (assigneeArray.length > 0) {
        const assigneeData = assigneeArray.map(uid => ({ todoId: todo.id, userId: uid }));
        await tx.todoAssignee.createMany({ data: assigneeData, skipDuplicates: true });
      }

      // Handle uploaded files
      if (req.files && Array.isArray(req.files)) {
        const fileRecords = (req.files as Express.Multer.File[]).map(file => ({
          filename: file.originalname,
          path: file.path,
          mimeType: file.mimetype,
          size: file.size,
          todoId: todo.id,
          uploaderId: userId,
        }));
        await tx.file.createMany({ data: fileRecords });
      }

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
    const todoId = Number(req.params.id);
    const userId = req.user?.userId;

    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    if (Number.isNaN(todoId)) return res.status(400).json({ error: 'Invalid id' });

    const todo = await prisma.todo.findUnique({
      where: { id: todoId },
      include: {
        creator: { select: { id: true, name: true, email: true } },
        assignee: { include: { user: { select: { id: true, name: true, email: true } } } },
        files: true,
      },
    });

    if (!todo) return res.status(404).json({ error: 'Todo not found' });

    const isCreator = todo.creatorId === userId;
    const isAssignee = todo.assignee.some(a => a.userId === userId);

    if (!isCreator && !isAssignee) return res.status(403).json({ error: 'Forbidden' });

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

    if (!isUploader && !isCreator && !isAssignee) {
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

/**
 * PATCH /api/todos/:id/status
 */
export const updateTodoStatus = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const todoId = Number(req.params.id);
    const { status } = req.body;
    const userId = req.user?.userId;

    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    if (!['TODO', 'IN_PROGRESS', 'DONE'].includes(status)) return res.status(400).json({ error: 'Invalid status' });

    const todo = await prisma.todo.findUnique({
      where: { id: todoId },
      include: { assignee: true },
    });

    if (!todo) return res.status(404).json({ error: 'Todo not found' });

    const isCreator = todo.creatorId === userId;
    const isAssignee = todo.assignee.some(a => a.userId === userId);

    if (!isCreator && !isAssignee) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const updatedTodo = await prisma.todo.update({
      where: { id: todoId },
      data: { status },
      include: { 
        assignee: { include: { user: true } },
        creator: true,
        files: true,
      },
    });

    const assigneeIds = updatedTodo.assignee.map(a => a.userId).filter(id => id !== userId);

    if (assigneeIds.length > 0) {
      const notifications = assigneeIds.map(uid => ({
        userId: uid,
        message: `Status changed to ${status} for "${updatedTodo.title}"`,
        todoId: updatedTodo.id,
      }));
      await prisma.notification.createMany({ data: notifications });

      try {
        const io = getIO();
        assigneeIds.forEach(uid => {
          io.to(`user_${uid}`).emit('notification', {
            message: `Status changed to ${status} for "${updatedTodo.title}"`,
            todoId: updatedTodo.id,
          });
        });
      } catch (err) {
        console.warn('Socket.io not initialized. Skipping real-time notifications.');
      }
    }

    res.json(updatedTodo);
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/todos/order
 */
export const reorderTodos = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { orderedIds } = req.body;
    const userId = req.user?.userId;

    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    if (!Array.isArray(orderedIds) || orderedIds.some((id: any) => Number.isNaN(Number(id)))) {
      return res.status(400).json({ error: 'orderedIds must be array of ids' });
    }

    const todos = await prisma.todo.findMany({
      where: { id: { in: orderedIds.map(Number) } },
      include: { assignee: true },
    });

    const unauthorized = todos.some(t => {
      const isCreator = t.creatorId === userId;
      const isAssignee = t.assignee.some(a => a.userId === userId);
      return !(isCreator || isAssignee);
    });
    if (unauthorized) return res.status(403).json({ error: 'Forbidden to reorder some todos' });

    const updates = orderedIds.map((id: number, idx: number) =>
      prisma.todo.update({ where: { id: Number(id) }, data: { order: idx } })
    );
    await prisma.$transaction(updates);

    const updated = await prisma.todo.findMany({
      where: { id: { in: orderedIds.map(Number) } },
      orderBy: { order: 'asc' },
      include: { creator: true, assignee: { include: { user: true } }, files: true },
    });

    res.json(updated);
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/todos/status/:id
 */
export const getTodoStatus = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const todoId = Number(req.params.id);
    const userId = req.user?.userId;

    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    if (Number.isNaN(todoId)) return res.status(400).json({ error: 'Invalid todo id' });

    const todo = await prisma.todo.findUnique({
      where: { id: todoId },
      include: { creator: true, assignee: { include: { user: true } } },
    });

    if (!todo) return res.status(404).json({ error: 'Todo not found' });

    const isCreator = todo.creatorId === userId;
    const isAssignee = todo.assignee.some(a => a.user?.id === userId);

    if (!isCreator && !isAssignee) return res.status(403).json({ error: 'Forbidden' });

    res.json({
      id: todo.id,
      title: todo.title,
      status: todo.status,
      creator: todo.creator,
      assignees: todo.assignee.map(a => a.user),
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/todos/status
 * Returns status for ALL todos in the system
 */
export const getAllTodoStatuses = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const todos = await prisma.todo.findMany({
      include: {
        creator: { select: { id: true, name: true, email: true } },
        assignee: { include: { user: { select: { id: true, name: true, email: true } } } },
        files: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(todos.map(todo => ({
      id: todo.id,
      title: todo.title,
      status: todo.status,
      creator: todo.creator,
      assignees: todo.assignee.map(a => a.user),
      files: todo.files,
    })));
  } catch (err) {
    next(err);
  }
};
