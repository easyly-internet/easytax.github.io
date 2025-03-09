// services/payment-service/src/routes/payment.routes.ts
import { Router } from 'express';
import {
  createPayment,
  getPaymentStatus,
  getPaymentsByMember
} from '../controllers/payment.controller';

const router = Router();

// Create payment
router.post('/', createPayment);

// Get payment status
router.get('/:paymentId', getPaymentStatus);

// Get member payments
router.get('/member/:memberId', getPaymentsByMember);

export default router;