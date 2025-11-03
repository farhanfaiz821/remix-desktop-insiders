import { z } from 'zod';

export const signupSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  phone: z.string().optional(),
  deviceFingerprint: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
  deviceFingerprint: z.string().optional(),
});

export const verifyOtpSchema = z.object({
  phone: z.string().min(10, 'Invalid phone number'),
  code: z.string().length(6, 'OTP code must be 6 digits'),
});

export const chatSchema = z.object({
  message: z.string().min(1, 'Message cannot be empty').max(4000, 'Message too long'),
  conversationId: z.string().optional(),
});

export const createCheckoutSchema = z.object({
  plan: z.enum(['basic', 'pro', 'enterprise']),
  successUrl: z.string().url().optional(),
  cancelUrl: z.string().url().optional(),
});

export const updateUserSchema = z.object({
  email: z.string().email().optional(),
  phone: z.string().optional(),
  subscriptionPlan: z.string().optional(),
  subscriptionStatus: z.string().optional(),
});

export const banUserSchema = z.object({
  reason: z.string().min(1, 'Ban reason is required'),
});

export const exportChatSchema = z.object({
  format: z.enum(['json', 'csv', 'txt']).default('json'),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});
