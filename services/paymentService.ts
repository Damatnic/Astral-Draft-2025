/**
 * Comprehensive Payment Service with Stripe Integration
 * Handles contest entry fees, premium features, and subscription management
 */

import Stripe from 'stripe';

// Stripe configuration
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-07-30.basil',
});

// Payment product configurations
export const PAYMENT_PRODUCTS = {
  // Contest Entry Fees
  CONTEST_ENTRY_SMALL: {
    id: 'contest_small',
    name: 'Small Contest Entry',
    price: 500, // $5.00 in cents
    currency: 'usd',
    type: 'one_time' as const,
    description: 'Entry fee for small Oracle prediction contests'
  },
  CONTEST_ENTRY_MEDIUM: {
    id: 'contest_medium',
    name: 'Medium Contest Entry',
    price: 1500, // $15.00 in cents
    currency: 'usd',
    type: 'one_time' as const,
    description: 'Entry fee for medium Oracle prediction contests'
  },
  CONTEST_ENTRY_LARGE: {
    id: 'contest_large',
    name: 'Large Contest Entry',
    price: 5000, // $50.00 in cents
    currency: 'usd',
    type: 'one_time' as const,
    description: 'Entry fee for large Oracle prediction contests'
  },
  
  // Premium Subscriptions
  ORACLE_PREMIUM: {
    id: 'oracle_premium',
    name: 'Oracle Premium',
    price: 999, // $9.99 in cents
    currency: 'usd',
    type: 'subscription' as const,
    interval: 'month' as const,
    description: 'Premium Oracle features with advanced predictions and insights'
  },
  ANALYTICS_PRO: {
    id: 'analytics_pro',
    name: 'Analytics Pro',
    price: 1999, // $19.99 in cents
    currency: 'usd',
    type: 'subscription' as const,
    interval: 'month' as const,
    description: 'Advanced analytics and detailed performance metrics'
  },
  ORACLE_ULTIMATE: {
    id: 'oracle_ultimate',
    name: 'Oracle Ultimate',
    price: 2999, // $29.99 in cents
    currency: 'usd',
    type: 'subscription' as const,
    interval: 'month' as const,
    description: 'Complete Oracle suite with all premium features and priority support'
  }
};

// Payment interfaces
export interface PaymentIntent {
  id: string;
  amount: number;
  currency: string;
  status: string;
  clientSecret: string;
  metadata: Record<string, string>;
}

export interface SubscriptionPlan {
  id: string;
  productId: string;
  priceId: string;
  status: 'active' | 'canceled' | 'past_due' | 'trialing';
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
}

export interface PaymentHistory {
  id: string;
  userId: string;
  amount: number;
  currency: string;
  status: 'succeeded' | 'pending' | 'failed' | 'refunded';
  type: 'contest_entry' | 'subscription' | 'one_time';
  productId: string;
  stripePaymentIntentId: string;
  createdAt: Date;
  updatedAt: Date;
  metadata?: Record<string, any>;
}

export interface RefundRequest {
  paymentId: string;
  amount?: number; // Partial refund amount, omit for full refund
  reason: 'duplicate' | 'fraudulent' | 'requested_by_customer' | 'contest_cancelled';
  metadata?: Record<string, string>;
}

class PaymentService {
  private readonly webhookSecret: string;

  constructor() {
    this.webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';
    // Initialize products asynchronously
    setTimeout(() => this.initializeProducts(), 0);
  }

  /**
   * Initialize Stripe products and prices
   */
  private async initializeProducts(): Promise<void> {
    try {
      console.log('🔧 Initializing Stripe products...');
      
      for (const product of Object.values(PAYMENT_PRODUCTS)) {
        await this.ensureProductExists(product);
      }
      
      console.log('✅ Stripe products initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Stripe products:', error);
    }
  }

  /**
   * Ensure a product exists in Stripe
   */
  private async ensureProductExists(productConfig: typeof PAYMENT_PRODUCTS[keyof typeof PAYMENT_PRODUCTS]): Promise<void> {
    try {
      // Check if product exists
      const products = await stripe.products.list({ ids: [productConfig.id] });
      
      let product;
      if (products.data.length === 0) {
        // Create product
        product = await stripe.products.create({
          id: productConfig.id,
          name: productConfig.name,
          description: productConfig.description,
          type: productConfig.type === 'subscription' ? 'service' : 'good'
        });
        console.log(`✅ Created Stripe product: ${productConfig.name}`);
      } else {
        product = products.data[0];
      }

      // Ensure price exists
      const prices = await stripe.prices.list({ product: product.id });
      
      if (prices.data.length === 0) {
        const priceData: Stripe.PriceCreateParams = {
          product: product.id,
          unit_amount: productConfig.price,
          currency: productConfig.currency,
        };

        if (productConfig.type === 'subscription' && 'interval' in productConfig) {
          priceData.recurring = { interval: productConfig.interval };
        }

        await stripe.prices.create(priceData);
        console.log(`✅ Created Stripe price for: ${productConfig.name}`);
      }

    } catch (error) {
      console.error(`❌ Failed to ensure product exists: ${productConfig.name}`, error);
    }
  }

  /**
   * Create payment intent for contest entry
   */
  async createContestEntryPayment(
    userId: string,
    contestId: string,
    entryType: 'CONTEST_ENTRY_SMALL' | 'CONTEST_ENTRY_MEDIUM' | 'CONTEST_ENTRY_LARGE'
  ): Promise<PaymentIntent> {
    try {
      const product = PAYMENT_PRODUCTS[entryType];
      
      const paymentIntent = await stripe.paymentIntents.create({
        amount: product.price,
        currency: product.currency,
        metadata: {
          userId,
          contestId,
          productId: product.id,
          type: 'contest_entry'
        },
        description: `Contest entry: ${product.name}`,
        automatic_payment_methods: {
          enabled: true,
        },
      });

      console.log(`💳 Created contest entry payment intent for user ${userId}: $${product.price / 100}`);

      return {
        id: paymentIntent.id,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        status: paymentIntent.status,
        clientSecret: paymentIntent.client_secret || '',
        metadata: paymentIntent.metadata
      };

    } catch (error) {
      console.error('❌ Failed to create contest entry payment:', error);
      throw new Error('Failed to create payment intent');
    }
  }

  /**
   * Create subscription for premium features
   */
  async createSubscription(
    userId: string,
    customerId: string,
    subscriptionType: 'ORACLE_PREMIUM' | 'ANALYTICS_PRO' | 'ORACLE_ULTIMATE',
    trialDays: number = 7
  ): Promise<Stripe.Subscription> {
    try {
      const product = PAYMENT_PRODUCTS[subscriptionType];
      
      // Get the price ID for this product
      const prices = await stripe.prices.list({ product: product.id });
      const price = prices.data[0];
      
      if (!price) {
        throw new Error(`No price found for product ${product.id}`);
      }

      const subscription = await stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: price.id }],
        trial_period_days: trialDays,
        metadata: {
          userId,
          productId: product.id,
          type: 'subscription'
        },
        expand: ['latest_invoice.payment_intent'],
      });

      console.log(`🔔 Created subscription for user ${userId}: ${product.name}`);

      return subscription;

    } catch (error) {
      console.error('❌ Failed to create subscription:', error);
      throw new Error('Failed to create subscription');
    }
  }

  /**
   * Create or retrieve Stripe customer
   */
  async createOrGetCustomer(userId: string, email: string, name?: string): Promise<Stripe.Customer> {
    try {
      // First, try to find existing customer
      const existingCustomers = await stripe.customers.list({
        email: email,
        limit: 1
      });

      if (existingCustomers.data.length > 0) {
        const customer = existingCustomers.data[0];
        console.log(`📋 Found existing Stripe customer for ${email}`);
        return customer;
      }

      // Create new customer
      const customer = await stripe.customers.create({
        email,
        name,
        metadata: {
          userId: userId
        }
      });

      console.log(`👤 Created new Stripe customer for ${email}`);
      return customer;

    } catch (error) {
      console.error('❌ Failed to create/get customer:', error);
      throw new Error('Failed to manage customer');
    }
  }

  /**
   * Process webhook events
   */
  async handleWebhook(payload: string, signature: string): Promise<void> {
    try {
      const event = stripe.webhooks.constructEvent(payload, signature, this.webhookSecret);

      console.log(`🔔 Processing Stripe webhook: ${event.type}`);

      switch (event.type) {
        case 'payment_intent.succeeded':
          await this.handlePaymentSuccess(event.data.object as Stripe.PaymentIntent);
          break;

        case 'payment_intent.payment_failed':
          await this.handlePaymentFailure(event.data.object as Stripe.PaymentIntent);
          break;

        case 'customer.subscription.created':
        case 'customer.subscription.updated':
          await this.handleSubscriptionUpdate(event.data.object as Stripe.Subscription);
          break;

        case 'customer.subscription.deleted':
          await this.handleSubscriptionCancellation(event.data.object as Stripe.Subscription);
          break;

        case 'invoice.payment_succeeded':
          await this.handleInvoicePaymentSuccess(event.data.object as Stripe.Invoice);
          break;

        case 'invoice.payment_failed':
          await this.handleInvoicePaymentFailure(event.data.object as Stripe.Invoice);
          break;

        default:
          console.log(`⚠️ Unhandled webhook event type: ${event.type}`);
      }

    } catch (error) {
      console.error('❌ Webhook processing error:', error);
      throw error;
    }
  }

  /**
   * Get user's payment history
   */
  async getPaymentHistory(userId: string, limit: number = 50): Promise<PaymentHistory[]> {
    try {
      // In a real implementation, this would query your database
      // For now, we'll fetch from Stripe directly
      const paymentIntents = await stripe.paymentIntents.list({
        limit,
        expand: ['data.charges']
      });

      const userPayments = paymentIntents.data
        .filter(pi => pi.metadata.userId === userId)
        .map(pi => ({
          id: pi.id,
          userId: pi.metadata.userId,
          amount: pi.amount,
          currency: pi.currency,
          status: pi.status as PaymentHistory['status'],
          type: (pi.metadata.type || 'one_time') as PaymentHistory['type'],
          productId: pi.metadata.productId || '',
          stripePaymentIntentId: pi.id,
          createdAt: new Date(pi.created * 1000),
          updatedAt: new Date(pi.created * 1000),
          metadata: pi.metadata
        }));

      return userPayments;

    } catch (error) {
      console.error('❌ Failed to get payment history:', error);
      throw new Error('Failed to retrieve payment history');
    }
  }

  /**
   * Get user's active subscriptions
   */
  async getUserSubscriptions(customerId: string): Promise<SubscriptionPlan[]> {
    try {
      const subscriptions = await stripe.subscriptions.list({
        customer: customerId,
        status: 'all',
        expand: ['data.items.data.price.product']
      });

      return subscriptions.data.map(sub => ({
        id: sub.id,
        productId: sub.metadata.productId || '',
        priceId: sub.items.data[0].price.id,
        status: sub.status as SubscriptionPlan['status'],
        currentPeriodStart: new Date((sub as any).current_period_start * 1000),
        currentPeriodEnd: new Date((sub as any).current_period_end * 1000),
        cancelAtPeriodEnd: (sub as any).cancel_at_period_end
      }));

    } catch (error) {
      console.error('❌ Failed to get user subscriptions:', error);
      throw new Error('Failed to retrieve subscriptions');
    }
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(subscriptionId: string, immediate: boolean = false): Promise<Stripe.Subscription> {
    try {
      let subscription;
      
      if (immediate) {
        subscription = await stripe.subscriptions.cancel(subscriptionId);
        console.log(`🗑️ Immediately cancelled subscription: ${subscriptionId}`);
      } else {
        subscription = await stripe.subscriptions.update(subscriptionId, {
          cancel_at_period_end: true
        });
        console.log(`📅 Scheduled subscription cancellation: ${subscriptionId}`);
      }

      return subscription;

    } catch (error) {
      console.error('❌ Failed to cancel subscription:', error);
      throw new Error('Failed to cancel subscription');
    }
  }

  /**
   * Process refund
   */
  async processRefund(refundRequest: RefundRequest): Promise<Stripe.Refund> {
    try {
      const refundData: Stripe.RefundCreateParams = {
        payment_intent: refundRequest.paymentId,
        reason: refundRequest.reason === 'contest_cancelled' ? 'requested_by_customer' : refundRequest.reason,
        metadata: refundRequest.metadata || {}
      };

      if (refundRequest.amount) {
        refundData.amount = refundRequest.amount;
      }

      const refund = await stripe.refunds.create(refundData);

      console.log(`💰 Processed refund: ${refund.id} for payment ${refundRequest.paymentId}`);

      return refund;

    } catch (error) {
      console.error('❌ Failed to process refund:', error);
      throw new Error('Failed to process refund');
    }
  }

  /**
   * Get payment analytics
   */
  async getPaymentAnalytics(startDate: Date, endDate: Date): Promise<{
    totalRevenue: number;
    subscriptionRevenue: number;
    contestRevenue: number;
    activeSubscriptions: number;
    newSubscriptions: number;
    refundAmount: number;
    paymentsByType: Record<string, number>;
  }> {
    try {
      const startTimestamp = Math.floor(startDate.getTime() / 1000);
      const endTimestamp = Math.floor(endDate.getTime() / 1000);

      // Fetch payment intents in date range
      const paymentIntents = await stripe.paymentIntents.list({
        created: {
          gte: startTimestamp,
          lte: endTimestamp
        },
        limit: 1000
      });

      // Fetch subscriptions
      const subscriptions = await stripe.subscriptions.list({
        status: 'active',
        limit: 1000
      });

      // Fetch refunds
      const refunds = await stripe.refunds.list({
        created: {
          gte: startTimestamp,
          lte: endTimestamp
        },
        limit: 1000
      });

      // Calculate analytics
      const successfulPayments = paymentIntents.data.filter(pi => pi.status === 'succeeded');
      const totalRevenue = successfulPayments.reduce((sum, pi) => sum + pi.amount, 0) / 100;
      
      const subscriptionRevenue = successfulPayments
        .filter(pi => pi.metadata.type === 'subscription')
        .reduce((sum, pi) => sum + pi.amount, 0) / 100;
      
      const contestRevenue = successfulPayments
        .filter(pi => pi.metadata.type === 'contest_entry')
        .reduce((sum, pi) => sum + pi.amount, 0) / 100;

      const refundAmount = refunds.data.reduce((sum, refund) => sum + refund.amount, 0) / 100;

      const paymentsByType = successfulPayments.reduce((acc, pi) => {
        const type = pi.metadata.productId || 'unknown';
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      return {
        totalRevenue,
        subscriptionRevenue,
        contestRevenue,
        activeSubscriptions: subscriptions.data.length,
        newSubscriptions: subscriptions.data.filter(sub => 
          sub.created >= startTimestamp && sub.created <= endTimestamp
        ).length,
        refundAmount,
        paymentsByType
      };

    } catch (error) {
      console.error('❌ Failed to get payment analytics:', error);
      throw new Error('Failed to retrieve payment analytics');
    }
  }

  // Private webhook handlers

  private async handlePaymentSuccess(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    const { userId, contestId, productId, type } = paymentIntent.metadata;
    
    console.log(`✅ Payment succeeded for user ${userId}: ${productId}`);
    
    if (type === 'contest_entry' && contestId) {
      // Grant contest entry access
      await this.grantContestAccess(userId, contestId);
    }
    
    // Record payment in database
    await this.recordPayment(paymentIntent);
  }

  private async handlePaymentFailure(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    const { userId, productId } = paymentIntent.metadata;
    
    console.log(`❌ Payment failed for user ${userId}: ${productId}`);
    
    // Send notification to user about payment failure
    // await this.sendPaymentFailureNotification(userId, paymentIntent);
  }

  private async handleSubscriptionUpdate(subscription: Stripe.Subscription): Promise<void> {
    const { userId } = subscription.metadata;
    
    console.log(`🔔 Subscription updated for user ${userId}: ${subscription.status}`);
    
    // Update user's subscription status in database
    // await this.updateUserSubscription(userId, subscription);
  }

  private async handleSubscriptionCancellation(subscription: Stripe.Subscription): Promise<void> {
    const { userId } = subscription.metadata;
    
    console.log(`🗑️ Subscription cancelled for user ${userId}`);
    
    // Remove premium features access
    // await this.revokePremiumAccess(userId);
  }

  private async handleInvoicePaymentSuccess(invoice: Stripe.Invoice): Promise<void> {
    console.log(`✅ Invoice payment succeeded: ${invoice.id}`);
    
    // Handle successful recurring payment
    // await this.handleRecurringPaymentSuccess(invoice);
  }

  private async handleInvoicePaymentFailure(invoice: Stripe.Invoice): Promise<void> {
    console.log(`❌ Invoice payment failed: ${invoice.id}`);
    
    // Handle failed recurring payment
    // await this.handleRecurringPaymentFailure(invoice);
  }

  private async grantContestAccess(userId: string, contestId: string): Promise<void> {
    // Implementation would grant user access to the contest
    console.log(`🎯 Granting contest access for user ${userId} to contest ${contestId}`);
  }

  private async recordPayment(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    // Implementation would record payment in database
    console.log(`📝 Recording payment: ${paymentIntent.id}`);
  }
}

// Export singleton instance
export const paymentService = new PaymentService();
export default paymentService;
