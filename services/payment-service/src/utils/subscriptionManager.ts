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

    console.info(`Found ${dueSubscriptions.length} subscriptions due for renewal`);

    // Process each subscription
    for (const subscription of dueSubscriptions) {
      try {
        // If subscription has a Stripe subscription ID, let Stripe handle it
        if (subscription.stripeSubscriptionId) {
          console.info(`Stripe will auto-renew subscription ${subscription._id}`);
          continue;
        }

        // Otherwise, create a new payment for this subscription
        const member = subscription.memberId as any; // Populated member

        if (!member) {
          console.error(`Member not found for subscription ${subscription._id}`);
          continue;
        }

        // Find plan details
        const planConfig = subscriptionPlans.find(p => p.name === subscription.plan);
        if (!planConfig) {
          console.error(`Plan not found for subscription ${subscription._id}`);
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

          console.info(`Successfully renewed subscription ${subscription._id}`);
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

          console.info(`Renewal pending for subscription ${subscription._id}`);
        }
      } catch (error) {
        console.error(`Error processing subscription ${subscription._id}:`, error);
      }
    }

    console.info('Subscription renewal process completed');
  } catch (error) {
    console.error('Error in subscription renewal process:', error);
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

    console.info(`Found ${expiredSubscriptions.length} expired subscriptions`);

    // Process each subscription
    for (const subscription of expiredSubscriptions) {
      try {
        const member = subscription.memberId as any; // Populated member

        if (!member) {
          console.error(`Member not found for subscription ${subscription._id}`);
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

        console.info(`Marked subscription ${subscription._id} as expired`);
      } catch (error) {
        console.error(`Error handling expired subscription ${subscription._id}:`, error);
      }
    }

    console.info('Expired subscription handling completed');
  } catch (error) {
    console.error('Error handling expired subscriptions:', error);
    throw error;
  }
};