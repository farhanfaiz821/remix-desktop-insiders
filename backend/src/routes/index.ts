import { Router } from 'express';
import authRoutes from './auth.routes';
import chatRoutes from './chat.routes';
import stripeRoutes from './stripe.routes';
import adminRoutes from './admin.routes';

const router = Router();

// Health check
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'ZYNX AI API is running',
    timestamp: new Date().toISOString(),
  });
});

// API routes
router.use('/auth', authRoutes);
router.use('/chat', chatRoutes);
router.use('/stripe', stripeRoutes);
router.use('/admin', adminRoutes);

export default router;
