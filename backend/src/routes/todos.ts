import { Router } from 'express';
import { upload } from '../middlewares/upload';
import {
  createTodo,
  getTodoById,
  downloadFile,
  getMyTodos,
  getAssignedTodos,
} from '../controllers/todos';
import { authMiddleware as auth } from '../middlewares/auth';

const router = Router();

// Create a new todo (optional file upload)
router.post('/', auth, upload.array('files'), createTodo);

// Get todos created by the logged-in user
router.get('/my', auth, getMyTodos);

// Get todos assigned to the logged-in user
router.get('/assigned', auth, getAssignedTodos);

// Get a single todo by ID (only accessible if creator, assignee, or admin)
router.get('/:id', auth, getTodoById);

// Download a file attached to a todo
router.get('/files/:id/download', auth, downloadFile);

export default router;
