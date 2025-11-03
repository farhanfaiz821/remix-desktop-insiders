import { Response } from 'express';
import { AuthRequest } from '../types';
import stripeService from '../services/stripe.service';
import prisma from '../config/database';

export class StripeController {
  async createCheckoutSession(req: AuthRequest, res: Response) {
    try {
      const { plan, successUrl, cancelUrl } = req.body;
      const userId = req.user!.id;

      // Validate plan
      if (!['basic', 'pro', 'enterprise'].includes(plan)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid plan',
        });
      }

      // Check if user already has active subscription
      const existingSubscription = await prisma.subscription.findFirst({
        where: {
          userId,
          status: 'active',
        },
      });

      if (existingSubscription) {
        return res.status(400).json({
          success: false,
          error: 'User already has an active subscription',
        });
      }

      const session = await stripeService.createCheckoutSession(
        userId,
        plan,
        successUrl,
        cancelUrl
      );

      // Log audit
      await prisma.auditLog.create({
        data: {
          userId,
          action: 'checkout_created',
          resource: 'subscription',
          details: `Created checkout session for ${plan} plan`,
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
        },
      });

      res.json({
        success: true,
        data: {
          sessionId: session.id,
          url: session.url,
        },
      });
    } catch (error: any) {
      console.error('Create checkout error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to create checkout session',
      });
    }
  }

  async handleWebhook(req: AuthRequest, res: Response) {
    try {
      const signature = req.headers['stripe-signature'] as string;

      if (!signature) {
        return res.status(400).json({
          success: false,
          error: 'Missing stripe signature',
        });
      }

      await stripeService.handleWebhook(req.body, signature);

      res.json({ received: true });
    } catch (error: any) {
      console.error('Webhook error:', error);
      res.status(400).json({
        success: false,
        error: error.message || 'Webhook error',
      });
    }
  }

  async getSubscription(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.id;

      const subscription = await prisma.subscription.findFirst({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          plan: true,
          status: true,
          currentPeriodStart: true,
          currentPeriodEnd: true,
          cancelAtPeriodEnd: true,
          createdAt: true,
        },
      });

      if (!subscription) {
        return res.status(404).json({
          success: false,
          error: 'No subscription found',
        });
      }

      res.json({
        success: true,
        data: subscription,
      });
    } catch (error: any) {
      console.error('Get subscription error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get subscription',
      });
    }
  }

  async cancelSubscription(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.id;

      await stripeService.cancelSubscription(userId);

      // Log audit
      await prisma.auditLog.create({
        data: {
          userId,
          action: 'subscription_canceled',
          resource: 'subscription',
          details: 'User canceled subscription',
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
        },
      });

      res.json({
        success: true,
        message: 'Subscription will be canceled at the end of the billing period',
      });
    } catch (error: any) {
      console.error('Cancel subscription error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to cancel subscription',
      });
    }
  }

  async getPlans(req: AuthRequest, res: Response) {
    try {
      const plans = [
        {
          id: 'basic',
          name: 'Basic',
          price: 9.99,
          interval: 'month',
          features: [
            '100 messages per day',
            'Standard AI model',
            'Email support',
            'Chat history',
          ],
        },
        {
          id: 'pro',
          name: 'Pro',
          price: 19.99,
          interval: 'month',
          features: [
            '500 messages per day',
            'Advanced AI model',
            'Priority support',
            'Chat history & export',
            'Custom AI personality',
          ],
          popular: true,
        },
        {
          id: 'enterprise',
          name: 'Enterprise',
          price: 49.99,
          interval: 'month',
          features: [
            'Unlimited messages',
            'Premium AI model',
            'Dedicated support',
            'All Pro features',
            'API access',
            'Custom integrations',
          ],
        },
      ];

      res.json({
        success: true,
        data: plans,
      });
    } catch (error: any) {
      console.error('Get plans error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get plans',
      });
    }
  }
}

export default new StripeController();
