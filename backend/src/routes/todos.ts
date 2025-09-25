import { Router } from 'express';
import { upload } from '../middlewares/upload';
import {
  createTodo,
  getTodos,
  getTodoById,
  downloadFile,
} from '../controllers/todos';
import { authMiddleware as auth, adminMiddleware } from '../middlewares/auth';


const router = Router();

router.post('/', auth, upload.array('files'), createTodo);
router.get('/', auth, getTodos);
router.get('/:id', auth, getTodoById);
router.get('/files/:id/download', auth, downloadFile);

export default router;
