// src/services/payment-service/index.ts
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import mongoose from 'mongoose';
import Stripe from 'stripe';
import { connectDatabase } from './database';
import subscriptionRoutes from './routes/subscription.routes';
import paymentRoutes from './routes/payment.routes';
import webhookRoutes from './routes/webhook.routes';
import authMiddleware from './middleware/auth.middleware';
import errorHandler from './middleware/error.middleware';
import { logger } from './utils/logger';
import cron from 'node-cron';
import { processRecurringPayments } from './utils/subscriptionManager';

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16'
});

const app = express();
const PORT = process.env.PORT || 8004;

// Middlewares
app.use(cors());
app.use(helmet());
app.use(morgan('combined'));

// Special handling for Stripe webhooks - raw body needed
app.use('/api/payments/webhook', express.raw({ type: 'application/json' }));

// Regular JSON parsing for all other routes
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// API routes
app.use('/api/subscriptions', authMiddleware, subscriptionRoutes);
app.use('/api/payments', authMiddleware, paymentRoutes);
app.use('/api/payments/webhook', webhookRoutes);

// Error handling
app.use(errorHandler);

// Schedule recurring payment processing
cron.schedule('0 0 * * *', async () => {
  try {
    logger.info('Running scheduled subscription renewal check');
    await processRecurringPayments();
  } catch (error) {
    logger.error('Error processing recurring payments:', error);
  }
});

// Start server
const startServer = async () => {
  try {
    await connectDatabase();
    app.listen(PORT, () => {
      logger.info(`Payment service running on port ${PORT}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

// src/models/subscription.model.ts
import mongoose, { Document, Schema } from 'mongoose';

export interface ISubscription extends Document {
  memberId: mongoose.Types.ObjectId;
  plan: 'BASIC' | 'STANDARD' | 'PREMIUM';
  startDate: Date;
  endDate: Date;
  autoRenew: boolean;
  amount: number;
  status: 'ACTIVE' | 'PENDING' | 'CANCELED' | 'EXPIRED';
  paymentId?: mongoose.Types.ObjectId;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  nextBillingDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const SubscriptionSchema: Schema = new Schema(
  {
    memberId: {
      type: Schema.Types.ObjectId,
      ref: 'Member',
      required: true
    },
    plan: {
      type: String,
      enum: ['BASIC', 'STANDARD', 'PREMIUM'],
      required: true
    },
    startDate: {
      type: Date,
      required: true
    },
    endDate: {
      type: Date,
      required: true
    },
    autoRenew: {
      type: Boolean,
      default: true
    },
    amount: {
      type: Number,
      required: true
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'PENDING', 'CANCELED', 'EXPIRED'],
      default: 'PENDING'
    },
    paymentId: {
      type: Schema.Types.ObjectId,
      ref: 'Payment'
    },
    stripeCustomerId: {
      type: String
    },
    stripeSubscriptionId: {
      type: String
    },
    nextBillingDate: {
      type: Date
    }
  },
  { timestamps: true }
);

export default mongoose.model<ISubscription>('Subscription', SubscriptionSchema);

// src/models/payment.model.ts
import mongoose, { Document, Schema } from 'mongoose';

export interface IPayment extends Document {
  memberId: mongoose.Types.ObjectId;
  subscriptionId?: mongoose.Types.ObjectId;
  type: 'SUBSCRIPTION' | 'ONE_TIME';
  amount: number;
  currency: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';
  paymentMethod: 'CARD' | 'UPI' | 'NETBANKING' | 'WALLET';
  paymentMethodDetails?: {
    type: string;
    last4?: string;
    brand?: string;
    upiId?: string;
  };
  stripePaymentIntentId?: string;
  stripeChargeId?: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  transactionDate: Date;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentSchema: Schema = new Schema(
  {
    memberId: {
      type: Schema.Types.ObjectId,
      ref: 'Member',
      required: true
    },
    subscriptionId: {
      type: Schema.Types.ObjectId,
      ref: 'Subscription'
    },
    type: {
      type: String,
      enum: ['SUBSCRIPTION', 'ONE_TIME'],
      required: true
    },
    amount: {
      type: Number,
      required: true
    },
    currency: {
      type: String,
      default: 'INR'
    },
    status: {
      type: String,
      enum: ['PENDING', 'COMPLETED', 'FAILED', 'REFUNDED'],
      default: 'PENDING'
    },
    paymentMethod: {
      type: String,
      enum: ['CARD', 'UPI', 'NETBANKING', 'WALLET'],
      required: true
    },
    paymentMethodDetails: {
      type: {
        type: String,
        last4: String,
        brand: String,
        upiId: String
      }
    },
    stripePaymentIntentId: {
      type: String
    },
    stripeChargeId: {
      type: String
    },
    razorpayOrderId: {
      type: String
    },
    razorpayPaymentId: {
      type: String
    },
    transactionDate: {
      type: Date,
      default: Date.now
    },
    metadata: {
      type: Schema.Types.Mixed
    }
  },
  { timestamps: true }
);

export default mongoose.model<IPayment>('Payment', PaymentSchema);

// src/controllers/subscription.controller.ts
import { Request, Response, NextFunction } from 'express';
import Stripe from 'stripe';
import Subscription from '../models/subscription.model';
import Payment from '../models/payment.model';
import { createNotification } from '../utils/notifications';
import { logger } from '../utils/logger';
import { subscriptionPlans } from '../config/plans';
import mongoose from 'mongoose';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16'
});

/**
 * Get subscription plans
 */
export const getSubscriptionPlans = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    res.status(200).json({
      success: true,
      data: subscriptionPlans
    });
  } catch (error) {
    logger.error('Error fetching subscription plans:', error);
    next(error);
  }
};

/**
 * Get member subscription
 */
export const getMemberSubscription = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { memberId } = req.params;

    const subscription = await Subscription.findOne({
      memberId,
      status: { $in: ['ACTIVE', 'PENDING'] }
    }).sort({ createdAt: -1 });

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'No active subscription found'
      });
    }

    res.status(200).json({
      success: true,
      data: subscription
    });
  } catch (error) {
    logger.error(`Error fetching subscription for member ${req.params.memberId}:`, error);
    next(error);
  }
};

/**
 * Create new subscription
 */
export const createSubscription = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { memberId, plan, paymentMethod } = req.body;

    // Check if plan exists
    const planConfig = subscriptionPlans.find(p => p.name === plan);
    if (!planConfig) {
      return res.status(400).json({
        success: false,
        message: 'Invalid subscription plan'
      });
    }

    // Check if member already has active subscription
    const existingSubscription = await Subscription.findOne({
      memberId,
      status: 'ACTIVE'
    });

    if (existingSubscription) {
      return res.status(400).json({
        success: false,
        message: 'Member already has an active subscription'
      });
    }

    // Create Stripe customer and payment method if needed
    const member = await mongoose.model('Member').findById(memberId);
    if (!member) {
      return res.status(404).json({
        success: false,
        message: 'Member not found'
      });
    }

    let stripeCustomerId = '';

    // Check if member already has a Stripe customer ID
    const existingSub = await Subscription.findOne({ memberId });
    if (existingSub?.stripeCustomerId) {
      stripeCustomerId = existingSub.stripeCustomerId;
    } else {
      // Create new Stripe customer
      const customer = await stripe.customers.create({
        email: member.email,
        name: member.fullName,
        metadata: {
          memberId: memberId.toString()
        }
      });

      stripeCustomerId = customer.id;
    }

    // Calculate subscription dates
    const startDate = new Date();
    const endDate = new Date();
    endDate.setFullYear(endDate.getFullYear() + 1); // 1 year subscription

    // Create subscription record
    const subscription = await Subscription.create({
      memberId,
      plan,
      startDate,
      endDate,
      autoRenew: true,
      amount: planConfig.price,
      status: 'PENDING',
      stripeCustomerId
    });

    // Create payment intent for this subscription
    const paymentIntent = await stripe.paymentIntents.create({
      amount: planConfig.price * 100, // Stripe uses cents
      currency: 'inr',
      customer: stripeCustomerId,
      metadata: {
        subscriptionId: subscription._id.toString(),
        memberId: memberId.toString(),
        plan
      },
      payment_method_types: ['card', 'upi']
    });

    // Create payment record
    const payment = await Payment.create({
      memberId,
      subscriptionId: subscription._id,
      type: 'SUBSCRIPTION',
      amount: planConfig.price,
      currency: 'INR',
      status: 'PENDING',
      paymentMethod: paymentMethod || 'CARD',
      stripePaymentIntentId: paymentIntent.id,
      transactionDate: new Date()
    });

    // Update subscription with payment ID
    subscription.paymentId = payment._id;
    await subscription.save();

    await session.commitTransaction();

    res.status(201).json({
      success: true,
      data: {
        subscription,
        payment,
        clientSecret: paymentIntent.client_secret
      }
    });
  } catch (error) {
    await session.abortTransaction();
    logger.error('Error creating subscription:', error);
    next(error);
  } finally {
    session.endSession();
  }
};

/**
 * Cancel subscription
 */
export const cancelSubscription = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { subscriptionId } = req.params;

    const subscription = await Subscription.findById(subscriptionId);

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Subscription not found'
      });
    }

    // Cancel Stripe subscription if exists
    if (subscription.stripeSubscriptionId) {
      await stripe.subscriptions.cancel(subscription.stripeSubscriptionId);
    }

    // Update subscription status
    subscription.status = 'CANCELED';
    subscription.autoRenew = false;
    await subscription.save();

    // Send notification
    const member = await mongoose.model('Member').findById(subscription.memberId);
    if (member) {
      await createNotification({
        to: member.email,
        subject: 'Subscription Canceled',
        template: 'subscription-canceled',
        data: {
          name: member.fullName,
          plan: subscription.plan,
          endDate: subscription.endDate.toLocaleDateString()
        }
      });
    }

    res.status(200).json({
      success: true,
      data: subscription
    });
  } catch (error) {
    logger.error(`Error canceling subscription ${req.params.subscriptionId}:`, error);
    next(error);
  }
};

/**
 * Get subscription payment history
 */
export const getSubscriptionPayments = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { subscriptionId } = req.params;

    const payments = await Payment.find({ subscriptionId })
      .sort({ transactionDate: -1 });

    res.status(200).json({
      success: true,
      data: payments
    });
  } catch (error) {
    logger.error(`Error fetching payments for subscription ${req.params.subscriptionId}:`, error);
    next(error);
  }
};

// src/utils/subscriptionManager.ts
import Subscription from '../models/subscription.model';
import Payment from '../models/payment.model';
import { createNotification } from './notifications';
import { logger } from './logger';
import Stripe from 'stripe';
import { subscriptionPlans } from '../config/plans';
import mongoose from 'mongoose';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16'
});

/**
 * Process recurring payments for subscriptions due for renewal
 */
export const processRecurringPayments = async () => {
  try {
    // Get all active subscriptions that are set to auto-renew and have an end date approaching
    const today = new Date();
    const expirationWindow = new Date();
    expirationWindow.setDate(today.getDate() + 5); // Look for subscriptions expiring in the next 5 days

    // Find subscriptions due for renewal
    const dueSubscriptions = await Subscription.find({
      status: 'ACTIVE',
      autoRenew: true,
      endDate: { $lte: expirationWindow, $gte: today }
    }).populate('memberId');

    logger.info(`Found ${dueSubscriptions.length} subscriptions due for renewal`);

    // Process each subscription
    for (const subscription of dueSubscriptions) {
      try {
        // If subscription has a Stripe subscription ID, let Stripe handle it
        if (subscription.stripeSubscriptionId) {
          logger.info(`Stripe will auto-renew subscription ${subscription._id}`);
          continue;
        }

        // Otherwise, create a new payment for this subscription
        const member = subscription.memberId as any; // Populated member

        if (!member) {
          logger.error(`Member not found for subscription ${subscription._id}`);
          continue;
        }

        // Find plan details
        const planConfig = subscriptionPlans.find(p => p.name === subscription.plan);
        if (!planConfig) {
          logger.error(`Plan not found for subscription ${subscription._id}`);
          continue;
        }

        // Create payment intent
        const paymentIntent = await stripe.paymentIntents.create({
          amount: subscription.amount * 100, // Stripe uses cents
          currency: 'inr',
          customer: subscription.stripeCustomerId,
          metadata: {
            subscriptionId: subscription._id.toString(),
            memberId: member._id.toString(),
            renewalPayment: 'true'
          },
          payment_method_types: ['card', 'upi'],
          off_session: true,
          confirm: true
        });

        // Create payment record
        const payment = await Payment.create({
          memberId: member._id,
          subscriptionId: subscription._id,
          type: 'SUBSCRIPTION',
          amount: subscription.amount,
          currency: 'INR',
          status: paymentIntent.status === 'succeeded' ? 'COMPLETED' : 'PENDING',
          paymentMethod: 'CARD', // Assuming default saved payment method
          stripePaymentIntentId: paymentIntent.id,
          transactionDate: new Date()
        });

        // Update subscription if payment succeeded
        if (paymentIntent.status === 'succeeded') {
          // Calculate new end date
          const newEndDate = new Date(subscription.endDate);
          newEndDate.setFullYear(newEndDate.getFullYear() + 1);

          subscription.startDate = subscription.endDate;
          subscription.endDate = newEndDate;
          subscription.paymentId = payment._id;
          await subscription.save();

          // Send notification
          await createNotification({
            to: member.email,
            subject: 'Subscription Renewal Successful',
            template: 'subscription-renewed',
            data: {
              name: member.fullName,
              plan: subscription.plan,
              amount: subscription.amount,
              endDate: newEndDate.toLocaleDateString()
            }
          });

          logger.info(`Successfully renewed subscription ${subscription._id}`);
        } else {
          // Send notification about pending payment
          await createNotification({
            to: member.email,
            subject: 'Action Required: Subscription Renewal',
            template: 'subscription-renewal-pending',
            data: {
              name: member.fullName,
              plan: subscription.plan,
              amount: subscription.amount,
              endDate: subscription.endDate.toLocaleDateString()
            }
          });

          logger.info(`Renewal pending for subscription ${subscription._id}`);
        }
      } catch (error) {
        logger.error(`Error processing subscription ${subscription._id}:`, error);
      }
    }

    logger.info('Subscription renewal process completed');
  } catch (error) {
    logger.error('Error in subscription renewal process:', error);
    throw error;
  }
};

/**
 * Handle subscription expiration
 */
export const handleExpiredSubscriptions = async () => {
  try {
    // Get all active subscriptions that have expired
    const today = new Date();

    // Find expired subscriptions
    const expiredSubscriptions = await Subscription.find({
      status: 'ACTIVE',
      endDate: { $lt: today }
    }).populate('memberId');

    logger.info(`Found ${expiredSubscriptions.length} expired subscriptions`);

    // Process each subscription
    for (const subscription of expiredSubscriptions) {
      try {
        const member = subscription.memberId as any; // Populated member

        if (!member) {
          logger.error(`Member not found for subscription ${subscription._id}`);
          continue;
        }

        // Update subscription status
        subscription.status = 'EXPIRED';
        await subscription.save();

        // Send notification
        await createNotification({
          to: member.email,
          subject: 'Your Subscription Has Expired',
          template: 'subscription-expired',
          data: {
            name: member.fullName,
            plan: subscription.plan,
            endDate: subscription.endDate.toLocaleDateString()
          }
        });

        logger.info(`Marked subscription ${subscription._id} as expired`);
      } catch (error) {
        logger.error(`Error handling expired subscription ${subscription._id}:`, error);
      }
    }

    logger.info('Expired subscription handling completed');
  } catch (error) {
    logger.error('Error handling expired subscriptions:', error);
    throw error;
  }
};