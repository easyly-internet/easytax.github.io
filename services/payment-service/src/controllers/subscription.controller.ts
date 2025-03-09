// src/controllers/subscription.controller.ts
import { Request, Response, NextFunction } from 'express';
import Stripe from 'stripe';
import Subscription from '../models/subscription.model';
import Payment from '../models/payment.model';
import { createNotification } from '../utils/notifications';

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
    console.error('Error fetching subscription plans:', error);
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
    console.error(`Error fetching subscription for member ${req.params.memberId}:`, error);
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
    console.error('Error creating subscription:', error);
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
    console.error(`Error canceling subscription ${req.params.subscriptionId}:`, error);
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
    console.error(`Error fetching payments for subscription ${req.params.subscriptionId}:`, error);
    next(error);
  }
};