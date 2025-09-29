// backend/routes/files.ts
import { Router } from 'express';
import { getFiles } from '../controllers/files';
import { authMiddleware as auth } from '../middlewares/auth';

const router = Router();
router.get('/', auth, getFiles);
export default router;
