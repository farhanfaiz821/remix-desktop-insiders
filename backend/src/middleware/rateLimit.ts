import rateLimit from 'express-rate-limit';
import { env } from '../config/env';
import redis from '../config/redis';

// General API rate limiter
export const apiLimiter = rateLimit({
  windowMs: parseInt(env.RATE_LIMIT_WINDOW_MS),
  max: parseInt(env.RATE_LIMIT_MAX_REQUESTS),
  message: {
    success: false,
    error: 'Too many requests, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Strict rate limiter for auth endpoints
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  message: {
    success: false,
    error: 'Too many authentication attempts, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Chat rate limiter (per user)
export const createChatLimiter = () => {
  return async (req: any, res: any, next: any) => {
    if (!req.user) {
      return next();
    }

    const userId = req.user.id;
    const key = `chat_limit:${userId}`;
    const limit = parseInt(env.CHAT_RATE_LIMIT_MAX);
    const window = 60 * 60; // 1 hour in seconds

    try {
      const current = await redis.incr(key);
      
      if (current === 1) {
        await redis.expire(key, window);
      }

      if (current > limit) {
        const ttl = await redis.ttl(key);
        return res.status(429).json({
          success: false,
          error: `Chat rate limit exceeded. Try again in ${Math.ceil(ttl / 60)} minutes.`,
          retryAfter: ttl,
        });
      }

      res.setHeader('X-RateLimit-Limit', limit.toString());
      res.setHeader('X-RateLimit-Remaining', Math.max(0, limit - current).toString());
      
      next();
    } catch (error) {
      console.error('Rate limit error:', error);
      next(); // Allow request on Redis error
    }
  };
};

// OTP rate limiter
export const otpLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 OTP requests per hour
  message: {
    success: false,
    error: 'Too many OTP requests, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});
