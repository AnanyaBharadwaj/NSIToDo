// backend/routes/admin.ts
import { Router } from 'express';
import { getAllUsersForAdmin, setUserStatus } from '../controllers/admin';
import { authMiddleware as auth, adminMiddleware } from '../middlewares/auth';

const router = Router();
router.get('/users', auth, adminMiddleware, getAllUsersForAdmin);
router.patch('/users/:id/status', auth, adminMiddleware, setUserStatus);

export default router;
