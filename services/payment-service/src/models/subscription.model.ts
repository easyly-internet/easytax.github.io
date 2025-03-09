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