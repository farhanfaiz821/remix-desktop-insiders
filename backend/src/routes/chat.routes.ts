import { Router } from 'express';
import chatController from '../controllers/chat.controller';
import { authenticate } from '../middleware/auth';
import { checkTrialOrSubscription } from '../middleware/trial';
import { validate, validateQuery } from '../middleware/validation';
import { createChatLimiter } from '../middleware/rateLimit';
import { chatSchema, exportChatSchema } from '../utils/validation';

const router = Router();

// All chat routes require authentication and valid trial/subscription
router.use(authenticate);
router.use(checkTrialOrSubscription);

router.post('/', createChatLimiter(), validate(chatSchema), chatController.sendMessage);
router.get('/history', chatController.getHistory);
router.delete('/:id', chatController.deleteMessage);
router.get('/export', validateQuery(exportChatSchema), chatController.exportChat);
router.delete('/', chatController.clearHistory);

export default router;
