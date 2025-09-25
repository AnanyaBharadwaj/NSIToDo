import { Request, Response } from "express";

// Temporary in-memory store
let todos: any[] = [];
let currentId = 1;

// Temporary in-memory file store
let files: any[] = [];
let currentFileId = 1;

// Extend request to include user from auth middleware
interface AuthRequest extends Request {
  user?: { id: number; role: string };
}

// Create a new Todo
export const createTodo = (req: AuthRequest, res: Response) => {
  const { title, description, dueDate } = req.body;
  const userId = req.user?.id || 1; // default to 1 if no auth

  const newTodo = {
    id: currentId++,
    title,
    description: description || "",
    dueDate: dueDate ? new Date(dueDate) : null,
    creatorId: userId,
    files: [] as any[],
  };

  // Handle uploaded files
  if (req.files && Array.isArray(req.files)) {
    const uploadedFiles = (req.files as Express.Multer.File[]).map((file) => {
      const newFile = {
        id: currentFileId++,
        filename: file.originalname,
        path: file.path,
        mimetype: file.mimetype,
        size: file.size,
        todoId: newTodo.id,
      };
      files.push(newFile);
      return newFile;
    });
    newTodo.files = uploadedFiles;
  }

  todos.push(newTodo);
  res.status(201).json(newTodo);
};

// Get all Todos
export const getTodos = (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  // Return only todos created by or assigned to the user (mock)
  res.json(todos.filter((t) => t.creatorId === userId));
};

// Get Todo by ID
export const getTodoById = (req: AuthRequest, res: Response) => {
  const id = parseInt(req.params.id);
  const todo = todos.find((t) => t.id === id);

  if (!todo) return res.status(404).json({ error: "Todo not found" });

  // Check access
  const userId = req.user?.id;
  if (todo.creatorId !== userId) return res.status(403).json({ error: "Forbidden" });

  res.json(todo);
};

// Download a file attached to a Todo
export const downloadFile = (req: AuthRequest, res: Response) => {
  const fileId = parseInt(req.params.id);
  const file = files.find((f) => f.id === fileId);

  if (!file) return res.status(404).send("File not found");

  // Check access to parent todo
  const todo = todos.find((t) => t.id === file.todoId);
  const userId = req.user?.id;
  if (!todo || todo.creatorId !== userId) return res.status(403).json({ error: "Forbidden" });

  res.download(file.path, file.filename);
};
