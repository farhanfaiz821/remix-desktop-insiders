import { Router } from 'express';
import adminController from '../controllers/admin.controller';
import { authenticateAdmin } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { banUserSchema } from '../utils/validation';

const router = Router();

// All admin routes require admin authentication
router.use(authenticateAdmin);

// User management
router.get('/users', adminController.getUsers);
router.get('/users/:id', adminController.getUser);
router.post('/users/:id/ban', validate(banUserSchema), adminController.banUser);
router.post('/users/:id/unban', adminController.unbanUser);

// Subscription management
router.get('/subscriptions', adminController.getSubscriptions);

// Analytics
router.get('/analytics', adminController.getAnalytics);

// Audit logs
router.get('/logs', adminController.getAuditLogs);

export default router;
