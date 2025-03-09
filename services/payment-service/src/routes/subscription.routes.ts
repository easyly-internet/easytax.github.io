// services/payment-service/src/routes/subscription.routes.ts
import { Router } from 'express';
import { 
  getSubscriptionPlans, 
  getMemberSubscription, 
  createSubscription, 
  cancelSubscription,
  getSubscriptionPayments 
} from '../controllers/subscription.controller';

const router = Router();

// Get subscription plans
router.get('/plans', getSubscriptionPlans);

// Get member subscription
router.get('/member/:memberId', getMemberSubscription);

// Create subscription
router.post('/', createSubscription);

// Cancel subscription
router.patch('/:subscriptionId/cancel', cancelSubscription);

// Get subscription payment history
router.get('/:subscriptionId/payments', getSubscriptionPayments);

export default router;