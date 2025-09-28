// import { Request, Response } from "express";

// // Temporary in-memory store
// let todos: any[] = [];
// let currentId = 1;

// // Temporary in-memory file store
// let files: any[] = [];
// let currentFileId = 1;

// // Extend request to include user from auth middleware
// interface AuthRequest extends Request {
//   user?: { userId: number; role: string };
// }

// // Create a new Todo
// export const createTodo = (req: AuthRequest, res: Response) => {
//   const { title, description, dueDate } = req.body;
//   const userId = req.user?.userId || 1; // use userId from authMiddleware

//   const newTodo = {
//     id: currentId++,
//     title,
//     description: description || "",
//     dueDate: dueDate ? new Date(dueDate) : null,
//     creatorId: userId,
//     files: [] as any[],
//   };

//   // Handle uploaded files
//   if (req.files && Array.isArray(req.files)) {
//     const uploadedFiles = (req.files as Express.Multer.File[]).map((file) => {
//       const newFile = {
//         id: currentFileId++,
//         filename: file.originalname,
//         path: file.path,
//         mimetype: file.mimetype,
//         size: file.size,
//         todoId: newTodo.id,
//       };
//       files.push(newFile);
//       return newFile;
//     });
//     newTodo.files = uploadedFiles;
//   }

//   todos.push(newTodo);
//   res.status(201).json(newTodo);
// };

// // Get all Todos
// export const getTodos = (req: AuthRequest, res: Response) => {
//   const userId = req.user?.userId; // corrected here
//   if (!userId) return res.status(401).json({ error: "Unauthorized" });

//   // Return only todos created by or assigned to the user (mock)
//   res.json(todos.filter((t) => t.creatorId === userId));
// };

// // Get Todo by ID
// export const getTodoById = (req: AuthRequest, res: Response) => {
//   const id = parseInt(req.params.id);
//   const todo = todos.find((t) => t.id === id);

//   if (!todo) return res.status(404).json({ error: "Todo not found" });

//   // Check access
//   const userId = req.user?.userId; // corrected here
//   if (todo.creatorId !== userId) return res.status(403).json({ error: "Forbidden" });

//   res.json(todo);
// };

// // Download a file attached to a Todo
// export const downloadFile = (req: AuthRequest, res: Response) => {
//   const fileId = parseInt(req.params.id);
//   const file = files.find((f) => f.id === fileId);

//   if (!file) return res.status(404).send("File not found");

//   // Check access to parent todo
//   const todo = todos.find((t) => t.id === file.todoId);
//   const userId = req.user?.userId; // corrected here
//   if (!todo || todo.creatorId !== userId) return res.status(403).json({ error: "Forbidden" });

//   res.download(file.path, file.filename);
// };

// backend/controllers/todos.ts
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
 * - Create Todo row
 * - Create TodoAssignee rows (if assigneeIds provided) using createMany
 * - Create File rows for uploaded files (if any)
 */
export const createTodo = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { title, description, dueDate, assigneeIds } = req.body;
    const userId = req.user?.userId;

    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    if (!title || typeof title !== 'string') return res.status(400).json({ error: 'Title is required' });

    // Use a transaction to ensure atomicity
    const created = await prisma.$transaction(async (tx) => {
      // 1) create todo
      const todo = await tx.todo.create({
        data: {
          title,
          description: description || null,
          dueDate: dueDate ? new Date(dueDate) : null,
          creatorId: userId,
        },
      });

      // 2) create assignees (if any)
      if (assigneeIds && Array.isArray(assigneeIds) && assigneeIds.length > 0) {
        const assigneeData = assigneeIds.map((id: string | number) => ({
          todoId: todo.id,
          userId: Number(id),
        }));

        // createMany with skipDuplicates prevents duplicate (todoId,userId) pairs
        await tx.todoAssignee.createMany({
          data: assigneeData,
          skipDuplicates: true,
        });
      }

      // 3) handle files uploaded via multer
      let createdFiles = [];
      if (req.files && Array.isArray(req.files)) {
        const fileRecords = (req.files as Express.Multer.File[]).map((file) => ({
          filename: file.originalname,
          path: file.path,
          mimeType: file.mimetype,
          size: file.size,
          todoId: todo.id,
          uploaderId: userId,
        }));

        // createMany for files
        await tx.file.createMany({ data: fileRecords });

        // fetch created file rows (to return them)
        createdFiles = await tx.file.findMany({
          where: { todoId: todo.id },
        });
      }

      // 4) return full todo incl relations
      const fullTodo = await tx.todo.findUnique({
        where: { id: todo.id },
        include: {
          files: true,
          creator: { select: { id: true, name: true, email: true } },
          assignee: { include: { user: true } },
        },
      });

      return fullTodo;
    });

    return res.status(201).json(created);
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/todos
 * Return todos where user is creator or an assignee
 */
export const getTodos = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const todos = await prisma.todo.findMany({
      where: {
        OR: [
          { creatorId: userId },
          {
            assignee: {
              some: {
                userId: userId,
              },
            },
          },
        ],
      },
      include: {
        creator: { select: { id: true, name: true, email: true } },
        assignee: { include: { user: { select: { id: true, name: true, email: true } } } },
        files: true,
      },
      orderBy: { order: 'asc' }, // or createdAt: 'desc' depending on UX
    });

    res.json(todos);
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/todos/:id
 * Return single todo if user is allowed (creator/assignee/admin)
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

    // Access check: allow if creator, an assignee, or admin
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
 * Check access and stream file to client
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

    // Determine access: allow if uploader, todo creator, assignee, or admin
    const todo = file.todo;
    const isUploader = file.uploaderId === userId;
    const isCreator = todo && todo.creatorId === userId;
    const isAssignee = todo && todo.assignee.some((a) => a.userId === userId);
    const isAdmin = role === 'ADMIN';

    if (!isUploader && !isCreator && !isAssignee && !isAdmin) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    // Ensure file exists on disk
    const filePath = file.path;
    if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'File not found on disk' });

    // Send as download
    const filename = file.filename || path.basename(filePath);
    return res.download(filePath, filename);
  } catch (err) {
    next(err);
  }
};
