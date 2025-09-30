
import { Router } from 'express';
import { upload } from '../middlewares/upload';
import {
  createTodo,
  getTodoById,
  downloadFile,
  getMyTodos,
  getAssignedTodos,
  updateTodoStatus,
  reorderTodos,
  getTodoStatus,
  getAllTodoStatuses,
} from '../controllers/todos';
import { authMiddleware as auth } from '../middlewares/auth';

const router = Router();

// Create a new todo (with optional file upload)
router.post('/', auth, upload.array('files'), createTodo);

// Get todos created by the logged-in user
router.get('/my', auth, getMyTodos);

// Get todos assigned to the logged-in user
router.get('/assigned', auth, getAssignedTodos);

// Get all todos with status (for logged-in user)
router.get('/status', auth, getAllTodoStatuses); // must come before /:id/status

// Get status of a single todo
router.get('/:id/status', auth, getTodoStatus);

// Get a single todo by ID
router.get('/:id', auth, getTodoById);

// Download a file attached to a todo
router.get('/files/:id/download', auth, downloadFile);

// Update status of a todo
router.patch('/:id/status', auth, updateTodoStatus);

// Reorder todos
router.patch('/order', auth, reorderTodos);

export default router;
