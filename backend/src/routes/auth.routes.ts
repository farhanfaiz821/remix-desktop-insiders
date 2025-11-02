import { Router } from 'express';
import authController from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { authLimiter, otpLimiter } from '../middleware/rateLimit';
import { signupSchema, loginSchema, verifyOtpSchema } from '../utils/validation';

const router = Router();

// Public routes
router.post('/signup', authLimiter, validate(signupSchema), authController.signup);
router.post('/login', authLimiter, validate(loginSchema), authController.login);
router.post('/refresh', authController.refresh);
router.post('/verify-otp', validate(verifyOtpSchema), authController.verifyOtp);

// Protected routes
router.post('/logout', authenticate, authController.logout);
router.get('/profile', authenticate, authController.getProfile);
router.post('/send-otp', authenticate, otpLimiter, authController.sendOtp);

export default router;
