import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import mongoose from 'mongoose';
import { connectDatabase } from './database';
import subscriptionRoutes from './routes/subscription.routes';
import paymentRoutes from './routes/payment.routes';
import webhookRoutes from './routes/webhook.routes';
import { authenticate } from './middleware/auth.middleware';
import { errorHandler } from './middleware/error.middleware';
import cron from 'node-cron';
import { processRecurringPayments } from './utils/subscriptionManager';

// // Initialize Stripe
// const stripe = new Stripe('pk_test_51R0akTGxXKAKpnT0copJ7lzxOEwFAdijm4YdgrZT4zWWkp4iFZ8hriUCumG1No5cCpbSmlY4g0Vl9GHGtThsoaMF00zBbYiOuA', {
//   apiVersion: '2023-10-16'
// });

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
app.use('/api/subscriptions', authenticate, subscriptionRoutes);
app.use('/api/payments', authenticate, paymentRoutes);
app.use('/api/payments/webhook', webhookRoutes);

// Error handling
app.use(errorHandler);

// Schedule recurring payment processing
cron.schedule('0 0 * * *', async () => {
  try {
    console.info('Running scheduled subscription renewal check');
    await processRecurringPayments();
  } catch (error) {
    console.error('Error processing recurring payments:', error);
  }
});

// Start server
const startServer = async () => {
  try {
    await connectDatabase();
    app.listen(PORT, () => {
      console.info(`Payment service running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();