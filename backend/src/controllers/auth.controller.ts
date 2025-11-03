import { Response } from 'express';
import { AuthRequest } from '../types';
import prisma from '../config/database';
import { hashPassword, comparePassword, hashDeviceFingerprint } from '../utils/hash';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt';
import { env } from '../config/env';
import twilioService from '../services/twilio.service';

export class AuthController {
  async signup(req: AuthRequest, res: Response) {
    try {
      const { email, password, phone, deviceFingerprint } = req.body;

      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        return res.status(409).json({
          success: false,
          error: 'User already exists',
        });
      }

      // Check device fingerprint for abuse prevention
      if (deviceFingerprint) {
        const fingerprintHash = hashDeviceFingerprint(deviceFingerprint);
        const recentUsers = await prisma.user.count({
          where: {
            deviceFingerprintHash: fingerprintHash,
            createdAt: {
              gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
            },
          },
        });

        if (recentUsers >= 3) {
          return res.status(429).json({
            success: false,
            error: 'Too many accounts created from this device',
          });
        }
      }

      // Hash password
      const passwordHash = await hashPassword(password);

      // Calculate trial period
      const trialStart = new Date();
      const trialEnd = new Date(
        trialStart.getTime() + parseInt(env.TRIAL_DURATION_HOURS) * 60 * 60 * 1000
      );

      // Create user
      const user = await prisma.user.create({
        data: {
          email,
          passwordHash,
          phone,
          trialStart,
          trialEnd,
          deviceFingerprintHash: deviceFingerprint
            ? hashDeviceFingerprint(deviceFingerprint)
            : null,
        },
        select: {
          id: true,
          email: true,
          phone: true,
          trialStart: true,
          trialEnd: true,
          createdAt: true,
        },
      });

      // Send OTP if phone provided
      if (phone) {
        try {
          await twilioService.sendOtp(phone, user.id);
        } catch (error) {
          console.error('Failed to send OTP:', error);
          // Don't fail signup if OTP fails
        }
      }

      // Generate tokens
      const accessToken = generateAccessToken(user.id, user.email);
      const refreshToken = generateRefreshToken(user.id, user.email);

      // Store refresh token
      await prisma.refreshToken.create({
        data: {
          userId: user.id,
          token: refreshToken,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        },
      });

      // Log audit
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: 'signup',
          resource: 'user',
          details: 'User signed up successfully',
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
        },
      });

      res.status(201).json({
        success: true,
        data: {
          user,
          accessToken,
          refreshToken,
        },
      });
    } catch (error: any) {
      console.error('Signup error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create account',
      });
    }
  }

  async login(req: AuthRequest, res: Response) {
    try {
      const { email, password, deviceFingerprint } = req.body;

      // Find user
      const user = await prisma.user.findUnique({
        where: { email },
      });

      if (!user) {
        return res.status(401).json({
          success: false,
          error: 'Invalid credentials',
        });
      }

      // Check if user is banned
      if (user.isBanned) {
        return res.status(403).json({
          success: false,
          error: 'Account is banned',
          reason: user.bannedReason,
        });
      }

      // Verify password
      const isValidPassword = await comparePassword(password, user.passwordHash);

      if (!isValidPassword) {
        return res.status(401).json({
          success: false,
          error: 'Invalid credentials',
        });
      }

      // Update last login
      await prisma.user.update({
        where: { id: user.id },
        data: {
          lastLoginAt: new Date(),
          lastLoginIp: req.ip,
          deviceFingerprintHash: deviceFingerprint
            ? hashDeviceFingerprint(deviceFingerprint)
            : user.deviceFingerprintHash,
        },
      });

      // Generate tokens
      const accessToken = generateAccessToken(user.id, user.email);
      const refreshToken = generateRefreshToken(user.id, user.email);

      // Store refresh token
      await prisma.refreshToken.create({
        data: {
          userId: user.id,
          token: refreshToken,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      });

      // Log audit
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: 'login',
          resource: 'user',
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
        },
      });

      res.json({
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            phone: user.phone,
            phoneVerified: user.phoneVerified,
            trialStart: user.trialStart,
            trialEnd: user.trialEnd,
            subscriptionPlan: user.subscriptionPlan,
            subscriptionStatus: user.subscriptionStatus,
          },
          accessToken,
          refreshToken,
        },
      });
    } catch (error: any) {
      console.error('Login error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to login',
      });
    }
  }

  async refresh(req: AuthRequest, res: Response) {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(400).json({
          success: false,
          error: 'Refresh token required',
        });
      }

      // Verify refresh token
      const payload = verifyRefreshToken(refreshToken);

      // Check if token exists and not revoked
      const tokenRecord = await prisma.refreshToken.findUnique({
        where: { token: refreshToken },
      });

      if (!tokenRecord || tokenRecord.revokedAt) {
        return res.status(401).json({
          success: false,
          error: 'Invalid refresh token',
        });
      }

      // Check if token expired
      if (new Date() > tokenRecord.expiresAt) {
        return res.status(401).json({
          success: false,
          error: 'Refresh token expired',
        });
      }

      // Generate new tokens
      const newAccessToken = generateAccessToken(payload.id, payload.email);
      const newRefreshToken = generateRefreshToken(payload.id, payload.email);

      // Revoke old refresh token
      await prisma.refreshToken.update({
        where: { token: refreshToken },
        data: { revokedAt: new Date() },
      });

      // Store new refresh token
      await prisma.refreshToken.create({
        data: {
          userId: payload.id,
          token: newRefreshToken,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      });

      res.json({
        success: true,
        data: {
          accessToken: newAccessToken,
          refreshToken: newRefreshToken,
        },
      });
    } catch (error: any) {
      console.error('Refresh error:', error);
      res.status(401).json({
        success: false,
        error: 'Invalid refresh token',
      });
    }
  }

  async logout(req: AuthRequest, res: Response) {
    try {
      const { refreshToken } = req.body;

      if (refreshToken) {
        await prisma.refreshToken.updateMany({
          where: { token: refreshToken },
          data: { revokedAt: new Date() },
        });
      }

      res.json({
        success: true,
        message: 'Logged out successfully',
      });
    } catch (error: any) {
      console.error('Logout error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to logout',
      });
    }
  }

  async verifyOtp(req: AuthRequest, res: Response) {
    try {
      const { phone, code } = req.body;

      const isValid = await twilioService.verifyOtp(phone, code);

      if (!isValid) {
        return res.status(400).json({
          success: false,
          error: 'Invalid or expired OTP code',
        });
      }

      res.json({
        success: true,
        message: 'Phone verified successfully',
      });
    } catch (error: any) {
      console.error('OTP verification error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to verify OTP',
      });
    }
  }

  async sendOtp(req: AuthRequest, res: Response) {
    try {
      const { phone } = req.body;
      const userId = req.user?.id;

      await twilioService.sendOtp(phone, userId);

      res.json({
        success: true,
        message: 'OTP sent successfully',
      });
    } catch (error: any) {
      console.error('Send OTP error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to send OTP',
      });
    }
  }

  async getProfile(req: AuthRequest, res: Response) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.user!.id },
        select: {
          id: true,
          email: true,
          phone: true,
          phoneVerified: true,
          trialStart: true,
          trialEnd: true,
          subscriptionPlan: true,
          subscriptionStatus: true,
          createdAt: true,
        },
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found',
        });
      }

      res.json({
        success: true,
        data: user,
      });
    } catch (error: any) {
      console.error('Get profile error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get profile',
      });
    }
  }
}

export default new AuthController();
