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