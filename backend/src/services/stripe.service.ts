import Stripe from 'stripe';
import { env } from '../config/env';
import prisma from '../config/database';

const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
});

export class StripeService {
  async createCheckoutSession(
    userId: string,
    plan: 'basic' | 'pro' | 'enterprise',
    successUrl?: string,
    cancelUrl?: string
  ): Promise<Stripe.Checkout.Session> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true },
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Get price ID based on plan
      const priceIds: Record<string, string> = {
        basic: env.STRIPE_BASIC_PRICE_ID || 'price_basic_test',
        pro: env.STRIPE_PRO_PRICE_ID || 'price_pro_test',
        enterprise: env.STRIPE_ENTERPRISE_PRICE_ID || 'price_enterprise_test',
      };

      const priceId = priceIds[plan];

      const session = await stripe.checkout.sessions.create({
        customer_email: user.email,
        payment_method_types: ['card'],
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        mode: 'subscription',
        success_url: successUrl || `${env.FRONTEND_URL}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: cancelUrl || `${env.FRONTEND_URL}/subscription/cancel`,
        metadata: {
          userId,
          plan,
        },
      });

      return session;
    } catch (error: any) {
      console.error('Stripe checkout error:', error);
      throw new Error(error.message || 'Failed to create checkout session');
    }
  }

  async handleWebhook(payload: Buffer, signature: string): Promise<void> {
    try {
      const event = stripe.webhooks.constructEvent(
        payload,
        signature,
        env.STRIPE_WEBHOOK_SECRET
      );

      console.log('Stripe webhook event:', event.type);

      switch (event.type) {
        case 'checkout.session.completed':
          await this.handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
          break;

        case 'customer.subscription.created':
        case 'customer.subscription.updated':
          await this.handleSubscriptionUpdate(event.data.object as Stripe.Subscription);
          break;

        case 'customer.subscription.deleted':
          await this.handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
          break;

        case 'invoice.payment_succeeded':
          await this.handlePaymentSucceeded(event.data.object as Stripe.Invoice);
          break;

        case 'invoice.payment_failed':
          await this.handlePaymentFailed(event.data.object as Stripe.Invoice);
          break;

        default:
          console.log(`Unhandled event type: ${event.type}`);
      }
    } catch (error: any) {
      console.error('Webhook error:', error);
      throw new Error('Webhook signature verification failed');
    }
  }

  private async handleCheckoutCompleted(session: Stripe.Checkout.Session): Promise<void> {
    const userId = session.metadata?.userId;
    const plan = session.metadata?.plan;

    if (!userId || !plan) {
      console.error('Missing metadata in checkout session');
      return;
    }

    const subscriptionId = session.subscription as string;
    const customerId = session.customer as string;

    // Get subscription details
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);

    // Update user subscription
    await prisma.user.update({
      where: { id: userId },
      data: {
        subscriptionPlan: plan,
        subscriptionStatus: 'active',
      },
    });

    // Create subscription record
    await prisma.subscription.create({
      data: {
        userId,
        stripeCustomerId: customerId,
        stripeSubscriptionId: subscriptionId,
        stripePriceId: subscription.items.data[0].price.id,
        status: subscription.status,
        plan,
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      },
    });

    console.log(`Subscription created for user ${userId}, plan: ${plan}`);
  }

  private async handleSubscriptionUpdate(subscription: Stripe.Subscription): Promise<void> {
    const subscriptionRecord = await prisma.subscription.findUnique({
      where: { stripeSubscriptionId: subscription.id },
    });

    if (!subscriptionRecord) {
      console.error('Subscription not found:', subscription.id);
      return;
    }

    await prisma.subscription.update({
      where: { stripeSubscriptionId: subscription.id },
      data: {
        status: subscription.status,
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
      },
    });

    await prisma.user.update({
      where: { id: subscriptionRecord.userId },
      data: {
        subscriptionStatus: subscription.status,
      },
    });

    console.log(`Subscription updated: ${subscription.id}, status: ${subscription.status}`);
  }

  private async handleSubscriptionDeleted(subscription: Stripe.Subscription): Promise<void> {
    const subscriptionRecord = await prisma.subscription.findUnique({
      where: { stripeSubscriptionId: subscription.id },
    });

    if (!subscriptionRecord) {
      return;
    }

    await prisma.subscription.update({
      where: { stripeSubscriptionId: subscription.id },
      data: {
        status: 'canceled',
      },
    });

    await prisma.user.update({
      where: { id: subscriptionRecord.userId },
      data: {
        subscriptionStatus: 'canceled',
      },
    });

    console.log(`Subscription canceled: ${subscription.id}`);
  }

  private async handlePaymentSucceeded(invoice: Stripe.Invoice): Promise<void> {
    console.log(`Payment succeeded for invoice: ${invoice.id}`);
  }

  private async handlePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
    const subscriptionId = invoice.subscription as string;

    if (subscriptionId) {
      const subscriptionRecord = await prisma.subscription.findUnique({
        where: { stripeSubscriptionId: subscriptionId },
      });

      if (subscriptionRecord) {
        await prisma.user.update({
          where: { id: subscriptionRecord.userId },
          data: {
            subscriptionStatus: 'past_due',
          },
        });
      }
    }

    console.log(`Payment failed for invoice: ${invoice.id}`);
  }

  async cancelSubscription(userId: string): Promise<void> {
    const subscription = await prisma.subscription.findFirst({
      where: { userId, status: 'active' },
    });

    if (!subscription) {
      throw new Error('No active subscription found');
    }

    await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
      cancel_at_period_end: true,
    });

    await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        cancelAtPeriodEnd: true,
      },
    });
  }
}

export default new StripeService();
