// services/payment-service/src/routes/webhook.routes.ts
import { Router } from 'express';
import { handleStripeWebhook } from '../controllers/webhook.controller';

const router = Router();

// Handle Stripe webhook
router.post('/stripe', handleStripeWebhook);

export default router;