import { Router } from 'express';
import stripeController from '../controllers/stripe.controller';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { createCheckoutSchema } from '../utils/validation';
import express from 'express';

const router = Router();

// Webhook route (must be before express.json() middleware)
router.post(
  '/webhook',
  express.raw({ type: 'application/json' }),
  stripeController.handleWebhook
);

// Protected routes
router.post(
  '/checkout-session',
  authenticate,
  validate(createCheckoutSchema),
  stripeController.createCheckoutSession
);
router.get('/subscription', authenticate, stripeController.getSubscription);
router.post('/cancel', authenticate, stripeController.cancelSubscription);
router.get('/plans', stripeController.getPlans);

export default router;
