import { Response } from 'express';
import { AuthRequest } from '../types';
import prisma from '../config/database';

export class AdminController {
  async getUsers(req: AuthRequest, res: Response) {
    try {
      const { limit = '50', offset = '0', search, status } = req.query;

      const whereClause: any = {};

      if (search) {
        whereClause.OR = [
          { email: { contains: search as string, mode: 'insensitive' } },
          { phone: { contains: search as string } },
        ];
      }

      if (status === 'active') {
        whereClause.isActive = true;
        whereClause.isBanned = false;
      } else if (status === 'banned') {
        whereClause.isBanned = true;
      } else if (status === 'subscribed') {
        whereClause.subscriptionStatus = 'active';
      }

      const users = await prisma.user.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        take: parseInt(limit as string),
        skip: parseInt(offset as string),
        select: {
          id: true,
          email: true,
          phone: true,
          phoneVerified: true,
          trialStart: true,
          trialEnd: true,
          subscriptionPlan: true,
          subscriptionStatus: true,
          isActive: true,
          isBanned: true,
          bannedReason: true,
          lastLoginAt: true,
          createdAt: true,
          _count: {
            select: {
              messages: true,
            },
          },
        },
      });

      const total = await prisma.user.count({ where: whereClause });

      res.json({
        success: true,
        data: {
          users,
          total,
          limit: parseInt(limit as string),
          offset: parseInt(offset as string),
        },
      });
    } catch (error: any) {
      console.error('Get users error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get users',
      });
    }
  }

  async getUser(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;

      const user = await prisma.user.findUnique({
        where: { id },
        include: {
          subscriptions: {
            orderBy: { createdAt: 'desc' },
            take: 5,
          },
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 10,
            select: {
              id: true,
              content: true,
              response: true,
              tokens: true,
              createdAt: true,
            },
          },
        },
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found',
        });
      }

      // Get message stats
      const messageStats = await prisma.message.aggregate({
        where: { userId: id },
        _count: true,
        _sum: {
          tokens: true,
        },
      });

      res.json({
        success: true,
        data: {
          user,
          stats: {
            totalMessages: messageStats._count,
            totalTokens: messageStats._sum.tokens || 0,
          },
        },
      });
    } catch (error: any) {
      console.error('Get user error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get user',
      });
    }
  }

  async banUser(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const { reason } = req.body;

      const user = await prisma.user.update({
        where: { id },
        data: {
          isBanned: true,
          bannedAt: new Date(),
          bannedReason: reason,
        },
      });

      // Log audit
      await prisma.auditLog.create({
        data: {
          userId: req.user!.id,
          action: 'ban_user',
          resource: 'user',
          details: `Banned user ${user.email}: ${reason}`,
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
        },
      });

      res.json({
        success: true,
        message: 'User banned successfully',
      });
    } catch (error: any) {
      console.error('Ban user error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to ban user',
      });
    }
  }

  async unbanUser(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;

      const user = await prisma.user.update({
        where: { id },
        data: {
          isBanned: false,
          bannedAt: null,
          bannedReason: null,
        },
      });

      // Log audit
      await prisma.auditLog.create({
        data: {
          userId: req.user!.id,
          action: 'unban_user',
          resource: 'user',
          details: `Unbanned user ${user.email}`,
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
        },
      });

      res.json({
        success: true,
        message: 'User unbanned successfully',
      });
    } catch (error: any) {
      console.error('Unban user error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to unban user',
      });
    }
  }

  async getSubscriptions(req: AuthRequest, res: Response) {
    try {
      const { limit = '50', offset = '0', status } = req.query;

      const whereClause: any = {};

      if (status) {
        whereClause.status = status;
      }

      const subscriptions = await prisma.subscription.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        take: parseInt(limit as string),
        skip: parseInt(offset as string),
        include: {
          user: {
            select: {
              id: true,
              email: true,
              phone: true,
            },
          },
        },
      });

      const total = await prisma.subscription.count({ where: whereClause });

      res.json({
        success: true,
        data: {
          subscriptions,
          total,
          limit: parseInt(limit as string),
          offset: parseInt(offset as string),
        },
      });
    } catch (error: any) {
      console.error('Get subscriptions error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get subscriptions',
      });
    }
  }

  async getAnalytics(req: AuthRequest, res: Response) {
    try {
      const { period = '30' } = req.query;
      const days = parseInt(period as string);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Total users
      const totalUsers = await prisma.user.count();

      // New users in period
      const newUsers = await prisma.user.count({
        where: {
          createdAt: {
            gte: startDate,
          },
        },
      });

      // Active subscriptions
      const activeSubscriptions = await prisma.subscription.count({
        where: {
          status: 'active',
        },
      });

      // Subscription breakdown
      const subscriptionBreakdown = await prisma.subscription.groupBy({
        by: ['plan'],
        where: {
          status: 'active',
        },
        _count: true,
      });

      // Total messages
      const totalMessages = await prisma.message.count();

      // Messages in period
      const messagesInPeriod = await prisma.message.count({
        where: {
          createdAt: {
            gte: startDate,
          },
        },
      });

      // Total tokens used
      const tokenStats = await prisma.message.aggregate({
        _sum: {
          tokens: true,
        },
      });

      // Revenue calculation (mock)
      const planPrices: Record<string, number> = {
        basic: 9.99,
        pro: 19.99,
        enterprise: 49.99,
      };

      let monthlyRevenue = 0;
      subscriptionBreakdown.forEach((sub) => {
        monthlyRevenue += (planPrices[sub.plan] || 0) * sub._count;
      });

      // Daily active users (users who sent messages in last 24h)
      const oneDayAgo = new Date();
      oneDayAgo.setDate(oneDayAgo.getDate() - 1);

      const dau = await prisma.message.groupBy({
        by: ['userId'],
        where: {
          createdAt: {
            gte: oneDayAgo,
          },
        },
      });

      // Trial users
      const trialUsers = await prisma.user.count({
        where: {
          trialEnd: {
            gte: new Date(),
          },
          subscriptionStatus: null,
        },
      });

      // Expired trials
      const expiredTrials = await prisma.user.count({
        where: {
          trialEnd: {
            lt: new Date(),
          },
          subscriptionStatus: null,
        },
      });

      res.json({
        success: true,
        data: {
          users: {
            total: totalUsers,
            new: newUsers,
            trial: trialUsers,
            expiredTrial: expiredTrials,
            dau: dau.length,
          },
          subscriptions: {
            active: activeSubscriptions,
            breakdown: subscriptionBreakdown,
            monthlyRevenue,
          },
          messages: {
            total: totalMessages,
            inPeriod: messagesInPeriod,
            totalTokens: tokenStats._sum.tokens || 0,
          },
          period: {
            days,
            startDate,
            endDate: new Date(),
          },
        },
      });
    } catch (error: any) {
      console.error('Get analytics error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get analytics',
      });
    }
  }

  async getAuditLogs(req: AuthRequest, res: Response) {
    try {
      const { limit = '100', offset = '0', userId, action } = req.query;

      const whereClause: any = {};

      if (userId) {
        whereClause.userId = userId;
      }

      if (action) {
        whereClause.action = action;
      }

      const logs = await prisma.auditLog.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        take: parseInt(limit as string),
        skip: parseInt(offset as string),
      });

      const total = await prisma.auditLog.count({ where: whereClause });

      res.json({
        success: true,
        data: {
          logs,
          total,
          limit: parseInt(limit as string),
          offset: parseInt(offset as string),
        },
      });
    } catch (error: any) {
      console.error('Get audit logs error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get audit logs',
      });
    }
  }
}

export default new AdminController();
