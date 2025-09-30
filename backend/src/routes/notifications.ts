
import { Router } from 'express';
import { getNotifications, markNotificationRead } from '../controllers/notifications';
import { authMiddleware as auth } from '../middlewares/auth';

const router = Router();
router.get('/', auth, getNotifications);
router.patch('/:id/read', auth, markNotificationRead);

export default router;
